/**
 * GORET Advanced Map Editor - Senior Developer Implementation
 * 
 * This combines the optimized performance with advanced features:
 * - Modular plugin architecture
 * - Advanced debugging framework
 * - Comprehensive error handling
 * - Real-time validation
 * - Professional-grade tools
 * - Game integration capabilities
 */

// Advanced Event Bus for inter-component communication
class EventBus {
    constructor() {
        this.listeners = new Map();
        this.debugMode = false;
    }
    
    on(event, listener, options = {}) {
        const { once = false, priority = 0 } = options;
        
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        const wrappedListener = {
            listener,
            once,
            priority,
            id: Math.random().toString(36).substr(2, 9)
        };
        
        const listeners = this.listeners.get(event);
        listeners.push(wrappedListener);
        listeners.sort((a, b) => b.priority - a.priority);
        
        return () => this.off(event, listener);
    }
    
    emit(event, data) {
        const listeners = this.listeners.get(event) || [];
        const toRemove = [];
        
        listeners.forEach((wrapper, index) => {
            try {
                wrapper.listener(data);
                if (wrapper.once) {
                    toRemove.push(index);
                }
            } catch (error) {
                console.error(`Event listener error for '${event}':`, error);
            }
        });
        
        // Remove 'once' listeners
        toRemove.reverse().forEach(index => listeners.splice(index, 1));
        
        if (this.debugMode) {
            console.log(`📡 Event '${event}' emitted to ${listeners.length} listeners`);
        }
    }
    
    off(event, listener) {
        const listeners = this.listeners.get(event);
        if (!listeners) return;
        
        const index = listeners.findIndex(wrapper => wrapper.listener === listener);
        if (index > -1) {
            listeners.splice(index, 1);
        }
    }
}

// Advanced Debug Framework
class DebugFramework {
    constructor(editor) {
        this.editor = editor;
        this.logs = [];
        this.maxLogs = 1000;
        this.enabled = true;
        this.panel = null;
        this.visible = false;
        
        this.stats = {
            renderTime: [],
            memoryUsage: [],
            eventCount: 0,
            errorCount: 0
        };
        
        this.setupGlobalDebugAPI();
    }
    
    log(message, level = 'info', context = null) {
        const logEntry = {
            timestamp: Date.now(),
            level,
            message,
            context,
            stack: level === 'error' ? new Error().stack : null
        };
        
        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        
        if (level === 'error') this.stats.errorCount++;
        
        // Console output with colors
        const colors = {
            debug: '#95a5a6',
            info: '#3498db', 
            warn: '#f39c12',
            error: '#e74c3c'
        };
        
        console.log(`%c🐛 [${new Date(logEntry.timestamp).toLocaleTimeString()}] ${level.toUpperCase()}: ${message}`, 
                   `color: ${colors[level]}`);
        
        this.updateDebugPanel();
    }
    
    profile(name, fn) {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        
        this.log(`Profile: ${name} took ${duration.toFixed(2)}ms`, 'debug');
        return result;
    }
    
