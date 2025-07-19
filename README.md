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

| Key | Action |
|---------|-----|
| **↑** or **W** | Move forward |
| **↓** or **S** | Move backward (slower) |
| **←** or **A** | Turn left |
| **→** or **D** | Turn right |
| **Esc** | Pause/resume |

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
    └── icons/          # Future icons
```

## ⚙️ Technical Details

### Ship Physics
- **Maximum speed**: 200 pixels/sec
- **Acceleration**: 150 pixels/sec²
- **Deceleration**: 100 pixels/sec²
- **Turn speed**: 3 radians/sec

### Map
- **Size**: 1024×768 pixels
- **4 islands** of different sizes
- **Two-layer wave animation** with different speeds
- **Collisions** with automatic repulsion

### Visual Effects
- Ship wake (up to 20 points, fading over 3 seconds)
- Water splashes at high speed
- Animated rings around islands
- Gradient sea background

## 🚀 Running the Game

1. **Download the project**
2. **Open `index.html`** in a modern browser
3. **Enjoy the game!**

> **Note**: The game uses Canvas API and ES6+, so a modern browser is required (Chrome, Firefox, Safari, Edge).

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