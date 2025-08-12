# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GORET is a browser-based HTML5/JavaScript pirate ship control game with animated sea environment. It's a pure client-side game with no build system or package manager - just static HTML/CSS/JavaScript files. The game is set in the 16th-17th century pirate world and will eventually feature trading, combat, ship upgrades, crew management, and quest completion.

## Running the Game

Since this is a static web application with no build process:

1. **Local HTTP Server (Recommended to avoid CORS issues):**
   ```bash
   npx http-server -p 8000 --cors
   ```
   Then open `http://localhost:8000`

2. **Direct File Opening:**
   Open `index.html` directly in a browser (may have limitations with asset loading)

3. **Python Server Alternative:**
   ```bash
   python -m http.server 8000
   ```

## Map Editor with Multi-Circle Collision

The map editor now uses a simplified Multi-Circle collision system instead of complex polygons:

1. **Development Mode (with map editor server):**
   ```bash
   npm run dev
   ```
   This runs both the game server (port 8000) and map editor server (port 8001)

2. **Map Editor Server Only:**
   ```bash
   npm run server
   ```
   Runs the Node.js server on port 8001 for saving island data and handling image uploads

3. **Game Only (no map editor):**
   ```bash
   npm start
   ```
   Standard HTTP server without map editor functionality

### Map Editor Access
- **Primary Editor**: `http://localhost:8000/map-editor.html`
- **Features**: Multi-Circle collision editing, visual drag & drop, real-time preview
- **Collision System**: 3-5 circles per island instead of 20-50 polygon points

## Architecture

### Entry Points
- **Main Game**: `index.html` → loads all JavaScript modules in sequence
- **Map Editor**: `map-editor.html` → Multi-Circle collision world building tool

### Core Game Loop (`js/main.js`)
- `Game` class manages initialization, asset loading, game state, and render loop
- Handles zoom system, camera positioning, debug mode (F12), and pause functionality
- Game states: `loading`, `playing`, `paused`, `port`

### Key Components

1. **Ship System** (`js/ship.js`):
   - Physics: max speed 400px/s (doubled for massive ocean), acceleration 300px/s², turn speed 4 rad/s
   - 8-direction movement with inertia-based physics
   - Wake trails with configurable V-shaped bow waves
   - Collision handling with automatic repulsion

2. **Map System** (`js/map.js`):
   - 10,240×7,680 pixel ocean map (10x bigger massive ocean)
   - Two-layer animated wave system
   - 5 islands with collision boundaries
   - Map boundary constraints

3. **Multi-Circle Collision System** (`js/collision.js`):
   - **UPDATED**: Now uses 3-5 circles per island instead of complex polygons
   - Ultra-fast collision detection (10x performance improvement)
   - Simple distance calculations instead of polygon math
   - Town area entry zones
   - Visual debug mode with color-coded circles
   - Automatic position correction and ship push-back

4. **Port System** (`js/port-manager.js`):
   - Port interface with 6 services (Tavern, Shipyard, Market, etc.)
   - Modal-based UI when entering towns
   - Saint Kitts port with background image

5. **World Building**:
   - **UPDATED**: All world building is done through `map-editor.html`
   - Multi-Circle collision editor with visual drag & drop
   - Real-time collision preview and validation
   - Automatic optimization of overlapping circles
   - Island placement and asset management

## Key Controls

- **Movement**: Arrow keys or WASD
- **Pause**: Esc
- **Debug Mode**: F3 (shows FPS, collision radii, ship info)
- **Zoom**: Mouse wheel or +/- keys
- **Reset Zoom**: 0 key
- **Enter Town**: Enter key (when near town area)

## Development Standards (from .cursor/rules)

### Code Organization
- Use ES6+ JavaScript features (classes, async/await, arrow functions)
- Maintain clear separation between game logic, rendering, and UI
- Follow class-based architecture (Game, Ship, Map classes)
- Keep physics calculations in dedicated methods
- Use descriptive variable names and JSDoc comments for complex functions

### Performance Guidelines
- Optimize canvas rendering with proper save/restore context calls
- Use requestAnimationFrame for smooth 60fps gameplay
- Implement efficient collision detection algorithms
- Minimize object creation in game loops
- Use deltaTime for frame-rate independent movement

### Visual Effects Best Practices
- Implement fading trails with opacity-based rendering
- Use rgba colors for transparency effects
- Create smooth animations with easing functions
- Maintain consistent visual style across all effects
- Optimize particle systems for performance

### Design Principles
- Maintain nautical/pirate theme throughout
- Use ocean color palette (blues, teals, whites)
- Ensure smooth, satisfying ship controls
- Create immersive sea environment
- Balance realism with fun gameplay mechanics

## Future Features (from .kiro/specs)

### Planned Game Features
1. **Trading System**: Buy/sell goods at different ports
2. **Ship Combat**: PNG-based ship models in combat scenarios
3. **Crew Management**: Hire crew members with PNG portraits
4. **Quest System**: Accept and complete quests from NPCs
5. **Ship Upgrades**: Improve ship performance and capabilities
6. **Save System**: Automatic game state persistence

### Technical Requirements
- Browser Support: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- JavaScript: ES6+ features required
- Canvas: HTML5 Canvas API for rendering
- Minimum Screen: 1024×768 (adaptive design)

## Development Notes

- No build process - modify JavaScript files directly
- Assets organized in `assets/` folder by type (Islands/, Ships/, Ports/, icons/, models/)
- Debug mode available via `window.DEBUG_MODE = true` or F12 key
- Game objects accessible via `window.game` for console debugging
- Version tracking in `js/version-manager.js` and displayed in UI
- Current version: 0.0.2 (see CHANGELOG.md for version history)