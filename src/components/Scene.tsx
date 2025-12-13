import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import { GameGrid } from './World/GameGrid';
import { BuildingObject } from './World/BuildingObject';
import { useStore } from '../store';

export const Scene = () => {
    const buildings = useStore(s => s.buildings);
    const selectedBuildingId = useStore(s => s.selectedBuildingId);
    const sunPosition = useStore(s => s.sunPosition);

    return (
        <Canvas shadows dpr={[1, 2]} className="bg-gray-900">
            <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={40} near={-50} far={200} />
            <OrbitControls makeDefault enableRotate={true} minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} minZoom={20} maxZoom={100} />

            <ambientLight intensity={0.5} color="#ffd4a3" />
            <directionalLight
                position={sunPosition}
                intensity={2.5}
                color="#ffebc2"
            />
            {/* Soft fill light */}
            <hemisphereLight args={["#fff0dd", "#606060", 0.6]} />

            <GameGrid />

            {buildings.map(b => (
                <BuildingObject
                    key={b.id}
                    data={b}
                    visible={b.id !== selectedBuildingId}
                />
            ))}
        </Canvas>
    );
};