    createDebugPanel() {
        if (this.panel) return;
        
        this.panel = document.createElement('div');
        this.panel.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            width: 400px;
            height: 300px;
            background: rgba(0,0,0,0.9);
            color: white;
            font-family: monospace;
            font-size: 11px;
            border: 2px solid #3498db;
            border-radius: 8px;
            z-index: 10000;
            display: none;
            flex-direction: column;
        `;
        
        this.panel.innerHTML = `
            <div style="background: #3498db; padding: 8px; display: flex; justify-content: space-between;">
                <strong>🐛 Debug Console</strong>
                <button onclick="window.debug.toggle()" style="background: none; border: none; color: white; cursor: pointer;">✕</button>
            </div>
            <div id="debug-content" style="flex: 1; padding: 8px; overflow-y: auto;"></div>
            <div style="padding: 8px; border-top: 1px solid #34495e; font-size: 10px;">
                <span id="debug-stats">Ready</span>
            </div>
        `;
        
        document.body.appendChild(this.panel);
    }
    
    updateDebugPanel() {
        if (!this.panel || !this.visible) return;
        
        const content = document.getElementById('debug-content');
        const stats = document.getElementById('debug-stats');
        
        if (content) {
            content.innerHTML = this.logs.slice(-20).map(log => 
                `<div style="color: ${this.getLogColor(log.level)}; margin-bottom: 2px;">
                    [${new Date(log.timestamp).toLocaleTimeString()}] ${log.level.toUpperCase()}: ${log.message}
                </div>`
            ).join('');
            content.scrollTop = content.scrollHeight;
        }
        
        if (stats) {
            const memUsage = performance.memory ? (performance.memory.usedJSHeapSize / 1048576).toFixed(2) : 'N/A';
            stats.textContent = `Logs: ${this.logs.length} | Errors: ${this.stats.errorCount} | Memory: ${memUsage}MB`;
        }
    }
    
    getLogColor(level) {
        const colors = { debug: '#95a5a6', info: '#3498db', warn: '#f39c12', error: '#e74c3c' };
        return colors[level] || '#ecf0f1';
    }
    
    toggle() {
        if (!this.panel) {
            this.createDebugPanel();
        }
        
        this.visible = !this.visible;
        this.panel.style.display = this.visible ? 'flex' : 'none';
        
        if (this.visible) {
            this.updateDebugPanel();
        }
    }
    
    setupGlobalDebugAPI() {
        window.debug = {
            log: (msg, level = 'info') => this.log(msg, level),
            profile: (name, fn) => this.profile(name, fn),
            toggle: () => this.toggle(),
            stats: () => this.stats,
            clear: () => { this.logs = []; this.updateDebugPanel(); }
        };
        
        // Global error handler
        window.addEventListener('error', (e) => {
            this.log(`Global Error: ${e.message}`, 'error');
        });
    }
}

// Advanced Validation System
class ValidationSystem {
    constructor(editor) {
        this.editor = editor;
        this.rules = new Map();
        this.setupDefaultRules();
    }
    
    setupDefaultRules() {
        // Island validation rules
        this.addRule('island-position', (island) => {
            const { x, y } = island;
            const world = this.editor.worldConfig;
            
            if (x < 0 || x > world.width || y < 0 || y > world.height) {
                return { valid: false, message: 'Island position is outside world bounds' };
            }
            return { valid: true };
        });
        
        this.addRule('island-collision', (island) => {
            if (!island.collision || island.collision.length < 3) {
                return { valid: false, message: 'Island needs at least 3 collision points' };
            }
            return { valid: true };
        });
        
        this.addRule('island-overlap', (island) => {
            const others = this.editor.islands.filter(i => i.id !== island.id);
            for (const other of others) {
                const distance = Math.sqrt(
                    Math.pow(island.x - other.x, 2) + Math.pow(island.y - other.y, 2)
                );
                if (distance < (island.radius + other.radius) * 0.8) {
                    return { valid: false, message: `Island overlaps with ${other.name}` };
                }
            }
            return { valid: true };
        });
    }
    
    addRule(name, validator) {
        this.rules.set(name, validator);
    }
    
    validateIsland(island) {
        const results = [];
        
        for (const [ruleName, validator] of this.rules) {
            try {
                const result = validator(island);
                results.push({ rule: ruleName, ...result });
                
                if (!result.valid) {
                    this.editor.debugFramework.log(`Validation failed: ${result.message}`, 'warn');
                }
            } catch (error) {
                this.editor.debugFramework.log(`Validation error in rule '${ruleName}': ${error.message}`, 'error');
            }
        }
        
        return results;
    }
    
    validateAll() {
        const allResults = [];
        
        for (const island of this.editor.islands) {
            const results = this.validateIsland(island);
            allResults.push({ island: island.name, results });
        }
        
        return allResults;
    }
}

// Performance Monitor
class PerformanceMonitor {
    constructor(editor) {
        this.editor = editor;
        this.metrics = {
            renderTime: [],
            frameRate: [],
            memoryUsage: [],
            operations: new Map()
        };
        this.startTime = Date.now();
        this.lastFrame = performance.now();
        this.frameCount = 0;
    }
    
    startOperation(name) {
        this.metrics.operations.set(name, {
            start: performance.now(),
            memory: this.getMemoryUsage()
        });
    }
    
    endOperation(name) {
        const operation = this.metrics.operations.get(name);
        if (operation) {
            const duration = performance.now() - operation.start;
            const memoryDelta = this.getMemoryUsage() - operation.memory;
            
            this.editor.debugFramework.log(`Operation '${name}': ${duration.toFixed(2)}ms, ${memoryDelta.toFixed(2)}MB`, 'debug');
            
            // Warn about slow operations
            if (duration > 50) {
                this.editor.debugFramework.log(`Slow operation detected: ${name} (${duration.toFixed(2)}ms)`, 'warn');
            }
            
            this.metrics.operations.delete(name);
        }
    }
    
    recordFrame(renderTime) {
        const now = performance.now();
        const frameTime = now - this.lastFrame;
        this.lastFrame = now;
        this.frameCount++;
        
        this.metrics.renderTime.push(renderTime);
        this.metrics.frameRate.push(1000 / frameTime);
        
        // Keep only recent data
        if (this.metrics.renderTime.length > 60) {
            this.metrics.renderTime.shift();
            this.metrics.frameRate.shift();
        }
        
        // Record memory usage every 10 frames
        if (this.frameCount % 10 === 0) {
            this.metrics.memoryUsage.push(this.getMemoryUsage());
            if (this.metrics.memoryUsage.length > 100) {
                this.metrics.memoryUsage.shift();
            }
        }
    }
    
    getMemoryUsage() {
        return performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0;
    }
    
    getAverageFrameRate() {
        const recent = this.metrics.frameRate.slice(-30);
        return recent.length > 0 ? recent.reduce((a, b) => a + b) / recent.length : 0;
    }
    
    getReport() {
        return {
            uptime: Date.now() - this.startTime,
            averageFrameRate: this.getAverageFrameRate(),
            currentMemory: this.getMemoryUsage(),
            frameCount: this.frameCount,
            performanceScore: this.calculatePerformanceScore()
        };
    }
    
    calculatePerformanceScore() {
        const avgFps = this.getAverageFrameRate();
        const memUsage = this.getMemoryUsage();
        
        let score = 100;
        if (avgFps < 30) score -= 30;
        else if (avgFps < 45) score -= 15;
        else if (avgFps < 55) score -= 5;
        
        if (memUsage > 200) score -= 30;
        else if (memUsage > 100) score -= 15;
        else if (memUsage > 50) score -= 5;
        
        return Math.max(0, score);
    }
}

// Advanced Map Editor Main Class
class AdvancedMapEditor {
    constructor() {
        // Version and metadata
        this.version = '2.0.0-advanced';
        this.buildDate = new Date().toISOString();
        
        // Initialize systems
        this.eventBus = new EventBus();
        this.debugFramework = new DebugFramework(this);
        this.validationSystem = new ValidationSystem(this);
        this.performanceMonitor = new PerformanceMonitor(this);
        
        // Canvas and rendering (inheriting from optimized version)
        this.canvas = null;
        this.ctx = null;
        this.staticCanvas = null;
        this.staticCtx = null;
        this.uiCanvas = null;
        this.uiCtx = null;
        
        // World configuration
        this.worldConfig = {
            width: 10240,
            height: 7680,
            gridSize: 100,
            units: 'pixels'
        };
        
        // Enhanced state management
        this.state = {
            initialized: false,
            loading: false,
            selectedIslands: new Set(),
            clipboard: null,
            tools: {
                active: 'select',
                modes: new Map([
                    ['select', { name: 'Select', icon: '👆', cursor: 'default' }],
                    ['move', { name: 'Move', icon: '✋', cursor: 'move' }],
                    ['rotate', { name: 'Rotate', icon: '🔄', cursor: 'grab' }],
                    ['collision', { name: 'Collision', icon: '💥', cursor: 'crosshair' }],
                    ['measure', { name: 'Measure', icon: '📏', cursor: 'crosshair' }]
                ])
            },
            viewport: {
                zoom: 0.15,
                offsetX: 0,
                offsetY: 0,
                bounds: { minZoom: 0.05, maxZoom: 5.0 }
            },
            navigation: {
                keys: {},
                panSpeed: 300, // pixels per second
                lastTime: performance.now(),
                mousePos: { x: 0, y: 0 },
                isDragging: false,
                isPanning: false,
                dragStart: { x: 0, y: 0 },
                ctrlPressed: false
            },
            display: {
                showGrid: true,
                showBounds: true,
                showWaves: false,
                showCollisionBounds: true
            },
            ui: {
                panels: new Map(),
                shortcuts: new Map(),
                theme: 'dark'
            },
            history: {
                past: [],
                present: null,
                future: [],
                maxSize: 100
            }
        };
        
        // Enhanced features
        this.features = {
            realTimeValidation: true,
            autoSave: true,
            collaborativeMode: false,
            performanceMonitoring: true,
            advancedDebugging: true
        };
        
        // Island data (inheriting structure from optimized version)
        this.islands = [];
        this.selectedIsland = null;
        this.selectedPointIndex = -1;
        this.mousePos = { x: 0, y: 0 };
        this.worldMousePos = { x: 0, y: 0 };
        
        // Performance optimization flags
        this.dirty = true;
        this.staticDirty = true;
        this.uiDirty = true;
        this.renderRequested = false;
        
        // Server connection
        this.serverAvailable = false;
        
        // UI state flags
        this.showGrid = true;
        this.showBounds = true;
        this.showWaves = false;
        this.panMode = false;
        
        // Collision line drawing mode (same as original)
        this.collisionLineMode = false;
        this.tempCollisionPoints = [];
        this.selectedPointIndex = -1;
        
        console.log(`🗺️ GORET Advanced Map Editor v${this.version} initializing...`);
    }
    
    /**
     * Initialize the advanced map editor
     */
    async init() {
        try {
            this.state.loading = true;
            this.performanceMonitor.startOperation('init');
            
            // Initialize systems
            await this.initializeSystems();
            await this.setupCanvas();
            await this.setupEventListeners();
            await this.loadData();
            await this.setupUI();
            
            this.state.initialized = true;
            this.state.loading = false;
            
            this.performanceMonitor.endOperation('init');
            this.eventBus.emit('editor:initialized', { version: this.version });
            
            this.debugFramework.log(`Advanced Map Editor v${this.version} ready`, 'info');
            console.log(`✅ GORET Advanced Map Editor v${this.version} ready`);
            
            // Start render loop
            this.requestRender();
            
            // Start WASD navigation loop
            this.startNavigationLoop();
            
            return true;
            
        } catch (error) {
            this.debugFramework.log(`Initialization failed: ${error.message}`, 'error');
            console.error('❌ Advanced Map Editor initialization failed:', error);
            return false;
        }
    }
    
    async initializeSystems() {
        // Initialize all subsystems
        this.debugFramework.log('Initializing subsystems...', 'debug');
        
        // Setup event handlers
        this.eventBus.on('island:selected', (data) => {
            this.onIslandSelected(data);
        });
        
        this.eventBus.on('validation:failed', (data) => {
            this.debugFramework.log(`Validation failed: ${data.message}`, 'warn');
        });
        
        this.eventBus.on('performance:warning', (data) => {
            this.debugFramework.log(`Performance warning: ${data.message}`, 'warn');
        });
    }
    
    async setupCanvas() {
        this.canvas = document.getElementById('mapCanvas');
        if (!this.canvas) {
            throw new Error('Canvas element not found');
        }
        
        this.ctx = this.canvas.getContext('2d', { alpha: false });
        
        // Create off-screen canvases for layered rendering
        this.staticCanvas = document.createElement('canvas');
        this.staticCtx = this.staticCanvas.getContext('2d', { alpha: false });
        
        this.uiCanvas = document.createElement('canvas');
        this.uiCtx = this.uiCanvas.getContext('2d', { alpha: true });
        
        this.handleResize();
        this.updateViewport();
        
        this.debugFramework.log('Canvas system initialized', 'debug');
    }
    
    async setupEventListeners() {
        // Enhanced mouse handling with tool-specific behavior
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.throttledMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Enhanced keyboard shortcuts
        this.setupAdvancedKeyboardShortcuts();
        
        // Tool-specific event handling
        this.setupToolEventHandlers();
        
        this.debugFramework.log('Event listeners setup complete', 'debug');
    }
    
    setupAdvancedKeyboardShortcuts() {
        const shortcuts = new Map([
            // Basic editing
            ['Ctrl+Z', () => this.undo()],
            ['Ctrl+Y', () => this.redo()],
            ['Ctrl+S', () => this.save()],
            ['Ctrl+C', () => this.copy()],
            ['Ctrl+V', () => this.paste()],
            ['Ctrl+A', () => this.selectAll()],
            ['Delete', () => this.deleteSelected()],
            ['Escape', () => {
                if (this.collisionLineMode) {
                    this.cancelCollisionLine();
                } else {
                    this.deselectAll();
                }
            }],
            
            // Tools
            ['V', () => this.setTool('select')],
            ['M', () => this.setTool('move')],
            ['R', () => this.setTool('rotate')],
            ['C', () => this.setTool('collision')],
            ['L', () => this.setTool('measure')],
            
            // View
            ['Space', () => this.togglePanMode()],
            ['G', () => this.toggleGrid()],
            ['B', () => this.toggleBounds()],
            ['0', () => this.resetZoom()],
            ['+', () => this.zoomIn()],
            ['-', () => this.zoomOut()],
            
            // Debug
            ['F12', () => this.debugFramework.toggle()],
            ['Ctrl+Shift+D', () => this.showAdvancedDebug()],
            ['Ctrl+Shift+P', () => this.showPerformanceReport()],
            ['Ctrl+Shift+V', () => this.validateAll()],
            
            // Advanced features  
            ['Ctrl+Shift+E', () => this.exportAdvanced()],
            ['Ctrl+Shift+I', () => this.importAdvanced()],
            ['H', () => this.showHelp()]
        ]);
        
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        
        this.state.ui.shortcuts = shortcuts;
    }
    
    setupToolEventHandlers() {
        // Tool-specific mouse behavior
        this.eventBus.on('tool:changed', (data) => {
            const tool = this.state.tools.modes.get(data.tool);
            if (tool) {
                this.canvas.style.cursor = tool.cursor;
                this.debugFramework.log(`Tool changed to: ${tool.name}`, 'debug');
            }
        });
    }
    
    /**
     * Advanced tool system
     */
    setTool(toolName) {
        if (this.state.tools.modes.has(toolName)) {
            this.state.tools.active = toolName;
            this.eventBus.emit('tool:changed', { tool: toolName });
            this.markDirty('ui');
        }
    }
    
    getCurrentTool() {
        return this.state.tools.modes.get(this.state.tools.active);
    }
    
    /**
     * Enhanced island selection with multi-select support
     */
    selectIsland(islandId, addToSelection = false) {
        this.performanceMonitor.startOperation('select-island');
        
        try {
            if (!addToSelection) {
                this.state.selectedIslands.clear();
            }
            
            this.state.selectedIslands.add(islandId);
            
            // Find and set primary selection
            this.selectedIsland = this.islands.find(island => island.name === islandId);
            
            // Validate selected island if real-time validation is enabled
            if (this.features.realTimeValidation && this.selectedIsland) {
                const validationResults = this.validationSystem.validateIsland(this.selectedIsland);
                const failures = validationResults.filter(r => !r.valid);
                
                if (failures.length > 0) {
                    this.eventBus.emit('validation:failed', {
                        island: islandId,
                        errors: failures
                    });
                }
            }
            
            this.eventBus.emit('island:selected', {
                selected: Array.from(this.state.selectedIslands),
                primary: islandId
            });
            
            this.markDirty('selection');
            
        } catch (error) {
            this.debugFramework.log(`Island selection error: ${error.message}`, 'error');
        } finally {
            this.performanceMonitor.endOperation('select-island');
        }
    }
    
    /**
     * Enhanced rendering with performance monitoring
     */
    render() {
        const renderStart = performance.now();
        
        // Update viewport for culling
        this.updateViewport();
        
        // Render static layer if needed
        if (this.staticDirty) {
            this.renderStaticLayer();
            this.staticDirty = false;
        }
        
        // Clear main canvas
        this.ctx.fillStyle = '#0a1a2a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw static layer
        this.ctx.drawImage(this.staticCanvas, 0, 0);
        
        // Draw dynamic elements with viewport culling
        this.renderDynamicLayer();
        
        // Render UI layer if needed
        if (this.uiDirty) {
            this.renderUILayer();
            this.uiDirty = false;
        }
        
        // Draw UI layer
        this.ctx.drawImage(this.uiCanvas, 0, 0);
        
        // Draw debug overlays if enabled
        if (this.features.advancedDebugging) {
            // Debug overlays are handled in drawPerformanceOverlay for now
        }
        
        this.dirty = false;
        
        // Record performance metrics
        const renderTime = performance.now() - renderStart;
        this.performanceMonitor.recordFrame(renderTime);
        
        // Warn about slow renders
        if (renderTime > 20) {
            this.debugFramework.log(`Slow render detected: ${renderTime.toFixed(2)}ms`, 'warn');
        }
    }
    
    /**
     * Advanced debugging features
     */
    showAdvancedDebug() {
        const report = this.generateAdvancedDebugReport();
        this.debugFramework.log('Advanced debug report generated', 'info');
        console.table(report);
    }
    
    showPerformanceReport() {
        const report = this.performanceMonitor.getReport();
        console.log('🚀 Performance Report:', report);
        
        const score = report.performanceScore;
        let message = `Performance Score: ${score}/100`;
        let level = 'info';
        
        if (score < 50) {
            message += ' - Critical performance issues detected';
            level = 'error';
        } else if (score < 70) {
            message += ' - Performance issues detected';
            level = 'warn';
        } else if (score < 90) {
            message += ' - Minor performance issues';
            level = 'warn';
        } else {
            message += ' - Excellent performance';
            level = 'info';
        }
        
        this.debugFramework.log(message, level);
    }
    
    validateAll() {
        const results = this.validationSystem.validateAll();
        const totalIssues = results.reduce((count, island) => 
            count + island.results.filter(r => !r.valid).length, 0
        );
        
        this.debugFramework.log(`Validation complete: ${totalIssues} issues found across ${results.length} islands`, 
                               totalIssues > 0 ? 'warn' : 'info');
        
        console.table(results);
    }
    
    generateAdvancedDebugReport() {
        return {
            version: this.version,
            uptime: Date.now() - this.performanceMonitor.startTime,
            islands: this.islands.length,
            selectedIslands: this.state.selectedIslands.size,
            activeTool: this.state.tools.active,
            performance: this.performanceMonitor.getReport(),
            memory: this.performanceMonitor.getMemoryUsage(),
            validationIssues: this.validationSystem.validateAll()
                .reduce((count, island) => count + island.results.filter(r => !r.valid).length, 0)
        };
    }
    
    // Inherit optimized methods from base implementation
    requestRender() {
        if (!this.renderRequested) {
            this.renderRequested = true;
            requestAnimationFrame(() => {
                this.renderRequested = false;
                this.render();
            });
        }
    }
    
    markDirty(layer = 'all') {
        if (layer === 'all' || layer === 'main') this.dirty = true;
        if (layer === 'all' || layer === 'static') this.staticDirty = true;
        if (layer === 'all' || layer === 'ui') this.uiDirty = true;
        this.requestRender();
    }
    
    updateViewport() {
        this.viewport = {
            left: -this.state.viewport.offsetX / this.state.viewport.zoom,
            top: -this.state.viewport.offsetY / this.state.viewport.zoom,
            right: (this.canvas.width - this.state.viewport.offsetX) / this.state.viewport.zoom,
            bottom: (this.canvas.height - this.state.viewport.offsetY) / this.state.viewport.zoom
        };
    }
    
    isInViewport(x, y, radius = 0) {
        return x + radius >= this.viewport.left &&
               x - radius <= this.viewport.right &&
               y + radius >= this.viewport.top &&
               y - radius <= this.viewport.bottom;
    }
    
    // Core system implementations
    async loadData() {
        this.debugFramework.log('Loading map data...', 'debug');
        
        try {
            // Try to load from server first (same endpoint as original map-editor.html)
            const response = await fetch('http://localhost:8001/api/islands/load');
            if (response.ok) {
                const result = await response.json();
                if (result.success && result.islands && result.islands.length > 0) {
                    // Reconstruct islands with proper image objects (same as original)
                    this.islands = result.islands.map(islandData => {
                        const island = { ...islandData };
                        
                        // Load image if we have image data
                        if (island.originalImageData) {
                            // Create image object from base64 data
                            const img = new Image();
                            img.onload = () => {
                                island.image = img;
                                this.markDirty('all'); // Re-render when image loads
                            };
                            img.onerror = () => {
                                this.debugFramework.log(`Failed to load image for island: ${island.name}`, 'warn');
                            };
                            img.src = island.originalImageData;
                        } else if (island.imagePath) {
                            // Fallback to loading from path
                            this.loadIslandImageFromPath(island, island.imagePath);
                        } else {
                            // Handle default islands (Saint Kitts, Nevis, etc.)
                            this.loadDefaultIslandImage(island);
                        }
                        
                        return island;
                    });
                    
                    this.serverAvailable = true;
                    this.debugFramework.log(`Loaded ${this.islands.length} islands from server with images`, 'info');
                }
            }
        } catch (error) {
            this.debugFramework.log('Server not available, loading existing game data', 'warn');
            this.serverAvailable = false;
        }
        
        // Load default islands if server unavailable or no data (use existing islands-data.js)
        if (this.islands.length === 0) {
            this.loadFromExistingGameFiles();
        }
    }
    
    async setupUI() {
        this.debugFramework.log('Setting up UI components...', 'debug');
        
        // Setup resize observer
        this.resizeObserver = new ResizeObserver(() => this.handleResize());
        this.resizeObserver.observe(this.canvas);
        
        // Setup auto-save if enabled
        if (this.features.autoSave) {
            setInterval(() => this.autoSave(), 30000); // Auto-save every 30 seconds
        }
        
        // Initialize UI elements
        this.updateIslandSelector();
        
        // Select first island if any exist
        if (this.islands.length > 0) {
            this.selectIslandByIndex(0);
        }
    }
    
    renderStaticLayer() {
        const ctx = this.staticCtx;
        const zoom = this.state.viewport.zoom;
        const offsetX = this.state.viewport.offsetX;
        const offsetY = this.state.viewport.offsetY;
        
        // Clear static canvas
        ctx.clearRect(0, 0, this.staticCanvas.width, this.staticCanvas.height);
        
        // Draw ocean background
        ctx.fillStyle = '#1e3a5f';
        ctx.fillRect(0, 0, this.staticCanvas.width, this.staticCanvas.height);
        
        // Draw world grid if enabled
        if (this.showGrid) {
            this.drawGrid(ctx, zoom, offsetX, offsetY);
        }
        
        // Draw world boundaries
        if (this.showBounds) {
            this.drawWorldBounds(ctx, zoom, offsetX, offsetY);
        }
    }
    
    renderDynamicLayer() {
        const zoom = this.state.viewport.zoom;
        const offsetX = this.state.viewport.offsetX;
        const offsetY = this.state.viewport.offsetY;
        
        // Draw islands with viewport culling
        for (const island of this.islands) {
            if (this.isInViewport(island.x, island.y, island.radius)) {
                this.drawIsland(this.ctx, island, zoom, offsetX, offsetY);
            }
        }
        
        // Draw selection indicators
        this.drawSelectionIndicators(this.ctx, zoom, offsetX, offsetY);
    }
    
    renderUILayer() {
        const ctx = this.uiCtx;
        
        // Clear UI canvas
        ctx.clearRect(0, 0, this.uiCanvas.width, this.uiCanvas.height);
        
        // Draw tool-specific overlays
        this.drawToolOverlays(ctx);
        
        // Draw performance indicators if enabled
        if (this.features.performanceMonitoring) {
            this.drawPerformanceOverlay(ctx);
        }
        
        // Draw temp collision points in line mode
        if (this.collisionLineMode && this.tempCollisionPoints.length > 0) {
            this.drawTempCollisionPoints(ctx);
        }
    }
    
    onIslandSelected(data) {
        this.debugFramework.log(`Island selected: ${data.primary}`, 'debug');
        this.markDirty('ui');
    }
    
    handleMouseDown(e) {
        this.performanceMonitor.startOperation('mouse-down');
        
        const rect = this.canvas.getBoundingClientRect();
        this.state.navigation.mousePos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        this.worldMousePos = {
            x: (this.state.navigation.mousePos.x - this.state.viewport.offsetX) / this.state.viewport.zoom,
            y: (this.state.navigation.mousePos.y - this.state.viewport.offsetY) / this.state.viewport.zoom
        };
        
        // Handle collision line mode first
        if (this.collisionLineMode && this.selectedIsland) {
            if (e.button === 0) { // Left click
                this.tempCollisionPoints.push({
                    x: this.worldMousePos.x,
                    y: this.worldMousePos.y
                });
                this.markDirty('ui');
                return true;
            } else if (e.button === 2) { // Right click
                this.finishCollisionLine();
                return true;
            }
        }
        
        if (e.button === 0) { // Left click
            if (this.state.navigation.ctrlPressed) {
                // Ctrl+Click: Select/deselect island
                const clickedIsland = this.getIslandAtPosition(this.worldMousePos.x, this.worldMousePos.y);
                if (clickedIsland) {
                    if (this.state.selectedIslands.has(clickedIsland.name)) {
                        this.state.selectedIslands.delete(clickedIsland.name);
                        this.debugFramework.log(`Deselected island: ${clickedIsland.name}`, 'debug');
                    } else {
                        this.state.selectedIslands.add(clickedIsland.name);
                        this.selectedIsland = clickedIsland;
                        this.debugFramework.log(`Selected island: ${clickedIsland.name}`, 'debug');
                        this.updateIslandUI(clickedIsland);
                    }
                    this.markDirty('all');
                    this.eventBus.emit('island:selected', { island: clickedIsland });
                }
                return true;
            } else {
                // Regular click: Check for island selection or start panning
                const clickedIsland = this.getIslandAtPosition(this.worldMousePos.x, this.worldMousePos.y);
                if (clickedIsland) {
                    // Select single island and prepare for dragging
                    this.state.selectedIslands.clear();
                    this.state.selectedIslands.add(clickedIsland.name);
                    this.selectedIsland = clickedIsland;
                    this.state.navigation.isDragging = true;
                    this.state.navigation.dragStart.x = this.state.navigation.mousePos.x;
                    this.state.navigation.dragStart.y = this.state.navigation.mousePos.y;
                    this.debugFramework.log(`Selected and ready to drag: ${clickedIsland.name}`, 'debug');
                    this.updateIslandUI(clickedIsland);
                    this.markDirty('all');
                    this.eventBus.emit('island:selected', { island: clickedIsland });
                } else {
                    // Start panning
                    this.state.navigation.isPanning = true;
                    this.state.navigation.dragStart.x = this.state.navigation.mousePos.x;
                    this.state.navigation.dragStart.y = this.state.navigation.mousePos.y;
                }
            }
        }
        
        this.performanceMonitor.endOperation('mouse-down');
        return true;
    }
    
    handleMouseUp(e) {
        this.performanceMonitor.startOperation('mouse-up');
        
        // Reset drag states
        this.state.navigation.isDragging = false;
        this.state.navigation.isPanning = false;
        
        this.performanceMonitor.endOperation('mouse-up');
        return true;
    }
    
    handleWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        const newZoom = Math.max(this.state.viewport.bounds.minZoom, 
                               Math.min(this.state.viewport.bounds.maxZoom, 
                                       this.state.viewport.zoom * zoomFactor));
        
        if (newZoom !== this.state.viewport.zoom) {
            // Zoom towards mouse position
            const worldX = (mouseX - this.state.viewport.offsetX) / this.state.viewport.zoom;
            const worldY = (mouseY - this.state.viewport.offsetY) / this.state.viewport.zoom;
            
            this.state.viewport.zoom = newZoom;
            this.state.viewport.offsetX = mouseX - worldX * newZoom;
            this.state.viewport.offsetY = mouseY - worldY * newZoom;
            
            this.markDirty('all');
        }
    }
    
    throttledMouseMove = this.throttle((e) => {
        const rect = this.canvas.getBoundingClientRect();
        this.state.navigation.mousePos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        this.worldMousePos = {
            x: (this.state.navigation.mousePos.x - this.state.viewport.offsetX) / this.state.viewport.zoom,
            y: (this.state.navigation.mousePos.y - this.state.viewport.offsetY) / this.state.viewport.zoom
        };
        
        // Handle panning
        if (this.state.navigation.isPanning) {
            const dx = this.state.navigation.mousePos.x - this.state.navigation.dragStart.x;
            const dy = this.state.navigation.mousePos.y - this.state.navigation.dragStart.y;
            this.state.viewport.offsetX += dx;
            this.state.viewport.offsetY += dy;
            this.state.navigation.dragStart.x = this.state.navigation.mousePos.x;
            this.state.navigation.dragStart.y = this.state.navigation.mousePos.y;
            this.markDirty('all');
        }
        
        // Handle island dragging
        if (this.state.navigation.isDragging && this.selectedIsland) {
            const dx = this.state.navigation.mousePos.x - this.state.navigation.dragStart.x;
            const dy = this.state.navigation.mousePos.y - this.state.navigation.dragStart.y;
            
            // Convert screen movement to world movement
            const worldDx = dx / this.state.viewport.zoom;
            const worldDy = dy / this.state.viewport.zoom;
            
            this.selectedIsland.x += worldDx;
            this.selectedIsland.y += worldDy;
            
            this.state.navigation.dragStart.x = this.state.navigation.mousePos.x;
            this.state.navigation.dragStart.y = this.state.navigation.mousePos.y;
            
            this.updateIslandUI(this.selectedIsland);
            this.markDirty('all');
        }
        
        // Handle tool-specific mouse move
        if (this.handleToolMouseMove) {
            this.handleToolMouseMove(e, this.worldMousePos);
        }
    }, 16); // 60fps throttling
    
    handleKeyDown(e) {
        // Store key state for WASD navigation
        this.state.navigation.keys[e.code] = true;
        
        // Track Ctrl key
        this.state.navigation.ctrlPressed = e.ctrlKey;
        
        // Prevent default for navigation keys
        if (['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
            e.preventDefault();
        }
        
        // Handle keyboard shortcuts
        const key = this.getKeyCombo(e);
        const handler = this.state.ui.shortcuts.get(key);
        
        if (handler) {
            e.preventDefault();
            try {
                handler();
            } catch (error) {
                this.debugFramework.log(`Keyboard shortcut error: ${error.message}`, 'error');
            }
        }
    }
    
    handleKeyUp(e) {
        // Clear key state for WASD navigation
        this.state.navigation.keys[e.code] = false;
        
        // Track Ctrl key release
        this.state.navigation.ctrlPressed = e.ctrlKey;
    }
    
    handleResize() {
        const container = this.canvas.parentElement;
        const newWidth = container.clientWidth;
        const newHeight = container.clientHeight;
        
        if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
            this.canvas.width = newWidth;
            this.canvas.height = newHeight;
            
            this.staticCanvas.width = newWidth;
            this.staticCanvas.height = newHeight;
            
            this.uiCanvas.width = newWidth;
            this.uiCanvas.height = newHeight;
            
            this.markDirty('all');
            this.debugFramework.log(`Canvas resized to ${newWidth}x${newHeight}`, 'debug');
        }
    }
    
    getKeyCombo(event) {
        const parts = [];
        if (event.ctrlKey) parts.push('Ctrl');
        if (event.shiftKey) parts.push('Shift');
        if (event.altKey) parts.push('Alt');
        parts.push(event.key);
        return parts.join('+');
    }
    
    // Tool implementations
    undo() {
        if (this.state.history.past.length > 0) {
            const currentState = this.state.history.present;
            const previousState = this.state.history.past.pop();
            
            this.state.history.future.unshift(currentState);
            this.state.history.present = previousState;
            
            this.restoreState(previousState);
            this.debugFramework.log('Undo performed', 'debug');
        }
    }
    
    redo() {
        if (this.state.history.future.length > 0) {
            const currentState = this.state.history.present;
            const nextState = this.state.history.future.shift();
            
            this.state.history.past.push(currentState);
            this.state.history.present = nextState;
            
            this.restoreState(nextState);
            this.debugFramework.log('Redo performed', 'debug');
        }
    }
    
    async save() {
        this.performanceMonitor.startOperation('save');
        
        try {
            // Validate before saving
            const validationResults = this.validationSystem.validateAll();
            const hasErrors = validationResults.some(island => 
                island.results.some(result => !result.valid)
            );
            
            if (hasErrors) {
                this.debugFramework.log('Validation errors found - save cancelled', 'warn');
                return false;
            }
            
            if (this.serverAvailable) {
                // Use same save format as original map-editor.html
                const saveData = {
                    islands: this.islands.map(island => ({
                        ...island,
                        // Ensure we save the image data properly
                        image: null // Don't serialize the Image object itself
                    }))
                };
                
                const response = await fetch('http://localhost:8001/api/islands/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(saveData)
                });
                
                if (response.ok) {
                    this.debugFramework.log('Map data saved to server', 'info');
                    return true;
                }
            }
            
            // Fallback to localStorage
            localStorage.setItem('goret-map-data', JSON.stringify(this.islands));
            this.debugFramework.log('Map data saved to localStorage', 'info');
            return true;
            
        } catch (error) {
            this.debugFramework.log(`Save failed: ${error.message}`, 'error');
            return false;
        } finally {
            this.performanceMonitor.endOperation('save');
        }
    }
    
    // Load islands from existing islands-data.js file
    loadFromExistingGameFiles() {
        // Check if ISLANDS_DATA is available from islands-data.js
        if (typeof ISLANDS_DATA !== 'undefined' && ISLANDS_DATA.islands) {
            // Use the exact data from islands-data.js
            this.islands = JSON.parse(JSON.stringify(ISLANDS_DATA.islands));
            
            this.debugFramework.log(`Loaded ${this.islands.length} islands from islands-data.js: ${this.islands.map(i => i.name).join(', ')}`, 'info');
            
            // Load images for each island
            this.islands.forEach(island => {
                if (island.imagePath) {
                    this.loadIslandImageFromPath(island, island.imagePath);
                } else {
                    this.loadDefaultIslandImage(island);
                }
            });
        } else {
            this.debugFramework.log('ISLANDS_DATA not found, using fallback data', 'warn');
            this.loadFallbackData();
        }
    }
    
    // Fallback data in case islands-data.js is not available
    loadFallbackData() {
        this.islands = [
            {
                name: 'Test Island 1',
                x: 2000,
                y: 2000,
                width: 400,
                height: 300,
                radius: 200,
                rotation: 0,
                collision: [
                    { x: 1800, y: 1850 },
                    { x: 2200, y: 1850 },
                    { x: 2200, y: 2150 },
                    { x: 1800, y: 2150 }
                ]
            }
        ];
        
        this.debugFramework.log('Using fallback island data', 'warn');
    }
    
    loadDefaultIslandImage(island) {
        // Handle loading default images for built-in islands
        const defaultImages = {
            'Saint Kitts': 'assets/Islands/Saint_Kitts.png',
            'Saint Kitts Island': 'assets/Islands/Saint_Kitts.png', // Alternative name
            'Nevis': 'assets/Islands/Nevis.png'
        };
        
        // First try the exact island name, then try common variations
        const imagePath = defaultImages[island.name] || island.imagePath;
        
        this.debugFramework.log(`Loading default image for ${island.name}, trying path: ${imagePath}`, 'debug');
        
        if (imagePath) {
            // Use the same loading logic as loadIslandImageFromPath
            this.loadIslandImageFromPath(island, imagePath);
        } else {
            this.debugFramework.log(`No default image path found for ${island.name}`, 'warn');
        }
    }
    
    loadIslandImageFromPath(island, imagePath) {
        // Resolve the image path relative to the current page
        const resolvedPath = this.resolveImagePath(imagePath);
        this.debugFramework.log(`Loading image for ${island.name} from: ${imagePath} -> ${resolvedPath}`, 'debug');
        
        const img = new Image();
        // Remove crossOrigin for same-origin requests to avoid CORS issues
        // img.crossOrigin = 'anonymous'; 
        
        img.onload = () => {
            island.image = img;
            
            // Only set dimensions if they're not already specified in island data
            if (!island.width || !island.height) {
                // Use reasonable scaling for natural image dimensions
                const naturalScale = Math.min(800 / img.naturalWidth, 600 / img.naturalHeight, 1);
                island.width = Math.round(img.naturalWidth * naturalScale);
                island.height = Math.round(img.naturalHeight * naturalScale);
            }
            
            this.markDirty('all');
            this.debugFramework.log(`✅ Successfully loaded image for ${island.name} (${img.naturalWidth}x${img.naturalHeight} -> ${island.width}x${island.height})`, 'info');
        };
        
        img.onerror = (error) => {
            this.debugFramework.log(`❌ Failed to load image for ${island.name}: ${resolvedPath}`, 'error');
            console.error('Image loading error:', error, 'Trying path:', resolvedPath);
            
            // Try alternative paths
            this.tryAlternativeImagePaths(island, imagePath);
        };
        
        img.src = resolvedPath;
    }
    
    resolveImagePath(imagePath) {
        // If it's already an absolute URL, return as-is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/')) {
            return imagePath;
        }
        
        // For relative paths, ensure they're relative to the page root
        if (!imagePath.startsWith('./') && !imagePath.startsWith('../')) {
            return './' + imagePath;
        }
        
        return imagePath;
    }
    
    tryAlternativeImagePaths(island, originalPath) {
        const alternativePaths = [
            // Try with leading slash
            '/' + originalPath,
            // Try with ./ prefix
            './' + originalPath,
            // Try without assets prefix
            originalPath.replace('assets/', ''),
            // Try with different case
            originalPath.replace('Saint_Kitts', 'saint_kitts'),
            originalPath.replace('Nevis', 'nevis'),
            // Try with current server path
            window.location.origin + '/' + originalPath,
            // Try direct server path  
            `http://127.0.0.1:8002/${originalPath}`,
            `http://localhost:8002/${originalPath}`
        ];
        
