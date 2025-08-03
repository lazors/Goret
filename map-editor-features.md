# Map Editor - New Features Guide

## Overview
The enhanced map editor now includes comprehensive island management features including image upload/download, dimension configuration, collision line drawing, and code generation.

## New Features

### 1. Image Upload & Download
- **Upload**: Click "Load Island Image" to upload any image file
- **Download**: After selecting an island with an image, click "Download Island Image"
- **Installation**: Downloaded images should be manually placed in `assets/Islands/` folder

### 2. Island Dimensions
- **Width/Height**: Configure island dimensions in pixels (100-2000px range)
- **Visual**: Islands display with configured dimensions
- **Info Display**: Selected islands show their dimensions (e.g., "800x600px")

### 3. Ctrl+Click Island Manipulation
- **Move Island**: Hold Ctrl and drag an island to reposition it
- **Visual Feedback**: Cursor changes to "move" when Ctrl is held
- **Real-time Update**: Position values update as you drag

### 4. Collision Line Drawing Mode
- **Activate**: Click "Draw Collision Line" button
- **Draw**: Left-click to add points, right-click to finish
- **Cancel**: Press Escape to cancel current line
- **Visual**: Red dashed line shows current drawing progress

### 5. Code Generation
- **Generate**: Click "Generate Code & Prompt" button
- **Content**: Generates complete configuration code including:
  - Island properties (name, position, dimensions)
  - Collision points in relative coordinates
  - Integration instructions
  - AI assistant prompt
- **Clipboard**: Automatically copies to clipboard

### 6. Enhanced UI Controls
- **Collision Line Mode Indicator**: Shows when in drawing mode
- **Dimension Outline**: Selected islands show dimension boundaries
- **Collision Radius**: Dashed circle shows collision detection radius
- **Status Updates**: Real-time feedback for all actions

## Workflow

1. **Upload Image**: Load your island image
2. **Configure**: Set name, position, and dimensions
3. **Position**: Use Ctrl+Click to fine-tune island placement
4. **Collision**: Either:
   - Use "Draw Collision Line" for quick outline
   - Add individual points with buttons
5. **Generate**: Click "Generate Code & Prompt" to get integration code
6. **Install**: 
   - Download image and place in `assets/Islands/`
   - Copy generated code to `js/map.js`

## Keyboard Shortcuts
- **Ctrl + Mouse**: Move selected island
- **Shift + A**: Add collision point at mouse
- **Delete**: Remove selected collision point
- **Escape**: Cancel operations / deselect
- **Ctrl + Z**: Undo last action
- **W/A/S/D**: Pan around map

## Tips
- Use collision line mode for quick island outline creation
- Adjust dimensions to match your actual image size
- The collision radius (dashed circle) is used when no custom outline exists
- Generated code includes both absolute and relative coordinates