import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import { Grid, Plane, Gltf } from '@react-three/drei';
import { useStore } from '../../store';
import { BUILDING_DATA } from '../../data/BuildingData';
import { useModelSize } from '../../hooks/useModelSize';
import * as THREE from 'three';

// --- GHOST COMPONENTS ---

const AutoGhost = ({ hoverPos, def, onSizeChange, isValid }: { hoverPos: [number, number, number], def: any, onSizeChange: (w: number, d: number) => void, isValid: boolean }) => {
    // Only called if def.modelUrl exists
    const { width, depth, offset } = useModelSize(def.modelUrl, def.scale || 1);

    // Update parent ref with actual size
    useEffect(() => {
        onSizeChange(width, depth);
    }, [width, depth, onSizeChange]);

    // Calculate snapped position using the GLB's size
    const xOffset = width % 2 !== 0 ? 0.5 : 0;
    const zOffset = depth % 2 !== 0 ? 0.5 : 0;
    const x = Math.floor(hoverPos[0]) + xOffset;
    const z = Math.floor(hoverPos[2]) + zOffset;

    return (
        <group position={[x, 0, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshBasicMaterial color={isValid ? "#00ffff" : "#ff0000"} transparent opacity={0.5} />
            </mesh>
            <Gltf src={def.modelUrl!} scale={def.scale || 1} position={offset || [0, 0, 0]} />
        </group>
    );
};

const SimpleGhost = ({ hoverPos, def, onSizeChange, isValid }: { hoverPos: [number, number, number], def: any, onSizeChange: (w: number, d: number) => void, isValid: boolean }) => {
    const width = def.width || 1;
    const depth = def.depth || 1;

    useEffect(() => {
        onSizeChange(width, depth);
    }, [width, depth, onSizeChange]);

    const xOffset = width % 2 !== 0 ? 0.5 : 0;
    const zOffset = depth % 2 !== 0 ? 0.5 : 0;
    const x = Math.floor(hoverPos[0]) + xOffset;
    const z = Math.floor(hoverPos[2]) + zOffset;

    return (
        <group position={[x, 0, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshBasicMaterial color={isValid ? def.color : "#ff0000"} transparent opacity={0.4} />
            </mesh>
            <mesh position={[0, 0.5, 0]}>
                <boxGeometry args={[width, 1, depth]} />
                <meshStandardMaterial color={isValid ? def.color : "#ff0000"} transparent opacity={0.5} />
            </mesh>
        </group>
    );
};

const PlacementLogic = ({
    hoverPos,
    activeDef,
    onSizeChange,
    isValid
}: {
    hoverPos: [number, number, number] | null,
    activeDef: any,
    onSizeChange: (w: number, d: number) => void,
    isValid: boolean
}) => {
    if (!hoverPos || !activeDef) return null;

    if (activeDef.modelUrl) {
        return <AutoGhost hoverPos={hoverPos} def={activeDef} onSizeChange={onSizeChange} isValid={isValid} />;
    }

    return <SimpleGhost hoverPos={hoverPos} def={activeDef} onSizeChange={onSizeChange} isValid={isValid} />;
};

// --- MAIN GRID COMPONENT ---

export const GameGrid = () => {
    const { placementMode, addBuilding, selectedBuildingId, updateBuildingPosition, buildings } = useStore();
    const [cursorPos, setCursorPos] = useState<[number, number, number] | null>(null);
    const [isValid, setIsValid] = useState(true);

    const currentDef = placementMode ? BUILDING_DATA[placementMode] : null;
    const ghostSizeRef = useRef({ width: 1, depth: 1 });

    // --- COLLISION MAP CALCULATION ---
    const occupiedCells = useMemo(() => {
        const set = new Set<string>();
        buildings.forEach(b => {
            // Determine size: prefer stored dims, fallback to static def, fallback to 1x1
            const def = BUILDING_DATA[b.type];
            const w = b.dimensions?.width || def.width;
            const d = b.dimensions?.depth || def.depth;

            // Calculate occupied integer cells for this building
            // Center is b.position (e.g. 5.5, 0, 3.5 for 1x1) or (3,0,3 for 2x2?)
            // We need to reverse the snap logic slightly to get the "min" cell top-left.

            // Example 1x1 at 5.5 => Cell 5
            // Example 2x2 at 3.0 => Offset was 0? wait.
            // Snap logic: 
            // Odd (1): x = floor(p.x) + 0.5. Input 5 -> 5.5.
            // Even (2): x = floor(p.x) + 0. Input 5.5 -> 5.

            // So if building is at X, knowing Width W:
            // Center = X. 
            // Min = X - W/2. 
            // Range = [Minimize..Max]

            const startX = Math.round(b.position[0] - w / 2);
            const startZ = Math.round(b.position[2] - d / 2);

            for (let i = 0; i < w; i++) {
                for (let j = 0; j < d; j++) {
                    set.add(`${startX + i},${startZ + j}`);
                }
            }
        });
        return set;
    }, [buildings]);

    // --- HELPER: CHECK GHOST VALIDITY ---
    const checkCollision = (cx: number, cz: number, w: number, d: number) => {
        // Calculate cells ghost would occupy
        // Ghost Center is (cx, 0, cz)
        const startX = Math.round(cx - w / 2);
        const startZ = Math.round(cz - d / 2);

        for (let i = 0; i < w; i++) {
            for (let j = 0; j < d; j++) {
                if (occupiedCells.has(`${startX + i},${startZ + j}`)) {
                    return true; // Collision
                }
            }
        }
        return false;
    };


    const updateGhostSize = (w: number, d: number) => {
        ghostSizeRef.current = { width: w, depth: d };
    };

    const getSnapped = (point: THREE.Vector3, w: number, d: number) => {
        const xOffset = w % 2 !== 0 ? 0.5 : 0;
        const zOffset = d % 2 !== 0 ? 0.5 : 0;
        return [Math.floor(point.x) + xOffset, 0, Math.floor(point.z) + zOffset];
    };

    const handlePointerMove = (e: any) => {
        setCursorPos([e.point.x, 0, e.point.z]);

        // Check collision on move for instant feedback
        if (placementMode && currentDef) {
            const w = ghostSizeRef.current.width; // Use current ref size (lag 1 frame ok)
            const d = ghostSizeRef.current.depth;
            const snapped = getSnapped(e.point, w, d);

            // Check collision
            const collided = checkCollision(snapped[0], snapped[2], w, d);
            setIsValid(!collided);
        }
    };

    const handleClick = (e: any) => {
        if (e.button !== 0) return;

        const width = ghostSizeRef.current.width || currentDef?.width || 1;
        const depth = ghostSizeRef.current.depth || currentDef?.depth || 1;

        if (selectedBuildingId) {
            const b = useStore.getState().buildings.find(b => b.id === selectedBuildingId);
            if (b) {
                const def = BUILDING_DATA[b.type];
                // For moving, we should ideally use the stored dimensions
                const w = b.dimensions?.width || def.width;
                const d = b.dimensions?.depth || def.depth;

                const pos = getSnapped(e.point, w, d);

                // TODO: Collision check for move (exclude self)
                updateBuildingPosition(selectedBuildingId, [pos[0], 0, pos[2]]);
            }
            return;
        }

        if (placementMode && currentDef) {
            const pos = getSnapped(e.point, width, depth);

            // Final Validation before add
            if (checkCollision(pos[0], pos[2], width, depth)) {
                console.log("Collision detected! Blocked.");
                return;
            }

            addBuilding({
                id: crypto.randomUUID(),
                type: placementMode,
                position: [pos[0], 0, pos[2]],
                rotation: 0,
                dimensions: { width, depth } // Store calculated dimensions!
            });
        }
    };

    return (
        <group>
            <Grid args={[50, 50]} cellSize={1} cellThickness={0.5} cellColor="#6f6f6f" sectionSize={5} sectionThickness={1} sectionColor="#9d4b4b" fadeDistance={30} infiniteGrid />

            <Plane args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} visible={false} onPointerMove={handlePointerMove} onClick={handleClick} />

            <Suspense fallback={null}>
                <PlacementLogic hoverPos={cursorPos} activeDef={currentDef} onSizeChange={updateGhostSize} isValid={isValid} />
            </Suspense>

            {selectedBuildingId && !placementMode && cursorPos && (
                <mesh position={[Math.floor(cursorPos[0]) + 0.5, 0.05, Math.floor(cursorPos[2]) + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1, 1]} />
                    <meshBasicMaterial color="yellow" transparent opacity={0.3} />
                </mesh>
            )}
        </group>
    );
};