        this.debugFramework.log(`Trying ${alternativePaths.length} alternative paths for ${island.name}`, 'debug');
        
        let attemptIndex = 0;
        const tryNextPath = () => {
            if (attemptIndex >= alternativePaths.length) {
                this.debugFramework.log(`❌ All alternative paths failed for ${island.name}`, 'error');
                return;
            }
            
            const pathToTry = alternativePaths[attemptIndex++];
            this.debugFramework.log(`Trying alternative path ${attemptIndex}: ${pathToTry}`, 'debug');
            
            const img = new Image();
            
            img.onload = () => {
                island.image = img;
                
                // Only set dimensions if they're not already specified in island data
                if (!island.width || !island.height) {
                    // Use reasonable scaling for natural image dimensions
                    const naturalScale = Math.min(800 / img.naturalWidth, 600 / img.naturalHeight, 1);
                    island.width = Math.round(img.naturalWidth * naturalScale);
                    island.height = Math.round(img.naturalHeight * naturalScale);
                }
                
                this.markDirty('all');
                this.debugFramework.log(`✅ Successfully loaded ${island.name} from alternative path: ${pathToTry} (${img.naturalWidth}x${img.naturalHeight} -> ${island.width}x${island.height})`, 'info');
            };
            
            img.onerror = () => {
                this.debugFramework.log(`❌ Alternative path ${attemptIndex} failed: ${pathToTry}`, 'debug');
                // Try next path after a short delay
                setTimeout(tryNextPath, 100);
            };
            
            img.src = pathToTry;
        };
        
