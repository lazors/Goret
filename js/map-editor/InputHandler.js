/**
 * Input Handler Module
 * 
 * Manages all user input including mouse events, keyboard shortcuts,
 * and drag operations for the map editor.
 * 
 * @module InputHandler
 */

export class InputHandler {
    constructor(editor) {
        this.editor = editor;
        
        // Keyboard state
        this.keys = {};
        
        // Bound methods for event listeners
        this.boundHandlers = {
            mouseDown: this.onMouseDown.bind(this),
            mouseMove: this.onMouseMove.bind(this),
            mouseUp: this.onMouseUp.bind(this),
            wheel: this.onWheel.bind(this),
            contextMenu: (e) => e.preventDefault(),
            keyDown: this.onKeyDown.bind(this),
            keyUp: this.onKeyUp.bind(this)
        };
    }
    
    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        const canvas = this.editor.canvas;
        
        // Mouse events
        canvas.addEventListener('mousedown', this.boundHandlers.mouseDown);
        canvas.addEventListener('mousemove', this.boundHandlers.mouseMove);
        canvas.addEventListener('mouseup', this.boundHandlers.mouseUp);
        canvas.addEventListener('wheel', this.boundHandlers.wheel);
        canvas.addEventListener('contextmenu', this.boundHandlers.contextMenu);
        
