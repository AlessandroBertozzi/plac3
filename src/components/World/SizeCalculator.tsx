import { Suspense, useEffect } from 'react';
import { useStore } from '../store';
import { BUILDING_DATA } from '../data/BuildingData';
import { useModelSize } from '../hooks/useModelSize';

// This component is responsible for purely calculating and updating 
// the "effective size" in the store or just acting as a reporter.
// Since useGLTF suspends, we wrap this in Suspense in the parent.

const SizeCalculator = () => {
    const { placementMode } = useStore();
    const def = placementMode ? BUILDING_DATA[placementMode] : null;

    // Only run if we have a modelUrl
    const { width, depth, loaded } = useModelSize(def?.modelUrl, def?.scale);

    // Effect to "report" this size back? or just we assume the parent uses this logic?
    // Actually, making the GRID wait for this might be annoying (flickering).
    // Better approach: Just use this to render the GHOST with correct size?
    // But we need the size for SNAPPING logic in the parent (handlePointerMove).
    // This is a circular dependency if the parent waits for child.

    // Alternative: We won't use this component to "set state".
    // We will just expose a hook that GameGrid uses, AND wrap GameGrid in Suspense.
    return null;
};
