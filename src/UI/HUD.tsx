import { Home, Factory, Milestone, MousePointer2, Trash2 } from 'lucide-react';
import { useStore, type BuildingType } from '../store';
import clsx from 'clsx';

export const HUD = () => {
    const { placementMode, setPlacementMode, selectedBuildingId, removeBuilding } = useStore();

    const modes: { id: BuildingType | 'select'; icon: any; label: string }[] = [
        { id: 'select', icon: MousePointer2, label: 'Select' },
        { id: 'house', icon: Home, label: 'House' },
        { id: 'shop', icon: Factory, label: 'Industry' },
        { id: 'road', icon: Milestone, label: 'Road' },
    ];

    const handleDelete = () => {
        if (selectedBuildingId) {
            removeBuilding(selectedBuildingId);
            useStore.getState().setSelection(null);
        }
    };

    return (
        <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
            {/* Top Bar */}
            <div className="flex justify-between items-start pointer-events-auto">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-white shadow-lg">
                    <h1 className="text-xl font-bold">City Builder 3D</h1>
                    <p className="text-xs text-white/50 opacity-80">Isometric Placement System</p>
                </div>

                {/* Selected Info */}
                {selectedBuildingId && (
                    <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20 text-white shadow-lg flex gap-4 items-center animate-in fade-in slide-in-from-right-4">
                        <div>
                            <h2 className="font-bold">Building Selected</h2>
                            <p className="text-xs text-white/50">{selectedBuildingId.slice(0, 8)}</p>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded-lg transition-colors border border-red-500/30"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Bar (Toolbar) */}
            <div className="flex justify-center pointer-events-auto">
                <div className="bg-black/80 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl flex gap-2">
                    {modes.map((mode) => {
                        const isActive = mode.id === 'select' ? !placementMode : placementMode === mode.id;
                        const Icon = mode.icon;

                        return (
                            <button
                                key={mode.id}
                                onClick={() => setPlacementMode(mode.id === 'select' ? null : mode.id as BuildingType)}
                                className={clsx(
                                    "p-4 rounded-xl transition-all duration-200 flex flex-col items-center gap-1 min-w-[80px] group",
                                    isActive
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20 scale-105"
                                        : "hover:bg-white/10 text-white/60 hover:text-white"
                                )}
                            >
                                <Icon size={24} className={clsx("transition-transform duration-300", isActive && "scale-110", "group-hover:scale-110")} />
                                <span className="text-[10px] font-medium uppercase tracking-wider">{mode.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
