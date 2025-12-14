# 3D Isometric Placement System

This application demonstrates a grid-based placement engine commonly found in city builders and simulation games. It focuses on the "Game Loop" of placing, arranging, and managing objects in a 3D space.

### Core Interactions
- **Drag & Drop Placement**: Select buildings from the HUD and place them on the grid.
- **Lift & Move**: Click any existing building to "lift" it up, moving it to a new location with a smooth ghost animation.
- **Smart Validation**: Visual feedback turns red when placement is invalid (overlapping) and cyan for valid positioning.
- **Grid Snapping**: Objects snap perfectly to a 1x1 logical grid while maintaining 3D visual presence.
- **Context Menu**: Long-press or Right-click buildings to access options (Rotate, specific interactions).
- **Ghost Mechanics**: Ghosts correctly handle collision detection and visual updates in real-time.

## Tech Stack
- **Core**: React 19, TypeScript, Zustand (State Management)
- **3D Engine**: Three.js via React Three Fiber (@react-three/drei)
- **Styling**: TailwindCSS v4 for UI/HUD
- **Tooling**: Vite for fast development

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` to explore.