        tryNextPath();
    }
    
    checkImageLoadingStatus() {
        this.debugFramework.log('🖼️ Checking image loading status...', 'info');
        
        let loadedCount = 0;
        let failedCount = 0;
        const status = [];
        
        this.islands.forEach(island => {
            if (island.image && island.image.complete) {
                loadedCount++;
                status.push(`✅ ${island.name}: Loaded (${island.image.naturalWidth}x${island.image.naturalHeight})`);
            } else if (island.image && !island.image.complete) {
                status.push(`⏳ ${island.name}: Loading...`);
            } else {
                failedCount++;
                status.push(`❌ ${island.name}: No image (Path: ${island.imagePath || 'none'})`);
            }
        });
        
        const report = [
            `📊 Image Loading Report:`,
            `Total Islands: ${this.islands.length}`,
            `Loaded: ${loadedCount}`,
            `Failed: ${failedCount}`,
            `Loading: ${this.islands.length - loadedCount - failedCount}`,
            '',
            'Detailed Status:',
            ...status
        ].join('\n');
        
        console.log(report);
        this.debugFramework.log(report, 'info');
        
        // Show in debug panel if available
        if (window.showDebugPanel && window.updateDebugContent) {
            window.showDebugPanel();
            window.updateDebugContent(`<pre style="font-size: 11px; color: #ecf0f1;">${report}</pre>`);
        }
        
        // Try to reload failed images
        if (failedCount > 0) {
            this.debugFramework.log('🔄 Attempting to reload failed images...', 'info');
            this.islands.forEach(island => {
                if (!island.image || !island.image.complete) {
                    if (island.imagePath) {
                        this.loadIslandImageFromPath(island, island.imagePath);
                    } else {
                        this.loadDefaultIslandImage(island);
                    }
                }
            });
        }
    }
    
    testImagePaths() {
        this.debugFramework.log('🔍 Testing image paths...', 'info');
        
        const testPaths = [
            'assets/Islands/Saint_Kitts.png',
            './assets/Islands/Saint_Kitts.png',
            '/assets/Islands/Saint_Kitts.png',
            'assets/Islands/Nevis.png',
            './assets/Islands/Nevis.png',
            '/assets/Islands/Nevis.png',
            window.location.origin + '/assets/Islands/Saint_Kitts.png',
            window.location.origin + '/assets/Islands/Nevis.png'
        ];
        
        console.log('Current location:', window.location.href);
        console.log('Origin:', window.location.origin);
        
        testPaths.forEach((path, index) => {
            const img = new Image();
            
            img.onload = () => {
                this.debugFramework.log(`✅ Path ${index + 1} WORKS: ${path} (${img.naturalWidth}x${img.naturalHeight})`, 'info');
                console.log(`✅ Path ${index + 1} WORKS:`, path);
            };
            
            img.onerror = () => {
                this.debugFramework.log(`❌ Path ${index + 1} FAILED: ${path}`, 'error');
                console.log(`❌ Path ${index + 1} FAILED:`, path);
            };
            
            img.src = path;
        });
        
        // Also test by creating temporary img elements in the DOM to see what works
        const testContainer = document.createElement('div');
        testContainer.style.cssText = 'position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); color: white; padding: 10px; z-index: 10000; max-width: 300px;';
        testContainer.innerHTML = '<h4>Image Path Test</h4>';
        
        testPaths.slice(0, 4).forEach((path, index) => {
            const testImg = document.createElement('img');
            testImg.src = path;
            testImg.style.cssText = 'width: 50px; height: 30px; margin: 2px; border: 1px solid white; object-fit: cover;';
            testImg.title = path;
            
            testImg.onload = () => {
                testImg.style.border = '2px solid green';
                console.log('DOM test - loaded:', path);
            };
            
            testImg.onerror = () => {
                testImg.style.border = '2px solid red';
                testImg.alt = 'X';
                console.log('DOM test - failed:', path);
            };
            
            testContainer.appendChild(testImg);
        });
        
        document.body.appendChild(testContainer);
        
        // Remove test container after 10 seconds
        setTimeout(() => {
            if (testContainer.parentNode) {
                testContainer.parentNode.removeChild(testContainer);
            }
        }, 10000);
    }

    startNavigationLoop() {
        const animate = (currentTime) => {
            const deltaTime = (currentTime - this.state.navigation.lastTime) / 1000;
            this.state.navigation.lastTime = currentTime;
            
            let moved = false;
            const moveDistance = this.state.navigation.panSpeed * deltaTime;
            
            // WASD navigation
            if (this.state.navigation.keys['KeyW']) {
                this.state.viewport.offsetY += moveDistance;
                moved = true;
            }
            if (this.state.navigation.keys['KeyS']) {
                this.state.viewport.offsetY -= moveDistance;
                moved = true;
            }
            if (this.state.navigation.keys['KeyA']) {
                this.state.viewport.offsetX += moveDistance;
                moved = true;
            }
            if (this.state.navigation.keys['KeyD']) {
                this.state.viewport.offsetX -= moveDistance;
                moved = true;
            }
            
            if (moved) {
                this.markDirty('all');
            }
            
            requestAnimationFrame(animate);
        };
        
        requestAnimationFrame(animate);
    }
    
    getIslandAtPosition(worldX, worldY) {
        // Check each island to see if the position is within its bounds
        for (const island of this.islands) {
            // Use image bounds if available, otherwise use radius
            let width = island.width;
            let height = island.height;
            
            if (!width || !height) {
                // Fallback to radius-based bounds
                const distance = Math.sqrt(
                    Math.pow(worldX - island.x, 2) + Math.pow(worldY - island.y, 2)
                );
                
                if (distance <= island.radius) {
                    return island;
                }
            } else {
                // Use rectangular bounds based on image dimensions
                const halfWidth = width / 2;
                const halfHeight = height / 2;
                
                if (worldX >= island.x - halfWidth && worldX <= island.x + halfWidth &&
                    worldY >= island.y - halfHeight && worldY <= island.y + halfHeight) {
                    return island;
                }
            }
        }
        
        return null;
    }
    
    updateIslandUI(island) {
        // Update the UI controls to reflect the selected island's properties
        const nameSelector = document.getElementById('islandSelector');
        const xInput = document.getElementById('islandX');
        const yInput = document.getElementById('islandY');
        const rotationSlider = document.getElementById('islandRotation');
        const rotationValue = document.getElementById('islandRotationValue');
        const radiusSlider = document.getElementById('islandRadius');
        const radiusValue = document.getElementById('islandRadiusValue');
        
        if (nameSelector) {
            // Update island selector dropdown
            nameSelector.innerHTML = '<option value="">-- Select Island --</option>';
            this.islands.forEach(isl => {
                const option = document.createElement('option');
                option.value = isl.name;
                option.textContent = isl.name;
                option.selected = isl.name === island.name;
                nameSelector.appendChild(option);
            });
        }
        
        if (xInput) xInput.value = Math.round(island.x);
        if (yInput) yInput.value = Math.round(island.y);
        if (rotationSlider) rotationSlider.value = island.rotation || 0;
        if (rotationValue) rotationValue.value = island.rotation || 0;
        if (radiusSlider) radiusSlider.value = island.radius || 150;
        if (radiusValue) radiusValue.value = island.radius || 150;
        
        this.debugFramework.log(`Updated UI for island: ${island.name}`, 'debug');
    }
    
    selectIslandFromDropdown() {
        const selector = document.getElementById('islandSelector');
        if (selector && selector.value) {
            const island = this.islands.find(isl => isl.name === selector.value);
            if (island) {
                this.state.selectedIslands.clear();
                this.state.selectedIslands.add(island.name);
                this.selectedIsland = island;
                this.updateIslandUI(island);
                this.markDirty('all');
                this.eventBus.emit('island:selected', { island });
                this.debugFramework.log(`Selected island from dropdown: ${island.name}`, 'debug');
            }
        }
    }
    
    toggleCollisionBounds() {
        this.state.display.showCollisionBounds = !this.state.display.showCollisionBounds;
        
        const btn = document.getElementById('collisionBtn');
        if (btn) {
            btn.textContent = this.state.display.showCollisionBounds ? '🔴 Hide Collision' : '🔴 Show Collision';
        }
        
        this.markDirty('all');
        this.debugFramework.log(`Collision bounds: ${this.state.display.showCollisionBounds ? 'shown' : 'hidden'}`, 'debug');
    }

    copy() {
        if (this.state.selectedIslands.size > 0) {
            const selectedData = Array.from(this.state.selectedIslands).map(id =>
                this.islands.find(island => island.name === id)
            ).filter(Boolean);
            
            this.state.clipboard = JSON.parse(JSON.stringify(selectedData));
            this.debugFramework.log(`Copied ${selectedData.length} islands`, 'debug');
        }
    }
    
    paste() {
        if (this.state.clipboard && this.state.clipboard.length > 0) {
            const pasteOffset = 100;
            
            this.state.clipboard.forEach((island, index) => {
                const newIsland = JSON.parse(JSON.stringify(island));
                newIsland.name = `${island.name}_copy_${Date.now()}_${index}`;
                newIsland.x += pasteOffset;
                newIsland.y += pasteOffset;
                
                this.islands.push(newIsland);
            });
            
            this.saveUndoState();
            this.markDirty('all');
            this.debugFramework.log(`Pasted ${this.state.clipboard.length} islands`, 'debug');
        }
    }
    
    selectAll() {
        this.state.selectedIslands.clear();
        this.islands.forEach(island => {
            this.state.selectedIslands.add(island.name);
        });
        
        this.selectedIsland = this.islands[0];
        this.eventBus.emit('island:selected', {
            selected: Array.from(this.state.selectedIslands),
            primary: this.selectedIsland?.name
        });
        
        this.markDirty('ui');
        this.debugFramework.log(`Selected all ${this.islands.length} islands`, 'debug');
    }
    
    deleteSelected() {
        if (this.state.selectedIslands.size > 0) {
            const count = this.state.selectedIslands.size;
            
            if (confirm(`Delete ${count} selected island(s)?`)) {
                this.islands = this.islands.filter(island => 
                    !this.state.selectedIslands.has(island.name)
                );
                
                this.state.selectedIslands.clear();
                this.selectedIsland = null;
                
                this.saveUndoState();
                this.markDirty('all');
                this.debugFramework.log(`Deleted ${count} islands`, 'info');
            }
        }
    }
    
    deselectAll() {
        this.state.selectedIslands.clear();
        this.selectedIsland = null;
        this.markDirty('ui');
        this.debugFramework.log('Deselected all islands', 'debug');
    }
    
    togglePanMode() {
        this.panMode = !this.panMode;
        this.canvas.style.cursor = this.panMode ? 'grab' : 'default';
        this.debugFramework.log(`Pan mode: ${this.panMode ? 'enabled' : 'disabled'}`, 'debug');
    }
    
    toggleGrid() {
        this.showGrid = !this.showGrid;
        this.markDirty('static');
        this.debugFramework.log(`Grid: ${this.showGrid ? 'shown' : 'hidden'}`, 'debug');
    }
    
    toggleBounds() {
        this.showBounds = !this.showBounds;
        this.markDirty('static');
        this.debugFramework.log(`Bounds: ${this.showBounds ? 'shown' : 'hidden'}`, 'debug');
    }
    
    resetZoom() {
        this.state.viewport.zoom = 0.15;
        this.state.viewport.offsetX = 0;
        this.state.viewport.offsetY = 0;
        this.markDirty('all');
        this.debugFramework.log('Zoom reset to fit world', 'debug');
    }
    
    zoomIn() {
        const newZoom = Math.min(this.state.viewport.bounds.maxZoom, 
                                this.state.viewport.zoom * 1.2);
        if (newZoom !== this.state.viewport.zoom) {
            this.state.viewport.zoom = newZoom;
            this.markDirty('all');
        }
    }
    
    zoomOut() {
        const newZoom = Math.max(this.state.viewport.bounds.minZoom, 
                                this.state.viewport.zoom * 0.8);
        if (newZoom !== this.state.viewport.zoom) {
            this.state.viewport.zoom = newZoom;
            this.markDirty('all');
        }
    }
    
    exportAdvanced() {
        const exportData = {
            version: this.version,
            timestamp: new Date().toISOString(),
            worldConfig: this.worldConfig,
            islands: this.islands,
            metadata: {
                totalIslands: this.islands.length,
                validationResults: this.validationSystem.validateAll()
            }
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
            type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `goret-map-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.debugFramework.log('Map exported successfully', 'info');
    }
    
    importAdvanced() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const data = JSON.parse(e.target.result);
                        
                        if (data.version && data.islands) {
                            this.islands = data.islands;
                            if (data.worldConfig) {
                                this.worldConfig = data.worldConfig;
                            }
                            
                            this.markDirty('all');
                            this.debugFramework.log(`Imported ${data.islands.length} islands`, 'info');
                        } else {
                            throw new Error('Invalid map file format');
                        }
                    } catch (error) {
                        this.debugFramework.log(`Import failed: ${error.message}`, 'error');
                    }
                };
                reader.readAsText(file);
            }
        };
        
        input.click();
    }
    
    showHelp() {
        const helpContent = `
GORET Advanced Map Editor v${this.version}

KEYBOARD SHORTCUTS:
• V - Select Tool
• M - Move Tool  
• R - Rotate Tool
• C - Collision Editor
• L - Measure Tool

• Ctrl+Z - Undo
• Ctrl+Y - Redo
• Ctrl+S - Save
• Ctrl+C - Copy
• Ctrl+V - Paste
• Ctrl+A - Select All
• Delete - Delete Selected
• Escape - Deselect All

• Space - Toggle Pan Mode
• G - Toggle Grid
• B - Toggle Bounds
• 0 - Reset Zoom
• +/- - Zoom In/Out

• F12 - Debug Console
• Ctrl+Shift+D - Advanced Debug
• Ctrl+Shift+P - Performance Report
• Ctrl+Shift+V - Validate All
        `;
        
        alert(helpContent);
    }
    
    // Helper methods
    throttle(func, delay) {
        let timeoutId;
        let lastExecTime = 0;
        return function (...args) {
            const currentTime = Date.now();
            
            if (currentTime - lastExecTime > delay) {
                func.apply(this, args);
                lastExecTime = currentTime;
            } else {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                    lastExecTime = Date.now();
                }, delay);
            }
        };
    }
    
    getDefaultIslands() {
        return [
            {
                name: 'Test Island 1',
                x: 2000,
                y: 2000,
                width: 400,
                height: 300,
                radius: 200,
                rotation: 0,
                collision: [
                    { x: 1800, y: 1850 },
                    { x: 2200, y: 1850 },
                    { x: 2200, y: 2150 },
                    { x: 1800, y: 2150 }
                ]
            },
            {
                name: 'Test Island 2',
                x: 4000,
                y: 3000,
                width: 600,
                height: 400,
                radius: 300,
                rotation: 0,
                collision: [
                    { x: 3700, y: 2800 },
                    { x: 4300, y: 2800 },
                    { x: 4300, y: 3200 },
                    { x: 3700, y: 3200 }
                ]
            }
        ];
    }
    
    saveUndoState() {
        const state = JSON.parse(JSON.stringify(this.islands));
        
        this.state.history.past.push(this.state.history.present);
        this.state.history.present = state;
        this.state.history.future = [];
        
        // Limit history size
        if (this.state.history.past.length > this.state.history.maxSize) {
            this.state.history.past.shift();
        }
    }
    
    restoreState(state) {
        this.islands = JSON.parse(JSON.stringify(state));
        this.markDirty('all');
    }
    
    autoSave() {
        if (this.features.autoSave) {
            this.save().then(success => {
                if (success) {
                    this.debugFramework.log('Auto-save completed', 'debug');
                }
            });
        }
    }
    
    // Additional helper methods for rendering
    drawGrid(ctx, zoom, offsetX, offsetY) {
        const gridSize = this.worldConfig.gridSize * zoom;
        const startX = (-offsetX % gridSize) - gridSize;
        const startY = (-offsetY % gridSize) - gridSize;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        for (let x = startX; x < ctx.canvas.width + gridSize; x += gridSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, ctx.canvas.height);
        }
        for (let y = startY; y < ctx.canvas.height + gridSize; y += gridSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(ctx.canvas.width, y);
        }
        ctx.stroke();
    }
    
    drawWorldBounds(ctx, zoom, offsetX, offsetY) {
        const worldWidth = this.worldConfig.width * zoom;
        const worldHeight = this.worldConfig.height * zoom;
        
        ctx.strokeStyle = '#3498db';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 5]);
        
        ctx.strokeRect(offsetX, offsetY, worldWidth, worldHeight);
        ctx.setLineDash([]);
    }
    
    drawIsland(ctx, island, zoom, offsetX, offsetY) {
        const screenX = island.x * zoom + offsetX;
        const screenY = island.y * zoom + offsetY;
        
        // Use a reasonable collision radius - should be proportional to island size
        let collisionRadius = island.radius;
        if (!collisionRadius && (island.width || island.height)) {
            // Default collision radius to roughly half the largest dimension
            collisionRadius = Math.max(island.width || 0, island.height || 0) * 0.5;
        }
        const screenRadius = (collisionRadius || 150) * zoom;
        
        ctx.save();
        
        // If island has a loaded image, draw it
        if (island.image && island.image.complete) {
            // Calculate appropriate image dimensions for rendering
            let imageWidth, imageHeight;
            
            if (island.width && island.height) {
                // Use the specified width/height from island data (these are world dimensions)
                imageWidth = island.width * zoom;
                imageHeight = island.height * zoom;
            } else {
                // Fallback: use natural image dimensions with reasonable scaling
                const naturalScale = Math.min(800 / island.image.naturalWidth, 600 / island.image.naturalHeight, 1);
                imageWidth = island.image.naturalWidth * naturalScale * zoom;
                imageHeight = island.image.naturalHeight * naturalScale * zoom;
                
                // Update island dimensions if not set
                if (!island.width) island.width = island.image.naturalWidth * naturalScale;
                if (!island.height) island.height = island.image.naturalHeight * naturalScale;
            }
            
            // Apply rotation if specified
            if (island.rotation && island.rotation !== 0) {
                ctx.translate(screenX, screenY);
                ctx.rotate((island.rotation * Math.PI) / 180);
                ctx.translate(-screenX, -screenY);
            }
            
            // Draw the actual PNG image
            ctx.drawImage(
                island.image,
                screenX - imageWidth / 2,
                screenY - imageHeight / 2,
                imageWidth,
                imageHeight
            );
            
            // Draw selection border if selected
            if (this.state.selectedIslands.has(island.name)) {
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 4]);
                ctx.strokeRect(
                    screenX - imageWidth / 2 - 2,
                    screenY - imageHeight / 2 - 2,
                    imageWidth + 4,
                    imageHeight + 4
                );
                ctx.setLineDash([]);
            }
            
            // Draw collision radius for reference
            if (this.state.display.showCollisionBounds) {
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
            
            // Draw collision polygon if available
            if (island.collision && island.collision.length > 0) {
                this.drawCollisionPolygon(ctx, island.collision, zoom, offsetX, offsetY);
            }
            
        } else {
            // Fallback: Draw island circle if no image is loaded
            ctx.fillStyle = this.state.selectedIslands.has(island.name) ? '#3498db' : '#27ae60';
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Show loading indicator
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = `${Math.max(10, screenRadius / 6)}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Loading...', screenX, screenY - 5);
        }
        
        // Always draw island name below the image/circle
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.font = `${Math.max(12, screenRadius / 4)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const nameY = screenY + Math.max(screenRadius, (island.height * zoom / 2)) + 20;
        ctx.strokeText(island.name, screenX, nameY);
        ctx.fillText(island.name, screenX, nameY);
        
        ctx.restore();
    }
    
    drawCollisionPolygon(ctx, collisionPoints, zoom, offsetX, offsetY) {
        if (!collisionPoints || collisionPoints.length < 3) return;
        
        ctx.save();
        
        // Draw collision polygon outline
        ctx.strokeStyle = this.state.display.showCollisionBounds ? 'rgba(231, 76, 60, 0.8)' : 'rgba(231, 76, 60, 0.3)';
        ctx.fillStyle = 'rgba(231, 76, 60, 0.1)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        for (let i = 0; i < collisionPoints.length; i++) {
            const point = collisionPoints[i];
            const screenX = point.x * zoom + offsetX;
            const screenY = point.y * zoom + offsetY;
            
            if (i === 0) {
                ctx.moveTo(screenX, screenY);
            } else {
                ctx.lineTo(screenX, screenY);
            }
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Draw collision points if collision bounds are shown
        if (this.state.display.showCollisionBounds) {
            collisionPoints.forEach((point, index) => {
                const screenX = point.x * zoom + offsetX;
                const screenY = point.y * zoom + offsetY;
                
                ctx.fillStyle = '#e74c3c';
                ctx.strokeStyle = '#c0392b';
                ctx.lineWidth = 1;
                
                ctx.beginPath();
                ctx.arc(screenX, screenY, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                
                // Draw point index
                ctx.fillStyle = 'white';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(index.toString(), screenX, screenY);
            });
        }
        
        ctx.restore();
    }
    
    drawSelectionIndicators(ctx, zoom, offsetX, offsetY) {
        for (const islandId of this.state.selectedIslands) {
            const island = this.islands.find(i => i.name === islandId);
            if (island && this.isInViewport(island.x, island.y, island.radius)) {
                const screenX = island.x * zoom + offsetX;
                const screenY = island.y * zoom + offsetY;
                const screenRadius = island.radius * zoom;
                
                ctx.strokeStyle = '#e74c3c';
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 4]);
                
                ctx.beginPath();
                ctx.arc(screenX, screenY, screenRadius + 5, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }
    
    drawToolOverlays(ctx) {
        // Tool-specific overlay rendering will be handled by individual tools
    }
    
    drawPerformanceOverlay(ctx) {
        const report = this.performanceMonitor.getReport();
        const fps = Math.round(report.averageFrameRate);
        const memory = report.currentMemory.toFixed(1);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 60);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${fps}`, 20, 30);
        ctx.fillText(`Memory: ${memory}MB`, 20, 45);
        ctx.fillText(`Score: ${report.performanceScore}/100`, 20, 60);
    }
    
    drawTempCollisionPoints(ctx) {
        const zoom = this.state.viewport.zoom;
        const offsetX = this.state.viewport.offsetX;
        const offsetY = this.state.viewport.offsetY;
        
        // Draw lines between temp points
        if (this.tempCollisionPoints.length > 1) {
            ctx.strokeStyle = '#f39c12';
            ctx.lineWidth = 3;
            ctx.setLineDash([5, 5]);
            
            ctx.beginPath();
            for (let i = 0; i < this.tempCollisionPoints.length; i++) {
                const point = this.tempCollisionPoints[i];
                const screenX = point.x * zoom + offsetX;
                const screenY = point.y * zoom + offsetY;
                
                if (i === 0) {
                    ctx.moveTo(screenX, screenY);
                } else {
                    ctx.lineTo(screenX, screenY);
                }
            }
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Draw temp points
        this.tempCollisionPoints.forEach((point, index) => {
            const screenX = point.x * zoom + offsetX;
            const screenY = point.y * zoom + offsetY;
            
            ctx.fillStyle = '#f39c12';
            ctx.strokeStyle = '#e67e22';
            ctx.lineWidth = 2;
            
            ctx.beginPath();
            ctx.arc(screenX, screenY, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw point number
            ctx.fillStyle = '#ffffff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(index.toString(), screenX, screenY);
        });
    }
    
    // Tool-specific event handlers (to be implemented by tools)
    handleToolMouseDown(e, worldPos) { return false; }
    handleToolMouseUp(e, worldPos) { return false; }
    handleToolMouseMove(e, worldPos) { return false; }
    
    // Public API methods for UI integration
    addIsland() {
        const newIsland = {
            name: `Island_${Date.now()}`,
            x: this.worldMousePos?.x || 2000,
            y: this.worldMousePos?.y || 2000,
            width: 400,
            height: 300,
            radius: 200,
            rotation: 0,
            collision: []
        };
        
        this.islands.push(newIsland);
        this.saveUndoState();
        this.markDirty('all');
        
        this.debugFramework.log(`Added new island: ${newIsland.name}`, 'info');
        return newIsland;
    }
    
    resetToWorldView() {
        this.resetZoom();
    }
    
    toggleOceanWaves() {
        this.showWaves = !this.showWaves;
        this.markDirty('static');
    }
    
    generateGameCode() {
        const gameCode = `// Generated island data for GORET game
const islands = ${JSON.stringify(this.islands, null, 2)};

// Island collision data
const islandCollisions = islands.map(island => ({
    name: island.name,
    x: island.x,
    y: island.y,
    radius: island.radius,
    collision: island.collision || []
}));

// Export for game use
if (typeof module !== 'undefined') {
    module.exports = { islands, islandCollisions };
}`;
        
        const blob = new Blob([gameCode], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `goret-islands-${Date.now()}.js`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.debugFramework.log('Game code generated and downloaded', 'info');
    }
    
    generateIslandsDataFile() {
        // Generate the islands-data.js file format
        const timestamp = new Date().toISOString();
        const islandsDataContent = `// Auto-generated by map editor - ${timestamp}
// Do not edit manually - changes will be overwritten

const ISLANDS_DATA = ${JSON.stringify({ islands: this.islands }, null, 2)};

// Export for both CommonJS and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ISLANDS_DATA;
}
`;
        
        const blob = new Blob([islandsDataContent], { type: 'text/javascript' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'islands-data.js';
        a.click();
        
        URL.revokeObjectURL(url);
        this.debugFramework.log('islands-data.js file generated and downloaded', 'info');
    }
    
    saveProject() {
        this.save();
    }
    
    // Methods from original map-editor.html for full compatibility
    selectIslandFromDropdown() {
        const selector = document.getElementById('islandSelector');
        const index = parseInt(selector.value);
        
        if (index >= 0 && index < this.islands.length) {
            this.selectIslandByIndex(index);
        }
    }
    
    selectIslandByIndex(index) {
        if (index >= 0 && index < this.islands.length) {
            const island = this.islands[index];
            this.selectIsland(island.name);
            this.updateIslandFormValues();
            this.updateCollisionPointsList();
        }
    }
    
    updateIslandFormValues() {
        if (this.selectedIsland) {
            const island = this.selectedIsland;
            document.getElementById('islandX').value = island.x;
            document.getElementById('islandY').value = island.y;
            document.getElementById('islandRotation').value = island.rotation || 0;
            document.getElementById('islandRotationValue').value = island.rotation || 0;
            document.getElementById('islandRadius').value = island.radius || 150;
            document.getElementById('islandRadiusValue').value = island.radius || 150;
        }
    }
    
    updateCollisionPointsList() {
        const list = document.getElementById('collisionPointsList');
        
        if (!this.selectedIsland || !this.selectedIsland.collision || this.selectedIsland.collision.length === 0) {
            list.innerHTML = '<div style="text-align: center; color: #7f8c8d; font-style: italic;">No collision points</div>';
            return;
        }
        
        list.innerHTML = '';
        this.selectedIsland.collision.forEach((point, index) => {
            const div = document.createElement('div');
            div.className = `collision-point ${index === this.selectedPointIndex ? 'selected' : ''}`;
            div.style.cssText = `
                padding: 5px 8px;
                margin: 2px 0;
                background: rgba(52, 152, 219, 0.1);
                border: 1px solid rgba(52, 152, 219, 0.3);
                border-radius: 3px;
                cursor: pointer;
                font-size: 11px;
                border-left: 3px solid #3498db;
            `;
            
            if (index === this.selectedPointIndex) {
                div.style.background = 'rgba(231, 76, 60, 0.2)';
                div.style.borderLeftColor = '#e74c3c';
            }
            
            // Show both world and relative coordinates
            const relativeX = point.x - this.selectedIsland.x;
            const relativeY = point.y - this.selectedIsland.y;
            div.innerHTML = `
                <strong>Point ${index}</strong><br>
                World: (${point.x.toFixed(1)}, ${point.y.toFixed(1)})<br>
                Relative: (${relativeX.toFixed(1)}, ${relativeY.toFixed(1)})
            `;
            
            div.onclick = () => {
                this.selectedPointIndex = index;
                this.updateCollisionPointsList();
                this.markDirty('ui');
            };
            
            list.appendChild(div);
        });
    }
    
    toggleCollisionLineMode() {
        this.collisionLineMode = !this.collisionLineMode;
        const btn = document.getElementById('collisionLineModeBtn');
        
        if (this.collisionLineMode) {
            btn.textContent = '✅ Finish Line';
            btn.style.background = 'linear-gradient(45deg, #27ae60, #2ecc71)';
            this.tempCollisionPoints = [];
            this.debugFramework.log('Collision line mode enabled - click to add points, right-click to finish', 'info');
        } else {
            btn.textContent = '✏️ Draw Line';
            btn.style.background = 'linear-gradient(45deg, #3498db, #2980b9)';
            this.tempCollisionPoints = [];
            this.debugFramework.log('Collision line mode disabled', 'info');
        }
        
        this.markDirty('ui');
    }
    
    finishCollisionLine() {
        if (this.collisionLineMode && this.tempCollisionPoints.length >= 3 && this.selectedIsland) {
            if (!this.selectedIsland.collision) {
                this.selectedIsland.collision = [];
            }
            
            // Add all temp points to the collision
            this.selectedIsland.collision.push(...this.tempCollisionPoints);
            
            this.saveUndoState();
            this.updateCollisionPointsList();
            this.debugFramework.log(`Added ${this.tempCollisionPoints.length} collision points via line mode`, 'info');
            
            // Reset line mode
            this.toggleCollisionLineMode();
        }
    }
    
    cancelCollisionLine() {
        if (this.collisionLineMode) {
            this.tempCollisionPoints = [];
            this.toggleCollisionLineMode();
            this.debugFramework.log('Collision line cancelled', 'info');
        }
    }
    
    optimizePoints() {
        if (!this.selectedIsland || !this.selectedIsland.collision) {
            this.debugFramework.log('No collision points to optimize', 'warn');
            return;
        }
        
        this.saveUndoState();
        
        const threshold = 10; // Minimum distance between points
        const original = this.selectedIsland.collision.length;
        
        for (let i = this.selectedIsland.collision.length - 1; i > 0; i--) {
            const point1 = this.selectedIsland.collision[i];
            const point2 = this.selectedIsland.collision[i - 1];
            
            const distance = Math.sqrt(
                Math.pow(point1.x - point2.x, 2) + Math.pow(point1.y - point2.y, 2)
            );
            
            if (distance < threshold) {
                this.selectedIsland.collision.splice(i, 1);
            }
        }
        
        const removed = original - this.selectedIsland.collision.length;
        this.updateCollisionPointsList();
        this.debugFramework.log(`Basic optimize: removed ${removed} redundant points`, removed > 0 ? 'info' : 'debug');
        this.markDirty('all');
    }
    
    // Update island selector dropdown
    updateIslandSelector() {
        const selector = document.getElementById('islandSelector');
        if (!selector) return;
        
        selector.innerHTML = '<option value="">-- Select Island --</option>';
        
        this.islands.forEach((island, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${island.name} (${island.x}, ${island.y})`;
            selector.appendChild(option);
        });
        
        // Select current island if available
        if (this.selectedIsland) {
            const currentIndex = this.islands.indexOf(this.selectedIsland);
            if (currentIndex !== -1) {
                selector.value = currentIndex;
            }
        }
    }
    
    debugInfo() {
        let info = '🐛 Advanced Map Editor Debug Info\n\n';
        info += `Islands loaded: ${this.islands.length}\n`;
        info += `Selected island: ${this.selectedIsland ? this.selectedIsland.name : 'None'}\n`;
        info += `Collision line mode: ${this.collisionLineMode}\n`;
        info += `Show collision bounds: ${this.state.display.showCollisionBounds}\n`;
        info += `Current zoom: ${this.state.viewport.zoom.toFixed(2)}\n\n`;
        
        this.islands.forEach((island, index) => {
            info += `Island ${index + 1}: ${island.name}\n`;
            info += `  Position: (${island.x}, ${island.y})\n`;
            info += `  Size: ${island.width}x${island.height}\n`;
            info += `  Radius: ${island.radius}\n`;
            info += `  Rotation: ${island.rotation}°\n`;
            info += `  Image: ${island.image ? `${island.image.naturalWidth}x${island.image.naturalHeight}` : 'Not loaded'}\n`;
            info += `  Image loaded: ${island.image && island.image.complete ? 'Yes' : 'No'}\n`;
            info += `  Collision points: ${island.collision ? island.collision.length : 0}\n\n`;
        });
        
        console.log(info);
        alert(info);
    }
    
    resetIslandDimensions() {
        if (!this.selectedIsland) {
            alert('Please select an island first');
            return;
        }
        
        const island = this.selectedIsland;
        if (island.image && island.image.complete) {
            // Reset to properly scaled dimensions based on actual image
            const naturalScale = Math.min(800 / island.image.naturalWidth, 600 / island.image.naturalHeight, 1);
            island.width = Math.round(island.image.naturalWidth * naturalScale);
            island.height = Math.round(island.image.naturalHeight * naturalScale);
            
            // Update collision radius to match
            island.radius = Math.max(island.width, island.height) * 0.5;
            
            this.markDirty('all');
            this.debugFramework.log(`Reset dimensions for ${island.name} to ${island.width}x${island.height}`, 'info');
            
            // Update UI
            if (window.updateIslandPropertiesUI) {
                updateIslandPropertiesUI();
            }
        } else {
            alert('Island image not loaded yet');
        }
    }
    
    // Enhanced selectIsland with UI updates
    selectIsland(islandId, addToSelection = false) {
        this.performanceMonitor.startOperation('select-island');
        
        try {
            if (!addToSelection) {
                this.state.selectedIslands.clear();
            }
            
            this.state.selectedIslands.add(islandId);
            
            // Find and set primary selection
            this.selectedIsland = this.islands.find(island => island.name === islandId);
            
            // Validate selected island if real-time validation is enabled
            if (this.features.realTimeValidation && this.selectedIsland) {
                const validationResults = this.validationSystem.validateIsland(this.selectedIsland);
                const failures = validationResults.filter(r => !r.valid);
                
                if (failures.length > 0) {
                    this.eventBus.emit('validation:failed', {
                        island: islandId,
                        errors: failures
                    });
                }
            }
            
            // Update UI elements
            this.updateIslandSelector();
            this.updateIslandFormValues();
            this.updateCollisionPointsList();
            
            this.eventBus.emit('island:selected', {
                selected: Array.from(this.state.selectedIslands),
                primary: islandId
            });
            
            this.markDirty('selection');
            
        } catch (error) {
            this.debugFramework.log(`Island selection error: ${error.message}`, 'error');
        } finally {
            this.performanceMonitor.endOperation('select-island');
        }
    }
}

// Export for use
window.AdvancedMapEditor = AdvancedMapEditor;