import { useRef, useState, useEffect, Suspense, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Grid, Plane, Gltf } from '@react-three/drei';
import { useStore, type Building } from '../../store';
import { BUILDING_DATA } from '../../data/BuildingData';
import { useModelSize } from '../../hooks/useModelSize';
import * as THREE from 'three';

// --- GHOST COMPONENTS ---

// --- GHOST RENDERER ---
// Merges AutoGhost and SimpleGhost logic
const GhostRenderer = ({ hoverPos, def, onSizeChange, isValid, isLifted = false }: { hoverPos: [number, number, number], def: any, onSizeChange: (w: number, d: number) => void, isValid: boolean, isLifted?: boolean }) => {
    // Always call hook (rules of hooks), but rely on def dimensions if no URL
    const { width: modelW, depth: modelD, offset } = useModelSize(def.modelUrl, def.scale || 1);

    // Determine actual dimensions to use
    const width = def.modelUrl ? modelW : (def.width || 1);
    const depth = def.modelUrl ? modelD : (def.depth || 1);

    const groupRef = useRef<THREE.Group>(null);

    // Update parent ref with actual size
    useEffect(() => {
        onSizeChange(width, depth);
    }, [width, depth, onSizeChange]);

    useFrame((state) => {
        if (!groupRef.current) return;
        if (isLifted) {
            const t = state.clock.getElapsedTime();
            groupRef.current.position.y = Math.abs(Math.sin(t * 5)) * 0.5;
        } else {
            groupRef.current.position.y = 0;
        }
    });

    const xOffset = width % 2 !== 0 ? 0.5 : 0;
    const zOffset = depth % 2 !== 0 ? 0.5 : 0;
    const x = Math.floor(hoverPos[0]) + xOffset;
    const z = Math.floor(hoverPos[2]) + zOffset;

    return (
        <group position={[x, 0, z]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshBasicMaterial color={isValid ? (def.modelUrl ? "#00ffff" : def.color) : "#ff0000"} transparent opacity={0.4} />
            </mesh>

            <group ref={groupRef}>
                {def.modelUrl ? (
                    <Gltf src={def.modelUrl} scale={def.scale || 1} position={offset || [0, 0, 0]} />
                ) : (
                    <mesh position={[0, 0.5, 0]}>
                        <boxGeometry args={[width, 1, depth]} />
                        <meshStandardMaterial color={isValid ? def.color : "#ff0000"} transparent opacity={0.5} />
                    </mesh>
                )}
            </group>
        </group>
    );
};

// --- HIGHLIGHT RENDERER ---
// Extracts context/hover footprint logic
const BuildingHighlight = ({ targetId, buildings }: { targetId: string, buildings: Building[] }) => {
    const b = buildings.find(b => b.id === targetId);
    if (!b) return null;

    const def = BUILDING_DATA[b.type];
    const w = b.dimensions?.width || def.width;
    const d = b.dimensions?.depth || def.depth;

    // Cyan color for all states
    const color = "#00ffff";

    return (
        <group position={[b.position[0], 0.1, b.position[2]]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[w, d]} />
                <meshBasicMaterial color={color} transparent opacity={0.3} />
            </mesh>
            <lineSegments position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <edgesGeometry args={[new THREE.PlaneGeometry(w, d)]} />
                <lineBasicMaterial color="#0088aa" linewidth={2} />
            </lineSegments>
        </group>
    );
};

const PlacementLogic = ({
    hoverPos,
    activeDef,
    onSizeChange,
    isValid,
    isLifted = false
}: {
    hoverPos: [number, number, number] | null,
    activeDef: any,
    onSizeChange: (w: number, d: number) => void,
    isValid: boolean,
    isLifted?: boolean
}) => {
    if (!hoverPos || !activeDef) return null;
    // Remount on ID change to ensure hooks reset cleanly if type changes
    return <GhostRenderer key={activeDef.id} hoverPos={hoverPos} def={activeDef} onSizeChange={onSizeChange} isValid={isValid} isLifted={isLifted} />;
};

// --- MAIN GRID COMPONENT ---

export const GameGrid = () => {
    const {
        placementMode,
        setPlacementMode,
        addBuilding,
        liftedBuilding,
        dropBuilding,
        cancelPickup,
        contextMenu,
        hoveredBuildingId,
        buildings
    } = useStore();

    const [cursorPos, setCursorPos] = useState<[number, number, number] | null>(null);
    const [isValid, setIsValid] = useState(true);

    const currentDef = placementMode ? BUILDING_DATA[placementMode] : null;
    const ghostSizeRef = useRef({ width: 1, depth: 1 });

    // --- COLLISION MAP CALCULATION ---
    // Stores "x,y" -> "buildingId"
    const occupiedCells = useMemo(() => {
        const map = new Map<string, string>();
        // Filter out the lifted building from the occupied cells map
        buildings.filter(b => b.id !== liftedBuilding?.id).forEach(b => {
            const def = BUILDING_DATA[b.type];
            const w = b.dimensions?.width || def.width;
            const d = b.dimensions?.depth || def.depth;

            const startX = Math.round(b.position[0] - w / 2);
            const startZ = Math.round(b.position[2] - d / 2);

            for (let i = 0; i < w; i++) {
                for (let j = 0; j < d; j++) {
                    map.set(`${startX + i},${startZ + j}`, b.id);
                }
            }
        });
        return map;
    }, [buildings, liftedBuilding]);

    // --- HELPER: CHECK GHOST VALIDITY ---
    // No more ignoreId needed because lifted building is not in 'buildings' list
    const checkCollision = (cx: number, cz: number, w: number, d: number) => {
        const startX = Math.round(cx - w / 2);
        const startZ = Math.round(cz - d / 2);

        for (let i = 0; i < w; i++) {
            for (let j = 0; j < d; j++) {
                const key = `${startX + i},${startZ + j}`;
                if (occupiedCells.has(key)) {
                    return true;
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
        const target = placementMode ? currentDef : (liftedBuilding ? BUILDING_DATA[liftedBuilding.type] : null);

        if (target) {
            const def = target;
            // Use current ghost size if placing, or building def size if lifting
            // Actually ghostSizeRef is updated by the rendered Ghost component
            const w = placementMode ? ghostSizeRef.current.width : (liftedBuilding?.dimensions?.width || def?.width || 1);
            const d = placementMode ? ghostSizeRef.current.depth : (liftedBuilding?.dimensions?.depth || def?.depth || 1);

            const snapped = getSnapped(e.point, w, d);
            setIsValid(!checkCollision(snapped[0], snapped[2], w, d));
        }
    };

    const handleClick = (e: any) => {
        if (e.button !== 0) return;

        const width = ghostSizeRef.current.width || currentDef?.width || 1;
        const depth = ghostSizeRef.current.depth || currentDef?.depth || 1;

        if (liftedBuilding) {
            const def = BUILDING_DATA[liftedBuilding.type];
            const w = liftedBuilding.dimensions?.width || def.width;
            const d = liftedBuilding.dimensions?.depth || def.depth;
            const pos = getSnapped(e.point, w, d);

            if (checkCollision(pos[0], pos[2], w, d)) {
                console.log("Drop blocked: Collision");
                return;
            }
            dropBuilding([pos[0], 0, pos[2]]);
            return;
        }

        if (placementMode && currentDef) {
            const pos = getSnapped(e.point, width, depth);
            if (checkCollision(pos[0], pos[2], width, depth)) {
                console.log("Collision detected! Blocked.");
                return;
            }
            addBuilding({
                id: crypto.randomUUID(),
                type: placementMode,
                position: [pos[0], 0, pos[2]],
                rotation: 0,
                dimensions: { width, depth }
            });
            setPlacementMode(null);
        }
    };

    // Calculate Highlight Target
    const highlightTargetId = contextMenu?.buildingId || hoveredBuildingId;

    return (
        <group>
            <Grid args={[50, 50]} cellSize={1} cellThickness={0.5} cellColor="#6f6f6f" sectionSize={5} sectionThickness={1} sectionColor="#9d4b4b" fadeDistance={30} infiniteGrid />

            <Plane
                args={[100, 100]}
                rotation={[-Math.PI / 2, 0, 0]}
                visible={false}
                onPointerMove={handlePointerMove}
                onClick={handleClick}
                onContextMenu={(e) => {
                    e.nativeEvent.preventDefault();
                    cancelPickup();
                    setPlacementMode(null);
                }}
            />

            {/* Placement Ghost */}
            <Suspense fallback={null}>
                {currentDef && cursorPos && (
                    <PlacementLogic hoverPos={cursorPos} activeDef={currentDef} onSizeChange={updateGhostSize} isValid={isValid} />
                )}
            </Suspense>

            {/* Lifted Building Ghost */}
            <Suspense fallback={null}>
                {liftedBuilding && cursorPos && (
                    <PlacementLogic
                        hoverPos={cursorPos}
                        activeDef={BUILDING_DATA[liftedBuilding.type]}
                        onSizeChange={updateGhostSize} // Still need to update ghost size for collision checks
                        isValid={isValid}
                        isLifted={true}
                    />
                )}
            </Suspense>

            {/* Selection / Context Menu Highlight */}
            {highlightTargetId && (
                <BuildingHighlight targetId={highlightTargetId} buildings={buildings} />
            )}
        </group>
    );
};
