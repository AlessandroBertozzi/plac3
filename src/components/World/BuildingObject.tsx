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

const BuildingMesh = ({ def, id, events, isPlacementOrLift }: { def: any, id: string, events: any, isPlacementOrLift: boolean }) => {
    const { offset } = useModelSize(def.modelUrl, def.scale || 1);
    const hoveredBuildingId = useStore(state => state.hoveredBuildingId);

    // Common props for both mesh types
    const commonProps = {
        onPointerOver: events.onPointerOver,
        onPointerOut: events.onPointerOut,
        raycast: isPlacementOrLift ? () => null : undefined
    };

    if (def.modelUrl) {
        return (
            <Gltf
                src={def.modelUrl}
                scale={def.scale || 1}
                position={offset || [0, 0, 0]}
                {...commonProps}
            />
        );
    }

    return (
        <group position={[0, 0.5, 0]}>
            <RoundedBox
                args={[def.width, 1, def.depth]}
                radius={0.1}
                smoothness={4}
                {...commonProps}
            >
                <meshStandardMaterial
                    color={id === hoveredBuildingId ? "#6fa8dc" : def.color}
                    metalness={0.2}
                    roughness={0.8}
                />
            </RoundedBox>
        </group>
    );
};

export const BuildingObject = ({ data, visible = true }: Props) => {
    const { id, type, position, rotation } = data;
    const { pickupBuilding, setHoveredBuildingId } = useStore();
    const contextMenu = useStore(state => state.contextMenu);
    const meshRef = useRef<THREE.Group>(null);
    const def = BUILDING_DATA[type];

    // Animation loop
    useFrame((state) => {
        if (!meshRef.current) return;
        const isCtxTarget = contextMenu?.buildingId === id;

        if (isCtxTarget) {
            const t = state.clock.getElapsedTime();
            meshRef.current.position.y = Math.abs(Math.sin(t * 5)) * 0.5;
        } else {
            meshRef.current.position.y = 0;
        }
    });

    const handleClick = (e: any) => {
        const store = useStore.getState();
        if (store.placementMode || store.liftedBuilding) return;

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
        const store = useStore.getState();
        if (store.placementMode || store.liftedBuilding) return;

        e.stopPropagation();
        setHoveredBuildingId(id);
        // Important: Update cursor pos so if we lift this building, 
        // the ghost knows where to start (instead of jumping to last known ground pos)
        store.setCursorPos([e.point.x, 0, e.point.z]);
    };

    const handlePointerOut = (_e: any) => {
        setHoveredBuildingId(null);
    };

    const handlePointerMove = (e: any) => {
        const store = useStore.getState();
        if (store.placementMode || store.liftedBuilding) return;

        e.stopPropagation();
        // Continuously update cursor pos while moving over the building
        store.setCursorPos([e.point.x, 0, e.point.z]);
    };

    const isPlacementOrLift = useStore(state => !!state.placementMode || !!state.liftedBuilding);

    const eventHandlers = {
        onPointerOver: handlePointerOver,
        onPointerOut: handlePointerOut,
        onPointerMove: handlePointerMove
    };

    return (
        <group
            position={new THREE.Vector3(...position)}
            rotation={[0, rotation, 0]}
            visible={visible}
            ref={meshRef}
            onClick={handleClick}
            onContextMenu={handleContextMenu}
            raycast={isPlacementOrLift ? () => null : undefined}
        >
            <BuildingMesh
                def={def}
                id={id}
                events={eventHandlers}
                isPlacementOrLift={isPlacementOrLift}
            />
        </group>
    );
};
