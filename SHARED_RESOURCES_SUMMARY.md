# Shared Resources Implementation Summary

## Overview
The game and map editor now share the same island resources through a unified data system.

## Key Files

### 1. `js/islands-data.js`
- **Purpose**: Single source of truth for island data
- **Used by**: Both game and map editor
- **Format**: JavaScript module with `ISLANDS_DATA` array
- **Auto-generated**: By map editor server when saving

### 2. `server.js` 
- **Endpoints**:
  - `POST /api/islands/save` - Saves islands to both `data/islands.json` and `js/islands-data.js`
  - `GET /api/islands/load` - Loads islands from `data/islands.json`
  - `GET /api/list-island-images` - Lists available PNG assets

### 3. `js/map.js` (Game)
- **Loading**: Reads from `ISLANDS_DATA` global variable
- **Images**: Dynamically loaded based on `imageFilename` property
- **Collision**: Uses Multi-Circle collision system

### 4. `map-editor.html`
- **Loading**: First tries `ISLANDS_DATA`, then falls back to server
- **Saving**: Saves to server which updates both JSON and JS files
- **Images**: Manages PNG assets for islands

## Data Flow

1. **Map Editor** → Creates/edits islands
2. **Save to Server** → Updates `data/islands.json` and `js/islands-data.js`
3. **Game** → Loads from `js/islands-data.js` on startup
4. **Map Editor** → Can reload from same `js/islands-data.js`

## Island Data Structure

```javascript
{
    name: "Island Name",
    x: 1000,              // World X coordinate
    y: 1000,              // World Y coordinate  
    radius: 400,          // Visual/collision radius (auto-calculated)
    imageFilename: "island.png",  // PNG asset filename
    collisionCircles: [   // Multi-Circle collision data
        { x: 0, y: 0, radius: 200 },
        { x: -100, y: -100, radius: 100 }
    ]
}
```

## Image Loading

### Game (`js/main.js`)
- Dynamically loads images referenced in `ISLANDS_DATA`
- Keys: `island_[filename]` (e.g., `island_Saint_Kitts.png`)
- Fallback to default images if not found

### Map Editor
- Loads all PNGs from `assets/Islands/` directory
- Can assign images to islands via dropdown
- Auto-generates collision circles from PNG shape

## Testing

Use `test-shared-resources.html` to verify:
1. Islands data loads correctly
2. Data structure is compatible
3. Server save/load works
4. Both game and editor can use the same data

## Benefits

1. **Single Source of Truth**: One data file for all island information
2. **Automatic Sync**: Changes in map editor immediately available to game
3. **Dynamic Assets**: Game loads only the images it needs
4. **Collision Sharing**: Same Multi-Circle collision data used everywhere
5. **Backwards Compatible**: Falls back gracefully if data missing

## Usage

### To add new islands:
1. Open map editor: `http://localhost:8000/map-editor.html`
2. Add/edit islands
3. Click "Save to Server"
4. Refresh game to see changes

### To add new island images:
1. Place PNG files in `assets/Islands/` directory
2. Refresh map editor
3. Select image from dropdown when editing island
4. Save to server

## Commands

```bash
# Start both servers
npm run dev

# Start game server only
npm start

# Start map editor server only
npm run server
```