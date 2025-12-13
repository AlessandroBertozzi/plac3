import { Canvas } from '@react-three/fiber';
import { OrthographicCamera, OrbitControls } from '@react-three/drei';
import { GameGrid } from './World/GameGrid';
import { BuildingObject } from './World/BuildingObject';
import { useStore } from '../store';

export const Scene = () => {
    const buildings = useStore(s => s.buildings);

    return (
        <Canvas shadows dpr={[1, 2]} className="bg-gray-900">
            <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={40} near={-50} far={200} />
            <OrbitControls makeDefault enableRotate={true} minPolarAngle={0} maxPolarAngle={Math.PI / 2.1} minZoom={20} maxZoom={100} />

            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 20, 5]} intensity={1.2} castShadow />

            <GameGrid />

            {buildings.map(b => (
                <BuildingObject key={b.id} data={b} />
            ))}
        </Canvas>
    );
};
