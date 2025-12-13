import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useStore, type Building } from '../../store';
import * as THREE from 'three';

interface Props {
    data: Building;
}

export const BuildingObject = ({ data }: Props) => {
    const { selectedBuildingId, setSelection } = useStore();
    const isSelected = selectedBuildingId === data.id;
    const meshRef = useRef<THREE.Mesh>(null);

    const [hovered, setHover] = useState(false);

    // Simple animation loop for hover/selection
    useFrame((state) => {
        if (!meshRef.current) return;
        const t = state.clock.getElapsedTime();
        if (isSelected) {
            meshRef.current.position.y = Math.sin(t * 5) * 0.1;
        } else {
            meshRef.current.position.y = 0;
        }
    });

    const handleClick = (e: any) => {
        e.stopPropagation(); // Prevent clicking grid
        setSelection(data.id);
    };

    return (
        <group position={data.position}>
            <RoundedBox
                ref={meshRef}
                args={[1, 1, 1]}
                radius={0.1}
                smoothness={4}
                onClick={handleClick}
                onPointerOver={() => setHover(true)}
                onPointerOut={() => setHover(false)}
            >
                <meshStandardMaterial
                    color={isSelected ? "#ffd700" : (hovered ? "#6fa8dc" : "#4287f5")}
                    metalness={0.2}
                    roughness={0.8}
                />
            </RoundedBox>
        </group>
    );
};
