import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

export function useModelSize(url: string | undefined, scale: number = 1) {
    // If no URL, return 1x1 default (or 0x0 if you prefer)
    // useGLTF will suspend. To avoid suspending the entire UI, 
    // this hook should ideally be used inside a Suspense boundary 
    // or we catch the promise. 
    // However, for simplicity here, we assume standard usage.

    // Note: We can't conditionally call hooks.
    // We pass null to useGLTF if no url, but useGLTF expects a string usually.
    // We'll use a dummy or skip if undefined.

    if (!url) return { width: 1, depth: 1, offset: undefined, originalSize: undefined, loaded: false };

    const { scene } = useGLTF(url);

    const size = useMemo(() => {
        if (!scene) return { width: 1, depth: 1, offset: undefined, originalSize: undefined };

        const box = new THREE.Box3().setFromObject(scene);
        const sizeVec = new THREE.Vector3();
        box.getSize(sizeVec);

        // Apply scale
        sizeVec.multiplyScalar(scale);

        // Calculate center offset to align model to (0,0,0)
        // We want (0,0,0) to be the bottom-center of the bounding box
        const center = new THREE.Vector3();
        box.getCenter(center);
        center.multiplyScalar(scale);

        // If the model pivot is at (0,0,0) but the geometry is at (10, 0, 10), center is (10, H/2, 10).
        // We want to shift by (-10, 0, -10). 
        // Note: box.min.y * scale might be needed if pivot is properly at feet but geometry starts below/above.
        // Usually we want to shift X and Z to center, and shift Y so min.y is at 0.

        const min = box.min.clone().multiplyScalar(scale);

        const offset = new THREE.Vector3(
            -center.x,
            -min.y, // Align bottom to 0
            -center.z
        );

        // Ceil to nearest integer for grid cells
        // We assume Y is up
        return {
            width: Math.ceil(sizeVec.x),
            depth: Math.ceil(sizeVec.z),
            offset: offset,
            originalSize: sizeVec
        };
    }, [scene, scale]);

    return { ...size, loaded: true };
}
