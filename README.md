# GORET- MVP Ship Control

Browser-based HTML5/JavaScript game with pirate ship control on a sea map with animated waves.

## 🎮 Features

- **8-direction ship movement** with smooth inertia
- **Animated waves** with tile rendering
- **Limited map boundaries** with collisions
- **Island obstacles** with repulsion
- **Visual effects**: ship wake, water splashes
- **HUD interface** with speed and direction indicators
- **Responsive design** for different screen sizes

## 🎯 Controls

| Key            | Action                 |
| -------------- | ---------------------- |
| **↑** or **W** | Move forward           |
| **↓** or **S** | Move backward (slower) |
| **←** or **A** | Turn left              |
| **→** or **D** | Turn right             |
| **Esc**        | Pause/resume           |

## 🗂️ Project Structure

```
Goret/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # Styles and sea theme
├── js/
│   ├── main.js         # Initialization and game loop
│   ├── ship.js         # Ship movement logic
│   └── map.js          # Map and wave animation
└── assets/
    ├── Islands/        # Island images and textures
    ├── Ships/          # Ship models and sprites
    ├── icons/          # UI icons and interface elements
    └── models/         # 3D models and additional game objects
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

## 🚀 Running the Game

### 🖥️ Windows Launch Instructions

#### Method 1: Local HTTP Server (Recommended)

For the best experience and to avoid CORS issues:

1. **Install Node.js** (if not already installed):

   - Download from [nodejs.org](https://nodejs.org/)
   - Choose LTS version for Windows

2. **Open PowerShell or Command Prompt**:

   - Press `Win + R`, type `powershell`, press Enter
   - Or search for "PowerShell" in Start menu

3. **Navigate to the game folder**:

   ```powershell
   cd C:\path\to\your\goret\folder
   ```

4. **Install and run HTTP server**:

   ```powershell
   npx http-server -p 8000 --cors
   ```

5. **Open your browser** and go to:
   - `http://localhost:8000` or `http://127.0.0.1:8000`

#### Method 2: Direct File Opening (Simple)

For quick testing (may have limitations):

1. **Navigate to the project folder** in Windows Explorer
2. **Right-click on `index.html`**
3. **Select "Open with"** → Choose your preferred browser
4. **Enjoy the game!**

#### Method 3: Python Server (Alternative)

If you have Python installed:

```powershell
# For Python 3.x
python -m http.server 8000

# For Python 2.x
python -m SimpleHTTPServer 8000
```

Then open `http://localhost:8000` in your browser.

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
