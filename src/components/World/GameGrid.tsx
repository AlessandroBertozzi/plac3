import { useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { Grid, Plane } from '@react-three/drei';
import { useStore } from '../../store';
import * as THREE from 'three';

export const GameGrid = () => {
    const { placementMode, addBuilding, selectedBuildingId, updateBuildingPosition } = useStore();
    const [hoverPos, setHoverPos] = useState<[number, number, number] | null>(null);
    const planeRef = useRef<THREE.Mesh>(null);

    const handlePointerMove = (e: any) => {
        // Snap to center of 1x1 cells
        // Grid is at 0,0. Lines are likely at integers if cellSize=1.
        // We want to center between lines.
        const x = Math.floor(e.point.x) + 0.5;
        const z = Math.floor(e.point.z) + 0.5;

        // If dragging a selected building?
        // TODO: Dragging logic here

        setHoverPos([x, 0, z]);
    };

    const handleClick = (e: any) => {
        if (e.button !== 0) return; // Left click only

        const x = Math.floor(e.point.x) + 0.5;
        const z = Math.floor(e.point.z) + 0.5;

        if (placementMode) {
            addBuilding({
                id: crypto.randomUUID(),
                type: placementMode,
                position: [x, 0.5, z], // 0.5 y-offset for 1-unit height box
                rotation: 0
            });
        } else if (selectedBuildingId) {
            // Move selected building here? 
            // For now, click empty space deselects?
            // or moves?
            updateBuildingPosition(selectedBuildingId, [x, 0.5, z]);
        }
    };

    return (
        <group>
            {/* Visual Grid */}
            <Grid
                args={[50, 50]}
                cellSize={1}
                cellThickness={0.5}
                cellColor="#6f6f6f"
                sectionSize={5}
                sectionThickness={1}
                sectionColor="#9d4b4b"
                fadeDistance={30}
                infiniteGrid
            />

            {/* Invisible Plane for Raycasting */}
            <Plane
                args={[100, 100]}
                rotation={[-Math.PI / 2, 0, 0]}
                visible={false}
                onPointerMove={handlePointerMove}
                onClick={handleClick}
            />

            {/* Ghost Preview */}
            {placementMode && hoverPos && (
                <mesh position={[hoverPos[0], 0.5, hoverPos[2]]}>
                    <boxGeometry args={[1, 1, 1]} />
                    <meshStandardMaterial color="#4287f5" transparent opacity={0.5} />
                </mesh>
            )}

            {/* Selected Indicator/Preview Move */}
            {selectedBuildingId && !placementMode && hoverPos && (
                <mesh position={[hoverPos[0], 0.05, hoverPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1.2, 1.2]} />
                    <meshBasicMaterial color="yellow" transparent opacity={0.3} />
                </mesh>
            )}
        </group>
    );
};
