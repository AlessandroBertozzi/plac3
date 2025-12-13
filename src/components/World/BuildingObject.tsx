import { useRef } from 'react';
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
    const { id, type, position, rotation } = data;
    const { pickupBuilding, contextMenu, setHoveredBuildingId } = useStore(); // Subscribe to contextMenu and setter
    const isSelected = false;
    const meshRef = useRef<THREE.Group>(null);
    const def = BUILDING_DATA[type];

    const { offset } = useModelSize(def.modelUrl, def.scale || 1);

    // Animation loop
    useFrame((state) => {
        if (!meshRef.current) return;

        // Check if this building is the target of the context menu
        const isCtxTarget = contextMenu?.buildingId === id;

        // Check if we should animate (Bounce ONLY on Context Menu Target)
        // User requested NO bounce on hover.
        const shouldBounce = isCtxTarget;

        if (shouldBounce) {
            const t = state.clock.getElapsedTime();
            // Bouncing animation
            meshRef.current.position.y = Math.abs(Math.sin(t * 5)) * 0.5;
        } else {
            meshRef.current.position.y = 0;
        }
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

    const handleContextMenu = (e: any) => {
        const store = useStore.getState();
        if (store.liftedBuilding || store.placementMode) return;

        e.stopPropagation();

        useStore.getState().setContextMenu({
            x: e.nativeEvent.clientX,
            y: e.nativeEvent.clientY,
            buildingId: id
        });
    };

    const handlePointerOver = (e: any) => {
        e.stopPropagation(); // Only hover the top-most building
        setHoveredBuildingId(id);
    };

    const handlePointerOut = (e: any) => {
        // Only clear if WE were the hovered one (simple check)
        // In R3F pointer out bubbles, but we can just clear safely typically or rely on other enters
        setHoveredBuildingId(null);
    };

    return (
        <group
            position={new THREE.Vector3(...position)}
            rotation={[0, rotation, 0]}
            visible={visible}
            ref={meshRef}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
        >
            {/* If modelUrl exists, load GLB. Otherwise default to box shape. */}
            {def.modelUrl ? (
                <Gltf
                    src={def.modelUrl}
                    scale={def.scale || 1}
                    position={offset || [0, 0, 0]}
                    onPointerOver={handlePointerOver}
                    onPointerOut={handlePointerOut}
                />
            ) : (
                <group position={[0, 0.5, 0]}>
                    <RoundedBox
                        args={[def.width, 1, def.depth]}
                        radius={0.1}
                        smoothness={4}
                        onPointerOver={handlePointerOver}
                        onPointerOut={handlePointerOut}
                    >
                        <meshStandardMaterial
                            color={isSelected ? "#ffd700" : (id === useStore.getState().hoveredBuildingId ? "#6fa8dc" : def.color)}
                            metalness={0.2}
                            roughness={0.8}
                        />
                    </RoundedBox>
                </group>
            )}
        </group>
    );
};
