import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Gltf } from '@react-three/drei';
import { useStore, type Building } from '../../store';
import { BUILDING_DATA } from '../../data/BuildingData';
import { useModelSize } from '../../hooks/useModelSize';
import * as THREE from 'three';

interface Props {
    data: Building;
    visible?: boolean;
}

export const BuildingObject = ({ data, visible = true }: Props) => {
    const { id, type, position, rotation } = data; // Destructure id here
    const { pickupBuilding } = useStore();
    const isSelected = false; // "Selected" state is now transitory (pickup), so visual selection is moot
    const meshRef = useRef<THREE.Group>(null);
    const def = BUILDING_DATA[type];

    // Get auto-calculated size & offset for centering
    // Note: This might cause a slight "pop" when loading if not preloaded, 
    // but typically GLTF cache handles it.
    const { offset } = useModelSize(def.modelUrl, def.scale || 1);

    const [hovered, setHover] = useState(false);

    // Animation loop
    useFrame((state) => {
        if (!meshRef.current) return;
        // The "selected" animation is no longer needed as selection is transitory (pickup)
        // and the lifted building is handled by the LiftedBuilding component.
        // We ensure the building remains at y=0.
        meshRef.current.position.y = 0;
    });

    const handleClick = (e: any) => {
        // Prevent interaction if we are placing a building or moving another one
        const store = useStore.getState();
        if (store.placementMode || store.liftedBuilding) {
            return;
        }

        e.stopPropagation();
        pickupBuilding(id);
    };

    return (
        <group position={new THREE.Vector3(...position)} rotation={[0, rotation, 0]} visible={visible} ref={meshRef}>
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
