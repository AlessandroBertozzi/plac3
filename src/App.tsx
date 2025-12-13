import { Scene } from './components/Scene';
import { HUD } from './UI/HUD';

function App() {
  return (
    <div className="relative w-full h-full bg-gray-900">
      <Scene />
      <HUD />
    </div>
  );
}

export default App;
