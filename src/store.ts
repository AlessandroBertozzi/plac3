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
    contextMenu: { x: number; y: number; buildingId: string } | null;
    hoveredBuildingId: string | null; // New state for hover

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
    setContextMenu: (menu: { x: number; y: number; buildingId: string } | null) => void;
    setHoveredBuildingId: (id: string | null) => void;
}

const DEFAULT_INTERACT_STATE = {
    selectedBuildingId: null,
    liftedBuilding: null,
    contextMenu: null,
    hoveredBuildingId: null
};

export const useStore = create<GameState>((set, get) => ({
    buildings: [],
    liftedBuilding: null,
    selectedBuildingId: null,
    placementMode: null,
    sunPosition: [50, 80, 50],
    contextMenu: null,
    hoveredBuildingId: null,

    addBuilding: (b) => set((state) => ({ buildings: [...state.buildings, b] })),

    // updateBuildingPosition: removed/unused

    removeBuilding: (id) => set((state) => {
        // If the building is currently lifted, clear it
        if (state.liftedBuilding?.id === id) {
            return { ...DEFAULT_INTERACT_STATE };
        }
        return {
            buildings: state.buildings.filter(b => b.id !== id),
            selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId
        };
    }),

    setSelection: (id) => set({ selectedBuildingId: id }),
    setPlacementMode: (mode) => set({ placementMode: mode, ...DEFAULT_INTERACT_STATE }), // Reset everything
    setSunPosition: (pos) => set({ sunPosition: pos }),
    setContextMenu: (menu) => set({ contextMenu: menu }),
    setHoveredBuildingId: (id) => set({ hoveredBuildingId: id }),

    pickupBuilding: (id) => {
        const state = get();
        const b = state.buildings.find(building => building.id === id);
        if (b) {
            set({
                liftedBuilding: b,
                buildings: state.buildings.filter(building => building.id !== id),
                selectedBuildingId: id, // Keep it selected for UI
                contextMenu: null, // Close menu if picking up
                hoveredBuildingId: null // Clear hover on pickup
            });
        }
    },

    dropBuilding: (position) => {
        const state = get();
        if (state.liftedBuilding) {
            const updated = { ...state.liftedBuilding, position };
            set({
                buildings: [...state.buildings, updated],
                ...DEFAULT_INTERACT_STATE
            });
        }
    },

    cancelPickup: () => {
        const state = get();
        if (state.liftedBuilding) {
            // Return to original state implicitly by pushing it back
            set({
                buildings: [...state.buildings, state.liftedBuilding],
                ...DEFAULT_INTERACT_STATE
            });
        }
    }
}));
// End of file
