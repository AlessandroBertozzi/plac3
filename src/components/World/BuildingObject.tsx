import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Gltf } from '@react-three/drei';
import { useStore, type Building } from '../../store';
import { BUILDING_DATA } from '../../data/BuildingData';
import { useModelSize } from '../../hooks/useModelSize';
import * as THREE from 'three';

interface Props {
    data: Building;
}

export const BuildingObject = ({ data }: Props) => {
    const { selectedBuildingId, setSelection } = useStore();
    const isSelected = selectedBuildingId === data.id;
    const meshRef = useRef<THREE.Group>(null);
    const def = BUILDING_DATA[data.type];

    // Get auto-calculated size & offset for centering
    // Note: This might cause a slight "pop" when loading if not preloaded, 
    // but typically GLTF cache handles it.
    const { offset } = useModelSize(def.modelUrl, def.scale || 1);

    const [hovered, setHover] = useState(false);

    // Animation loop
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
        e.stopPropagation();
        setSelection(data.id);
    };

    return (
        <group position={data.position} ref={meshRef}>
            {/* If modelUrl exists, load GLB. Otherwise default to box shape. */}
            {def.modelUrl ? (
                <Gltf
                    src={def.modelUrl}
                    scale={def.scale || 1}
                    position={offset || [0, 0, 0]}
                    onClick={handleClick}
                    onPointerOver={() => setHover(true)}
                    onPointerOut={() => setHover(false)}
                />
            ) : (
                <group position={[0, 0.5, 0]}>
                    <RoundedBox
                        args={[def.width, 1, def.depth]}
                        radius={0.1}
                        smoothness={4}
                        onClick={handleClick}
                        onPointerOver={() => setHover(true)}
                        onPointerOut={() => setHover(false)}
                    >
                        <meshStandardMaterial
                            color={isSelected ? "#ffd700" : (hovered ? "#6fa8dc" : def.color)}
                            metalness={0.2}
                            roughness={0.8}
                        />
                    </RoundedBox>
                </group>
            )}
        </group>
    );
};
