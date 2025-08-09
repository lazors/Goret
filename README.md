# GORET- MVP Ship Control

Browser-based HTML5/JavaScript game with pirate ship control on a sea map with animated waves.

## 🎮 Features

- **8-direction ship movement** with smooth inertia
- **Animated waves** with tile rendering
- **Limited map boundaries** with collisions
- **Island obstacles** with Multi-Circle collision system
- **Visual effects**: ship wake, water splashes
- **HUD interface** with speed and direction indicators
- **Responsive design** for different screen sizes
- **🗺️ Map Editor**: Visual world builder with PNG asset support
- **🔄 Live Integration**: Map editor changes appear instantly in game

## 🎯 Controls

| Key            | Action                 |
| -------------- | ---------------------- |
| **↑** or **W** | Move forward           |
| **↓** or **S** | Move backward (slower) |
| **←** or **A** | Turn left              |
| **→** or **D** | Turn right             |
| **Esc**        | Pause/resume           |
| **F10** or **F12** | Toggle debug mode   |

## 🗂️ Project Structure

```
Goret/
├── index.html              # Main game file
├── map-editor.html         # Visual map editor (PNG-based Multi-Circle)
├── server.js               # Node.js server for map editor saves
├── package.json            # NPM scripts and dependencies
├── css/
│   └── style.css           # Styles and sea theme
├── js/
│   ├── main.js             # Game initialization and loop
│   ├── ship.js             # Ship movement and physics
│   ├── map.js              # Map rendering and island data loading
│   ├── collision.js        # Multi-Circle collision detection
│   ├── islands-data.js     # Auto-generated island data (DO NOT EDIT)
│   └── map-editor/
│       └── CLAUDE.md       # Map editor documentation
├── data/
│   └── islands.json        # Map editor save format
└── assets/
    ├── Islands/            # PNG island images (Saint_Kitts.png, Nevis.png)
    ├── Ships/              # Ship models and sprites
    ├── icons/              # UI icons and interface elements
    └── models/             # 3D models and additional game objects
```

## ⚙️ Technical Details

### Ship Physics

- **Maximum speed**: 400 pixels/sec (doubled for massive ocean)
- **Acceleration**: 300 pixels/sec² (doubled)
- **Deceleration**: 200 pixels/sec² (doubled)
- **Turn speed**: 4 radians/sec (increased)

### Map

- **Size**: 10,240×7,680 pixels (10x bigger massive ocean)
- **5 islands** scattered across the ocean
- **Two-layer wave animation** with different speeds
- **Collisions** with automatic repulsion

### Visual Effects

- Ship wake (up to 20 points, fading over 3 seconds)
- Water splashes at high speed
- Animated rings around islands
- Gradient sea background

## 🚀 Launch Commands

### 🎮 **Game Only** (Basic Play)
```bash
npm start
# Starts HTTP server on port 8000
# Navigate to: http://localhost:8000/index.html
```

### 🛠️ **Development Mode** (Game + Map Editor)
```bash
npm run dev
# Starts both servers:
# - Game server: http://localhost:8000
# - Map editor server: http://localhost:8001 (handles PNG uploads & saves)
# Use for: Editing islands, collision circles, PNG assets
```

### 📝 **Map Editor Server Only**
```bash
npm run server
# Starts only the map editor server on port 8001
# Use with: http://localhost:8000 (run separately)
```

---

## 🎯 **Quick Start Workflow**

### **Play Game:**
```bash
npm run dev
# Open: http://localhost:8000/index.html
```

### **Edit World:**
```bash
npm run dev
# Open: http://localhost:8000/map-editor.html
# Edit islands → Save to Server → Changes appear in game!
```

---

## 🚀 Running the Game

### 🖥️ Windows Launch Instructions

#### Method 1: NPM Commands (Recommended)

**Prerequisites:** Node.js installed ([nodejs.org](https://nodejs.org/))

1. **Open PowerShell/Command Prompt in project folder**

2. **Install dependencies** (first time only):
   ```powershell
   npm install
   ```

3. **Choose launch mode**:

   **Game Only:**
   ```powershell
   npm start
   ```
   
   **Full Development (Game + Map Editor):**
   ```powershell
   npm run dev
   ```

4. **Open browser:**
   - Game: `http://localhost:8000/index.html`
   - Map Editor: `http://localhost:8000/map-editor.html`

#### Method 2: Manual HTTP Server

```powershell
npx http-server -p 8000 --cors
```

#### Method 3: Direct File Opening (Limited)

Right-click `index.html` → "Open with" → Browser
*Note: Map editor won't work properly with this method*

---

## 🗺️ Map Editor

### **Visual World Builder**
- **PNG-based islands**: Load island images from `assets/Islands/`
- **Multi-Circle collision**: Simple 3-5 circles per island (10x faster than polygons)
- **Live game integration**: Changes appear instantly in game
- **Auto-generation**: Analyze PNG shapes to create collision circles

### **Editor Workflow**
1. **Start development servers**: `npm run dev`
2. **Open map editor**: `http://localhost:8000/map-editor.html`
3. **Edit islands**: 
   - Add/move/resize islands
   - Assign PNG images from assets folder
   - Use "Auto-Generate from PNG" for smart collision placement
4. **Save changes**: Click "Save to Server" 
5. **Test in game**: `http://localhost:8000/index.html` - changes are live!

### **Key Features**
- ✅ **PNG Asset Integration** - Loads from `assets/Islands/`
- ✅ **Multi-Circle Collision** - 90% accuracy, 10% complexity
- ✅ **Visual Editing** - Drag & drop collision circles
- ✅ **Auto-Save Integration** - Saves directly to game data
- ✅ **Protocol Detection** - Warns if accessed via file://

---

### 🌐 Browser Compatibility

- **Chrome** (Recommended)
- **Firefox**
- **Microsoft Edge**
- **Safari** (if available)

> **Note**: The game uses Canvas API and ES6+, so a modern browser is required. For best performance, use the HTTP server method to avoid potential file loading issues.

## 🛠️ Developer Mode

For debugging, set in browser console:

```javascript
window.DEBUG_MODE = true;
```

This will show:

- FPS counter
- Ship position
- Current speed
- Collision radii (red circles)
- Movement direction (green line)

## 🔮 Future Extensions

Next steps for game development:

### 🧭 Navigation

- Compass with real directions
- Mini-map
- Map markers

### 🌊 Wind Mechanics

- Dynamic wind affects speed
- Wind direction visualization
- Strategic wind usage

### 🏝️ Map Objects

- Treasures to collect
- Enemy ships
- Trading ports
- Underwater reefs

### 🎨 Graphics Improvements

- Real sprites instead of placeholders
- Particle effects
- Parallax for waves
- Day/night cycle

## 📋 System Requirements

- **Browser**: Chrome 60+, Firefox 55+, Safari 12+, Edge 79+
- **JavaScript**: ES6+ support
- **Canvas**: HTML5 Canvas API
- **Screen size**: Minimum 1024×768 (adaptive design)

## 🐛 Known Issues

- Low frame rate possible on very old devices
- Canvas focus may not work in some browsers (solved by clicking)

## 👨‍💻 Author

Created according to technical specifications for a pirate adventure with emphasis on quality ship control mechanics.

---

**Sails are raised, course set for adventure! ⚓🌊**
