import { useRef, useEffect } from 'react';
import { useStore } from '../store';
import { Trash2 } from 'lucide-react';

export const ContextMenu = () => {
    const { contextMenu, setContextMenu, removeBuilding } = useStore();
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setContextMenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [setContextMenu]);

    if (!contextMenu) return null;

    const handleDelete = () => {
        removeBuilding(contextMenu.buildingId);
        setContextMenu(null);
    };

    return (
        <div
            ref={menuRef}
            className="absolute bg-gray-800 text-white rounded-lg shadow-xl border border-white/20 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100"
            style={{ left: contextMenu.x, top: contextMenu.y }}
        >
            <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 w-full text-left text-sm transition-colors text-red-100 hover:text-white"
            >
                <Trash2 size={16} className="text-red-400" />
                Delete Building
            </button>
        </div>
    );
};
