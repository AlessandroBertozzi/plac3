import type { BuildingType } from "../store";

export interface BuildingDef {
    id: BuildingType;
    label: string;
    width: number; // in grid cells
    depth: number; // in grid cells
    modelUrl?: string; // Path to .glb (optional for now)
    scale?: number;
    color: string;
}

export const BUILDING_DATA: Record<BuildingType, BuildingDef> = {
    house: {
        id: 'house',
        label: 'Forest House',
        width: 1,
        depth: 1,
        modelUrl: '/models/forest_house.glb',
        scale: 0.5,
        color: '#4287f5'
    },
    shop: {
        id: 'shop',
        label: 'Factory (Avocado)',
        width: 2,
        depth: 2,
        modelUrl: '/models/futuristic_building-transformed.glb',
        scale: 0.5, // Avocado model is quite small usually
        color: '#e06c75'
    },
    road: {
        id: 'road',
        label: 'Vehicle (Buggy)',
        width: 1, // Will be overridden by auto-size
        depth: 1, // Will be overridden by auto-size
        modelUrl: '/models/buggy.glb',
        scale: 0.05, // Buggy is huge in raw units usually
        color: '#333333'
    }
};
