# 🗺️ GORET Advanced Map Editor - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Node.js installed (for development server)
- Modern web browser with HTML5 Canvas support

### Launch Instructions

1. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   This runs both the game server (port 8000) and image upload server (port 8001)

2. **Open the Advanced Map Editor:**
   - Navigate to: `http://localhost:8000/advanced-map-editor.html`
   - Or test version: `http://localhost:8000/test-advanced-editor.html`

## 🎯 Key Features

### Professional Tools
- **Advanced Debugging Framework** - Real-time performance monitoring
- **Comprehensive Testing Suite** - Automated quality assurance
- **Multi-layer Collision Editor** - Professional collision boundary editing
- **Real-time Validation** - Automatic error detection and reporting
- **Performance Optimization** - 60fps stable rendering with viewport culling

### Core Functionality
- **Island Management** - Create, edit, position, and rotate islands
- **Collision Editing** - Advanced collision boundary tools with optimization
- **World View** - Pan, zoom, grid snapping, measurement tools
- **Export/Import** - Save/load projects, generate game code
- **Undo/Redo System** - Complete history management

## 🎮 Controls & Shortcuts

### Tools
- **V** - Select Tool
- **M** - Move Tool  
- **R** - Rotate Tool
- **C** - Collision Editor
- **L** - Measure Tool

### Editing
- **Ctrl+Z** - Undo
- **Ctrl+Y** - Redo
- **Ctrl+S** - Save
- **Ctrl+C** - Copy
- **Ctrl+V** - Paste
- **Ctrl+A** - Select All
- **Delete** - Delete Selected
- **Escape** - Deselect All

### Navigation
- **Mouse Wheel** - Zoom In/Out
- **W A S D** - Pan Around Map
- **Space** - Toggle Pan Mode
- **0** - Reset Zoom to Fit World
- **G** - Toggle Grid
- **B** - Toggle World Boundaries

### Advanced Features
- **F12** - Toggle Debug Console
- **Ctrl+Shift+D** - Advanced Debug Panel
- **Ctrl+Shift+P** - Performance Report
- **Ctrl+Shift+V** - Validate All Islands
- **H** - Show Help

## 🔧 Development Features

### Debug Console
Press **F12** to open the advanced debug console featuring:
- Real-time log monitoring
- Performance metrics tracking
- Error reporting
- Memory usage monitoring

### Testing Framework
Run comprehensive tests with:
```javascript
runMapEditorTests()
```

### Performance Monitoring
- Real-time FPS counter
- Memory usage tracking
- Operation timing
- Performance scoring (0-100)

### Validation System
- Island positioning validation
- Collision boundary verification
- Performance impact assessment
- Game logic compliance checking

## 📊 Quality Metrics

### Performance Targets
- **Frame Rate**: Stable 60fps during all operations
- **Memory Usage**: <150MB for complex worlds  
- **Response Time**: <100ms for user interactions
- **Load Time**: <3 seconds for initial startup

### Success Criteria
- All validation tests pass
- Performance score > 90/100
- No memory leaks detected
- All core functionality working

## 🛠️ Architecture Overview

```
AdvancedMapEditor (Main)
├── EventBus (Communication)
├── DebugFramework (Real-time debugging)
├── ValidationSystem (Data validation)
├── PerformanceMonitor (Performance tracking)
└── EnhancedCollisionEditor (Collision editing)
```

## 🚨 Troubleshooting

### Common Issues

1. **Canvas not loading:**
   - Check browser console for errors
   - Ensure HTTP server is running
   - Verify all script files are loaded

2. **Performance issues:**
   - Press Ctrl+Shift+P for performance report
   - Check memory usage in debug console
   - Reduce zoom level or island count

3. **Features not working:**
   - Press F12 for debug information
   - Check validation results with Ctrl+Shift+V
   - Review browser console for JavaScript errors

### Debug Commands
```javascript
// Available in browser console
debug.toggle()              // Toggle debug panel
debug.log('message')        // Log debug message  
debug.stats()              // Get debug statistics
testEditor.showAdvancedDebug() // Advanced debug report
runMapEditorTests()        // Run test suite
```

## 📝 Development Status

### ✅ Completed Features
- Advanced map editor core implementation
- Performance-optimized rendering system
- Comprehensive debugging framework
- Professional collision editor
- Testing framework with automated reporting
- Advanced UI with tool palette
- Export/import functionality
- Complete documentation

### 🔄 In Progress
- World generation and terrain tools
- Game integration and live preview
- Advanced physics simulation

### 📋 Next Steps
1. Test all functionality thoroughly
2. Implement world generation tools (Phase 2)
3. Add game integration features (Phase 3)
4. Enhance collaborative features

## 🎯 Usage Examples

### Basic Workflow
1. Open advanced-map-editor.html
2. Use "Add Island" to create new islands
3. Select islands with V tool
4. Edit properties in right panel
5. Use C tool for collision editing
6. Save project with Ctrl+S
7. Export for game integration

### Advanced Features
1. Press F12 for debug console
2. Run performance analysis with Ctrl+Shift+P
3. Validate all islands with Ctrl+Shift+V
4. Run automated tests with "Run Tests" button
5. Export optimized game code

---

**Built with senior developer standards for professional game development.**

For technical support or questions, check the debug console for error details and refer to the comprehensive documentation in `js/map-editor/README.md`.