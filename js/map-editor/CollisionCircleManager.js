/**
 * Collision Circle Manager Module
 * 
 * Manages collision circles for islands including creation, modification,
 * deletion, optimization, and auto-generation from PNG images.
 * 
 * @module CollisionCircleManager
 */

export class CollisionCircleManager {
    constructor(editor) {
        this.editor = editor;
    }
    
    /**
     * Add a new collision circle to the selected island
     * @param {Object} island - Island to add circle to
     * @param {number} x - X offset from island center
     * @param {number} y - Y offset from island center
     * @returns {Object} The newly created circle
     */
    addCircle(island, x = 0, y = 0) {
        if (!island) {
            alert('Please select an island first');
            return null;
        }
        
        const newCircle = {
            x: x,
            y: y,
            radius: 100
        };
        
        if (!island.collisionCircles) {
            island.collisionCircles = [];
        }
        
        island.collisionCircles.push(newCircle);
        console.log(`Added collision circle to ${island.name}`);
        
        return newCircle;
    }
    
    /**
     * Delete a collision circle from an island
     * @param {Object} island - Island containing the circle
     * @param {Object} circle - Circle to delete
     */
    deleteCircle(island, circle) {
        if (!island || !circle) return;
        
        const index = island.collisionCircles.indexOf(circle);
        if (index > -1) {
            island.collisionCircles.splice(index, 1);
            console.log(`Deleted collision circle from ${island.name}`);
        }
    }
    
    /**
     * Update circle properties
     * @param {Object} circle - Circle to update
     * @param {Object} properties - Properties to update (x, y, radius)
     */
    updateCircle(circle, properties) {
        if (!circle) return;
        
        if (properties.x !== undefined) circle.x = parseFloat(properties.x) || 0;
        if (properties.y !== undefined) circle.y = parseFloat(properties.y) || 0;
        if (properties.radius !== undefined) circle.radius = parseFloat(properties.radius) || 100;
    }
    