        // Keyboard events
        window.addEventListener('keydown', this.boundHandlers.keyDown);
        window.addEventListener('keyup', this.boundHandlers.keyUp);
    }
    
    /**
     * Remove all event listeners
     */
    removeEventListeners() {
        const canvas = this.editor.canvas;
        
        // Mouse events
        canvas.removeEventListener('mousedown', this.boundHandlers.mouseDown);
        canvas.removeEventListener('mousemove', this.boundHandlers.mouseMove);
        canvas.removeEventListener('mouseup', this.boundHandlers.mouseUp);
        canvas.removeEventListener('wheel', this.boundHandlers.wheel);
        canvas.removeEventListener('contextmenu', this.boundHandlers.contextMenu);
        
        // Keyboard events
        window.removeEventListener('keydown', this.boundHandlers.keyDown);
        window.removeEventListener('keyup', this.boundHandlers.keyUp);
    }
    
    /**
     * Handle mouse down event
     * @param {MouseEvent} event
     */
    onMouseDown(event) {
        const rect = this.editor.canvas.getBoundingClientRect();
        const mouse = this.editor.mouse;
        
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
        mouse.isDown = true;
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
        
        this.editor.updateWorldMouse();
        
        // Try island transform first if in select mode
        if (this.editor.currentTool === 'select' && this.editor.selectedIsland) {
            if (this.editor.islandTransform.startDrag(mouse.worldX, mouse.worldY, this.editor.selectedIsland)) {
                this.editor.render();
                return;
            }
        }
        
        // Handle tool-specific actions
        this.editor.toolManager.processToolClick();
        
        this.editor.render();
    }
    
    /**
     * Handle mouse move event
     * @param {MouseEvent} event
     */
    onMouseMove(event) {
        const rect = this.editor.canvas.getBoundingClientRect();
        const mouse = this.editor.mouse;
        
        mouse.x = event.clientX - rect.left;
        mouse.y = event.clientY - rect.top;
        
        this.editor.updateWorldMouse();
        
        // Update cursor based on transform handles
        if (this.editor.currentTool === 'select' && this.editor.selectedIsland && !mouse.isDown) {
            const cursor = this.editor.islandTransform.getCursor(mouse.worldX, mouse.worldY, this.editor.selectedIsland);
            this.editor.canvas.style.cursor = cursor;
        }
        
        // Handle dragging
        if (mouse.isDown) {
            // Try island transform first
            if (this.editor.islandTransform.isTransforming()) {
                if (this.editor.islandTransform.updateDrag(mouse.worldX, mouse.worldY, this.editor.selectedIsland)) {
                    this.editor.render();
                    this.editor.uiManager.updateIslandProperties();
                }
            }
            // Try tool-specific drag
            else if (!this.editor.toolManager.handleToolDrag()) {
                // If tool doesn't handle drag, pan viewport
                if (this.editor.currentTool === 'select') {
                    mouse.isDragging = true;
                    const deltaX = mouse.x - mouse.lastX;
                    const deltaY = mouse.y - mouse.lastY;
                    
                    this.editor.viewportController.handlePan(deltaX, deltaY);
                }
            }
        }
        
        mouse.lastX = mouse.x;
        mouse.lastY = mouse.y;
        this.editor.uiManager.updateStatusBar();
    }
    
    /**
     * Handle mouse up event
     * @param {MouseEvent} event
     */
    onMouseUp(event) {
        this.editor.mouse.isDown = false;
        this.editor.mouse.isDragging = false;
        
        // End any ongoing transform
        if (this.editor.islandTransform.endDrag()) {
            this.editor.render();
            this.editor.uiManager.updateIslandProperties();
        }
        
        // Reset cursor
        this.editor.canvas.style.cursor = 'crosshair';
    }
    
    /**
     * Handle mouse wheel event
     * @param {WheelEvent} event
     */
    onWheel(event) {
        this.editor.viewportController.handleWheel(event);
    }
    
    /**
     * Handle keyboard key down
     * @param {KeyboardEvent} event
     */
    onKeyDown(event) {
        this.keys[event.code] = true;
        
        switch (event.code) {
            case 'KeyG':
                event.preventDefault();
                this.editor.viewportController.toggleGrid();
                break;
                
            case 'KeyF':
                event.preventDefault();
                this.editor.viewportController.fitWorld();
                break;
                
            case 'KeyR':
                event.preventDefault();
                this.editor.viewportController.resetView();
                break;
                
            case 'F12':
                event.preventDefault();
                this.toggleDebugMode();
                break;
                
            case 'Delete':
                this.handleDelete();
                break;
                
            // Tool shortcuts
            case 'KeyS':
                if (!event.ctrlKey) { // Avoid conflict with save
                    this.editor.toolManager.setTool('select');
                }
                break;
                
            case 'KeyI':
                this.editor.toolManager.setTool('addIsland');
                break;
                
            case 'KeyC':
                this.editor.toolManager.setTool('addCircle');
                break;
                
            case 'KeyD':
                if (!event.ctrlKey) { // Avoid conflict with duplicate
                    this.editor.toolManager.setTool('delete');
                }
                break;
                
            // Zoom shortcuts
            case 'NumpadAdd':
            case 'Equal':
                event.preventDefault();
                this.editor.viewportController.zoomBy(1.1);
                break;
                
            case 'NumpadSubtract':
            case 'Minus':
                event.preventDefault();
                this.editor.viewportController.zoomBy(0.9);
                break;
                
            case 'Digit0':
            case 'Numpad0':
                if (!event.ctrlKey) { // Avoid conflict with browser zoom reset
                    event.preventDefault();
                    this.editor.viewportController.resetView();
                }
                break;
                
            // Save shortcut
            case 'KeyS':
                if (event.ctrlKey) {
                    event.preventDefault();
                    this.editor.dataManager.saveToServer();
                }
                break;
        }
    }
    
    /**
     * Handle keyboard key up
     * @param {KeyboardEvent} event
     */
    onKeyUp(event) {
        this.keys[event.code] = false;
    }
    
    /**
     * Toggle debug mode
     */
    toggleDebugMode() {
        this.editor.debugMode = !this.editor.debugMode;
        this.editor.render();
        console.log(`Debug mode: ${this.editor.debugMode ? 'ON' : 'OFF'}`);
    }
    
    /**
     * Handle delete key action
     */
    handleDelete() {
        if (this.editor.selectedCircle && this.editor.selectedIsland) {
            // Delete selected circle
            this.editor.collisionManager.deleteCircle(
                this.editor.selectedIsland, 
                this.editor.selectedCircle
            );
            this.editor.selectCircle(null);
            this.editor.uiManager.updateCollisionCirclesList();
            this.editor.render();
        } else if (this.editor.selectedIsland) {
            // Delete selected island
            if (confirm(`Delete island "${this.editor.selectedIsland.name}"?`)) {
                this.editor.islandManager.deleteIsland(this.editor.selectedIsland);
                this.editor.selectIsland(null);
                this.editor.uiManager.updateIslandsList();
                this.editor.render();
            }
        }
    }
    
    /**
     * Check if a specific key is currently pressed
     * @param {string} keyCode - Key code to check
     * @returns {boolean} True if key is pressed
     */
    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }
    
    /**
     * Get current modifier keys state
     * @returns {Object} Modifier keys state
     */
    getModifiers() {
        return {
            shift: this.keys['ShiftLeft'] || this.keys['ShiftRight'],
            ctrl: this.keys['ControlLeft'] || this.keys['ControlRight'],
            alt: this.keys['AltLeft'] || this.keys['AltRight'],
            meta: this.keys['MetaLeft'] || this.keys['MetaRight']
        };
    }
}