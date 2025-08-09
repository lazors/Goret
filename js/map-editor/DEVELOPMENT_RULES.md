# Map Editor Development Rules & Guidelines

## 🎯 Primary Mission
**Create a comprehensive map editor that makes real-time adjustments to the GORET game world with senior developer standards.**

## 🏗️ Architecture Principles

### 1. **Modular Design**
- **Separation of Concerns**: Each module handles one specific responsibility
- **Dependency Injection**: Components should be loosely coupled
- **Plugin Architecture**: Features should be extensible through plugins
- **Event-Driven**: Use publish/subscribe patterns for component communication

### 2. **Performance First**
- **60fps Minimum**: All interactions must maintain smooth performance
- **Lazy Loading**: Load features only when needed
- **Memory Management**: Proper cleanup of resources and event listeners
- **Viewport Culling**: Only render/process visible elements
- **Dirty Flag System**: Minimize unnecessary computations and renders

### 3. **Data Integrity**
- **Validation Layer**: All user input must be validated
- **Atomic Operations**: Changes should be transactional
- **Undo/Redo System**: Every action must be reversible
- **Auto-save with Conflict Resolution**: Prevent data loss
- **Schema Versioning**: Handle data migration gracefully

## 🧪 Testing & Debugging

### 1. **Comprehensive Testing**
```javascript
// Every feature must include:
- Unit tests for core logic
- Integration tests for component interaction
- Performance benchmarks
- Error boundary testing
- Cross-browser compatibility tests
```

### 2. **Debugging Tools**
- **Debug Console**: Runtime inspection of editor state
- **Performance Profiler**: Real-time performance metrics
- **Change History**: Visual diff of all modifications
- **Validation Warnings**: Real-time error detection
- **Export Diagnostics**: Comprehensive system health reports

### 3. **Error Handling**
```javascript
// Error handling patterns:
try {
    // Risky operation
} catch (error) {
    this.debugger.logError(error, context);
    this.ui.showUserFriendlyMessage(error);
    this.recovery.attemptGracefulRecovery(error);
}
```

## 🎮 Game Integration

### 1. **Live Preview**
- **Hot Reload**: Changes reflect immediately in game
- **Dual View**: Editor and game view side-by-side
- **Synchronized Camera**: Viewport synchronization between editor and game
- **Real-time Validation**: Immediate feedback on game logic impact

### 2. **Data Flow**
```
Editor → Validation → Game State → Live Preview → Auto-save
   ↑                                                    ↓
   ←──────────── Error Handling ←───────────────────────
```

### 3. **Compatibility**
- **Backward Compatibility**: Support legacy save files
- **Forward Migration**: Seamless version upgrades
- **Export Formats**: Multiple output formats (JSON, JS, Binary)

## 🛠️ Feature Development

### 1. **Island Editing** (Core)
- **Visual Collision Editor**: Drag-and-drop collision points
- **Image Management**: Upload, resize, rotate, crop island images
- **Property Panel**: Real-time property editing with validation
- **Batch Operations**: Multi-select and bulk editing
- **Template System**: Reusable island templates

### 2. **World Generation** (Advanced)
- **Procedural Generation**: Algorithm-based world creation
- **Terrain Tools**: Height maps, biome painting
- **Path System**: Trade routes, navigation paths
- **Weather Zones**: Regional weather patterns
- **Resource Distribution**: Automatic resource placement

### 3. **Game Logic Integration**
- **Quest System**: Visual quest editor
- **NPC Placement**: Character positioning and behavior
- **Economic Simulation**: Trade route optimization
- **Combat Zones**: PvP/PvE area definition
- **Event Triggers**: Location-based event system

## 🎨 UI/UX Standards

### 1. **Design System**
- **Consistent Theme**: Maritime/pirate aesthetic
- **Responsive Layout**: Adapts to different screen sizes
- **Accessibility**: WCAG 2.1 AA compliance
- **Keyboard Shortcuts**: Power user efficiency
- **Context Menus**: Right-click functionality

