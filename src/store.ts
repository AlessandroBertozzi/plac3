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
    liftedBuilding: Building | null;
    selectedBuildingId: string | null;
    placementMode: BuildingType | null;
    sunPosition: [number, number, number]; // [x, y, z]

    addBuilding: (building: Building) => void;
    // updateBuildingPosition: (id: string, position: [number, number, number]) => void; // Deprecated by lift/drop
    removeBuilding: (id: string) => void;
    setSelection: (id: string | null) => void;

    // New Actions
    pickupBuilding: (id: string) => void;
    dropBuilding: (position: [number, number, number]) => void;
    cancelPickup: () => void;

    setPlacementMode: (type: BuildingType | null) => void;
    setSunPosition: (pos: [number, number, number]) => void;
}

export const useStore = create<GameState>((set, get) => ({
    buildings: [],
    liftedBuilding: null,
    selectedBuildingId: null,
    placementMode: null,
    sunPosition: [50, 80, 50],

    addBuilding: (b) => set((state) => ({ buildings: [...state.buildings, b] })),

    // updateBuildingPosition: removed/unused

    removeBuilding: (id) => set((state) => {
        // If the building is currently lifted, clear it
        if (state.liftedBuilding?.id === id) {
            return { liftedBuilding: null, selectedBuildingId: null };
        }
        return {
            buildings: state.buildings.filter(b => b.id !== id),
            selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId
        };
    }),

    setSelection: (id) => set({ selectedBuildingId: id }),
    setPlacementMode: (mode) => set({ placementMode: mode, selectedBuildingId: null, liftedBuilding: null }), // Reset lift on mode switch
    setSunPosition: (pos) => set({ sunPosition: pos }),

    pickupBuilding: (id) => {
        const state = get();
        const b = state.buildings.find(building => building.id === id);
        if (b) {
            set({
                liftedBuilding: b,
                buildings: state.buildings.filter(building => building.id !== id),
                selectedBuildingId: id // Keep it selected for UI
            });
        }
    },

    dropBuilding: (position) => {
        const state = get();
        if (state.liftedBuilding) {
            const updated = { ...state.liftedBuilding, position };
            set({
                buildings: [...state.buildings, updated],
                liftedBuilding: null,
                selectedBuildingId: null // Deselect after drop
            });
        }
    },

    cancelPickup: () => {
        const state = get();
        if (state.liftedBuilding) {
            // Return to original state implicitly by pushing it back
            set({
                buildings: [...state.buildings, state.liftedBuilding],
                liftedBuilding: null,
                selectedBuildingId: null
            });
        }
    }
}));
