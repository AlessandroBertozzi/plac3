import { create } from 'zustand';

export type BuildingType = 'house' | 'shop' | 'road';

export interface Building {
    id: string;
    type: BuildingType;
    position: [number, number, number];
    rotation: number;
    dimensions?: { width: number; depth: number };
}

interface GameState {
    buildings: Building[];
    selectedBuildingId: string | null;
    placementMode: BuildingType | null;

    addBuilding: (building: Building) => void;
    updateBuildingPosition: (id: string, position: [number, number, number]) => void;
    removeBuilding: (id: string) => void;
    setSelection: (id: string | null) => void;
    setPlacementMode: (type: BuildingType | null) => void;
}

export const useStore = create<GameState>((set) => ({
    buildings: [],
    selectedBuildingId: null,
    placementMode: null,

    addBuilding: (b) => set((state) => ({ buildings: [...state.buildings, b] })),

    updateBuildingPosition: (id, pos) => set((state) => ({
        buildings: state.buildings.map(b => b.id === id ? { ...b, position: pos } : b)
    })),

    removeBuilding: (id) => set((state) => ({
        buildings: state.buildings.filter(b => b.id !== id)
    })),

    setSelection: (id) => set({ selectedBuildingId: id, placementMode: null }),
    setPlacementMode: (type) => set({ placementMode: type, selectedBuildingId: null }),
}));