### 2. **User Experience**
- **Progressive Disclosure**: Show complexity gradually
- **Undo/Redo**: Ctrl+Z/Ctrl+Y everywhere
- **Auto-save Indicators**: Clear save status
- **Progress Feedback**: Loading states and progress bars
- **Error Recovery**: Graceful error handling with user guidance

## 🔧 Code Quality

### 1. **Code Standards**
```javascript
// Naming conventions
class MapEditor { }           // PascalCase for classes
const islandData = {};        // camelCase for variables
const MAX_ISLANDS = 100;      // UPPER_SNAKE_CASE for constants

// Documentation
/**
 * Updates island collision points with validation
 * @param {string} islandId - Unique island identifier
 * @param {Point[]} points - Array of collision points
 * @returns {Promise<boolean>} Success status
 * @throws {ValidationError} When points are invalid
 */
async updateCollisionPoints(islandId, points) { }
```

### 2. **Performance Monitoring**
```javascript
// Performance tracking
const performanceMonitor = {
    trackRenderTime: (operation) => { },
    trackMemoryUsage: () => { },
    trackUserInteraction: (action) => { },
    generateReport: () => { }
};
```

### 3. **Security**
- **Input Sanitization**: All user input sanitized
- **XSS Prevention**: No direct HTML injection
- **File Upload Validation**: Strict file type checking
- **CORS Configuration**: Proper cross-origin setup

## 📁 File Structure
```
map-editor/
├── src/
│   ├── core/           # Core editor functionality
│   ├── modules/        # Feature modules
│   ├── ui/            # User interface components
│   ├── utils/         # Utility functions
│   └── plugins/       # Extensible plugins
├── tests/
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── performance/   # Performance benchmarks
├── docs/
│   ├── api/           # API documentation
│   ├── guides/        # User guides
│   └── examples/      # Code examples
└── build/             # Build configuration
```

## 🚀 Deployment & Distribution

### 1. **Build Process**
- **Automated Testing**: All tests must pass
- **Code Minification**: Optimized production builds
- **Asset Optimization**: Compressed images and resources
- **Version Tagging**: Semantic versioning
- **Change Documentation**: Automated changelog generation

### 2. **Quality Gates**
```javascript
// Pre-commit hooks
- ESLint: Code quality checks
- Prettier: Code formatting
- Tests: All tests must pass
- Performance: Benchmark validation
- Security: Vulnerability scanning
```

## 🎯 Success Metrics

### 1. **Performance KPIs**
- **Render Time**: < 16ms per frame (60fps)
- **Memory Usage**: < 100MB baseline
- **Load Time**: < 3 seconds initial load
- **Response Time**: < 100ms for user interactions

### 2. **Quality Metrics**
- **Test Coverage**: > 90%
- **Bug Density**: < 1 bug per 1000 lines
- **User Satisfaction**: > 4.5/5 rating
- **Performance Regression**: 0% tolerance

## 🔄 Continuous Improvement

### 1. **Regular Reviews**
- **Weekly Code Reviews**: Peer review all changes
- **Monthly Architecture Reviews**: Evaluate design decisions
- **Quarterly Performance Audits**: Comprehensive performance analysis
- **Annual Technology Stack Review**: Keep dependencies current

### 2. **Innovation Pipeline**
- **Feature Requests**: User-driven feature prioritization  
- **Technology Research**: Evaluate new tools and techniques
- **Prototype Development**: Risk-free innovation sandbox
- **Community Feedback**: Regular user feedback collection

---

## ⚡ Quick Start Checklist

Before starting any development:
- [ ] Read and understand these rules
- [ ] Set up development environment
- [ ] Run existing tests to ensure baseline
- [ ] Create feature branch with descriptive name
- [ ] Write failing test for new feature
- [ ] Implement feature with proper error handling
- [ ] Ensure all tests pass
- [ ] Update documentation
- [ ] Request code review
- [ ] Deploy to staging for testing

**Remember: Quality over speed. Build it right the first time.**