    /**
     * Find collision circle at specified world coordinates
     * @param {number} worldX - World X coordinate
     * @param {number} worldY - World Y coordinate
     * @returns {Object|null} Object containing island and circle, or null
     */
    getCircleAt(worldX, worldY) {
        for (let island of this.editor.islands) {
            if (island.collisionCircles) {
                for (let circle of island.collisionCircles) {
                    const circleWorldX = island.x + circle.x;
                    const circleWorldY = island.y + circle.y;
                    const dx = worldX - circleWorldX;
                    const dy = worldY - circleWorldY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance <= circle.radius) {
                        return { island, circle };
                    }
                }
            }
        }
        return null;
    }
    
    /**
     * Auto-generate collision circles from PNG image
     * @param {Object} island - Island to generate circles for
     */
    generateCirclesForIsland(island) {
        if (!island.image) {
            // Fallback: single circle
            island.collisionCircles = [{ x: 0, y: 0, radius: 200 }];
            return;
        }
        
        // Create a temporary canvas to analyze the PNG
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        
        const img = island.image;
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        
        // Draw image to get pixel data
        tempCtx.drawImage(img, 0, 0);
        
        try {
            const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const pixels = imageData.data;
            
            // Find island bounds (non-transparent pixels)
            let minX = tempCanvas.width, maxX = 0;
            let minY = tempCanvas.height, maxY = 0;
            const opaquePixels = [];
            
            for (let y = 0; y < tempCanvas.height; y++) {
                for (let x = 0; x < tempCanvas.width; x++) {
                    const index = (y * tempCanvas.width + x) * 4;
                    const alpha = pixels[index + 3];
                    
                    if (alpha > 100) { // Consider semi-transparent as solid
                        minX = Math.min(minX, x);
                        maxX = Math.max(maxX, x);
                        minY = Math.min(minY, y);
                        maxY = Math.max(maxY, y);
                        opaquePixels.push({ x, y });
                    }
                }
            }
            
            if (opaquePixels.length === 0) {
                // Fallback for transparent images
                island.collisionCircles = [{ x: 0, y: 0, radius: 200 }];
                return;
            }
            
            // Calculate dimensions and generate circles
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Scale factors to match visual size
            const scaleX = (island.scale || 1.0) * 2;
            const scaleY = (island.scale || 1.0) * 2;
            
            // Generate circles based on PNG shape analysis
            const circles = this.generateOptimalCircles(width, height, scaleX, scaleY);
            
            // Ensure minimum radius and round values
            island.collisionCircles = circles.map(circle => ({
                x: Math.round(circle.x),
                y: Math.round(circle.y),
                radius: Math.max(50, Math.round(circle.radius))
            }));
            
        } catch (error) {
            console.warn('Error analyzing PNG pixels:', error);
            // Fallback circle generation
            island.collisionCircles = this.generateFallbackCircles();
        }
    }
    
    /**
     * Generate optimal circle placement based on dimensions
     * @private
     */
    generateOptimalCircles(width, height, scaleX, scaleY) {
        const circles = [];
        
        // Main central circle
        circles.push({
            x: 0,
            y: 0,
            radius: Math.max(width, height) * scaleX * 0.3
        });
        
        // Additional circles for better shape coverage
        if (width > height * 1.3) {
            // Wide island - add horizontal circles
            circles.push({
                x: -width * scaleX * 0.25,
                y: 0,
                radius: Math.min(width, height) * scaleX * 0.25
            });
            circles.push({
                x: width * scaleX * 0.25,
                y: 0,
                radius: Math.min(width, height) * scaleX * 0.25
            });
        } else if (height > width * 1.3) {
            // Tall island - add vertical circles
            circles.push({
                x: 0,
                y: -height * scaleY * 0.25,
                radius: Math.min(width, height) * scaleX * 0.25
            });
            circles.push({
                x: 0,
                y: height * scaleY * 0.25,
                radius: Math.min(width, height) * scaleX * 0.25
            });
        } else {
            // Roughly square - add corner circles
            const cornerRadius = Math.min(width, height) * scaleX * 0.2;
            circles.push({
                x: -width * scaleX * 0.2,
                y: -height * scaleY * 0.2,
                radius: cornerRadius
            });
            circles.push({
                x: width * scaleX * 0.2,
                y: -height * scaleY * 0.2,
                radius: cornerRadius
            });
            circles.push({
                x: -width * scaleX * 0.2,
                y: height * scaleY * 0.2,
                radius: cornerRadius
            });
            circles.push({
                x: width * scaleX * 0.2,
                y: height * scaleY * 0.2,
                radius: cornerRadius
            });
        }
        
        return circles;
    }
    
    /**
     * Generate fallback circles when PNG analysis fails
     * @private
     */
    generateFallbackCircles() {
        return [
            { x: 0, y: 0, radius: 200 },
            { x: -100, y: -100, radius: 100 },
            { x: 100, y: -100, radius: 100 },
            { x: -100, y: 100, radius: 100 },
            { x: 100, y: 100, radius: 100 }
        ];
    }
    
    /**
     * Optimize collision circles by merging overlapping ones
     * @param {Object} island - Island to optimize circles for
     */
    optimizeCircles(island) {
        if (!island || !island.collisionCircles) return;
        
        const circles = island.collisionCircles;
        const optimized = [];
        
        for (let i = 0; i < circles.length; i++) {
            let merged = false;
            for (let j = 0; j < optimized.length; j++) {
                const dx = circles[i].x - optimized[j].x;
                const dy = circles[i].y - optimized[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Merge if circles overlap significantly
                if (distance < (circles[i].radius + optimized[j].radius) * 0.5) {
                    // Merge circles
                    optimized[j].x = (circles[i].x + optimized[j].x) / 2;
                    optimized[j].y = (circles[i].y + optimized[j].y) / 2;
                    optimized[j].radius = Math.max(circles[i].radius, optimized[j].radius) * 1.2;
                    merged = true;
                    break;
                }
            }
            
            if (!merged) {
                optimized.push({ ...circles[i] });
            }
        }
        
        island.collisionCircles = optimized;
        console.log(`Optimized collision circles: ${circles.length} -> ${optimized.length}`);
    }
    
    /**
     * Convert old polygon collision to Multi-Circle format
     * @param {Object} island - Island with polygon collision data
     * @returns {Array} Array of collision circles
     */
    convertPolygonToCircles(island) {
        const circles = [];
        
        if (island.collision && island.collision.length > 0) {
            // Find bounding box
            let minX = Infinity, maxX = -Infinity;
            let minY = Infinity, maxY = -Infinity;
            
            island.collision.forEach(point => {
                minX = Math.min(minX, point.x);
                maxX = Math.max(maxX, point.x);
                minY = Math.min(minY, point.y);
                maxY = Math.max(maxY, point.y);
            });
            
            // Create circles to cover the area
            const centerX = (minX + maxX) / 2 - island.x;
            const centerY = (minY + maxY) / 2 - island.y;
            const width = maxX - minX;
            const height = maxY - minY;
            
            // Main circle
            circles.push({
                x: centerX,
                y: centerY,
                radius: Math.max(width, height) / 3
            });
            
            // Additional circles for better coverage
            if (width > height) {
                circles.push({
                    x: centerX - width / 4,
                    y: centerY,
                    radius: Math.min(width, height) / 3
                });
                circles.push({
                    x: centerX + width / 4,
                    y: centerY,
                    radius: Math.min(width, height) / 3
                });
            } else {
                circles.push({
                    x: centerX,
                    y: centerY - height / 4,
                    radius: Math.min(width, height) / 3
                });
                circles.push({
                    x: centerX,
                    y: centerY + height / 4,
                    radius: Math.min(width, height) / 3
                });
            }
        } else {
            // Fallback: single circle
            circles.push({
                x: 0,
                y: 0,
                radius: island.radius || 200
            });
        }
        
        return circles;
    }
    
    /**
     * Handle circle selection
     * @param {Object} circle - Selected circle
     */
    onCircleSelected(circle) {
        if (circle) {
            document.getElementById('selectedCircleProps').style.display = 'block';
        } else {
            document.getElementById('selectedCircleProps').style.display = 'none';
        }
        
        this.editor.uiManager.updateCollisionCirclesList();
    }
}