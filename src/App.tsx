import { useEffect } from 'react';
import { Scene } from './components/Scene';
import { HUD } from './UI/HUD';
import { ContextMenu } from './UI/ContextMenu';
import { useStore } from './store';

function App() {
  const { liftedBuilding, removeBuilding, setContextMenu } = useStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (liftedBuilding) {
          removeBuilding(liftedBuilding.id);
        }
      }
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [liftedBuilding, removeBuilding, setContextMenu]);

  return (
    <div className="relative w-full h-full bg-gray-900" onContextMenu={(e) => e.preventDefault()}>
      <Scene />
      <HUD />
      <ContextMenu />
    </div>
  );
}

export default App;
