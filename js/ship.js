/**
 * Pirate Game - Ship Class
 * Movement control, inertia, turns and collisions
 */

class Ship {
    constructor(x, y, sprite) {
        // Position
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        
        // Movement physics
        this.angle = 0; // angle in radians
        this.currentSpeed = 0;
        this.maxSpeed = 200; // pixels per second
        this.acceleration = 150; // acceleration
        this.deceleration = 100; // deceleration
        this.turnSpeed = 3; // turn speed (radians per second)
        
        // Visualization
        this.sprite = sprite;
        this.width = 60;
        this.height = 40;
        this.radius = 35; // for collisions
        
        // Effects
        this.wakeTrail = []; // ship wake
        this.maxTrailLength = 20;
        
        // Ship state
        this.isMovingForward = false;
        this.isMovingBackward = false;
        this.isTurningLeft = false;
        this.isTurningRight = false;
        
        console.log('🚢 Ship created at position:', x, y);
    }
    
    update(deltaTime, keys, map) {
        // Save previous position
        this.prevX = this.x;
        this.prevY = this.y;
        
        // Input processing
        this.handleInput(keys);
        
        // Update rotation angle
        this.updateRotation(deltaTime);
        
        // Update speed
        this.updateSpeed(deltaTime);
        
        // Update position
        this.updatePosition(deltaTime);
        
        // Check map collisions
        this.handleMapConstraints(map);
        
        // Update wake trail
        this.updateWakeTrail();
    }
    
    handleInput(keys) {
        // Reset state
        this.isMovingForward = false;
        this.isMovingBackward = false;
        this.isTurningLeft = false;
        this.isTurningRight = false;
        
        // Process forward/backward movement
        if (keys['ArrowUp'] || keys['KeyW']) {
            this.isMovingForward = true;
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            this.isMovingBackward = true;
        }
        
        // Process turns
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.isTurningLeft = true;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.isTurningRight = true;
        }
    }
    
    updateRotation(deltaTime) {
        if (this.isTurningLeft) {
            this.angle -= this.turnSpeed * deltaTime;
        }
        if (this.isTurningRight) {
            this.angle += this.turnSpeed * deltaTime;
        }
        
        // Normalize angle
        if (this.angle < 0) this.angle += Math.PI * 2;
        if (this.angle >= Math.PI * 2) this.angle -= Math.PI * 2;
    }
    
    updateSpeed(deltaTime) {
        let targetSpeed = 0;
        
        if (this.isMovingForward) {
            targetSpeed = this.maxSpeed;
        } else if (this.isMovingBackward) {
            targetSpeed = -this.maxSpeed * 0.5; // slower backward
        }
        
        // Smooth speed change (inertia)
        if (targetSpeed > this.currentSpeed) {
            this.currentSpeed += this.acceleration * deltaTime;
            if (this.currentSpeed > targetSpeed) {
                this.currentSpeed = targetSpeed;
            }
        } else if (targetSpeed < this.currentSpeed) {
            this.currentSpeed -= this.deceleration * deltaTime;
            if (this.currentSpeed < targetSpeed) {
                this.currentSpeed = targetSpeed;
            }
        } else {
            // Natural deceleration
            if (this.currentSpeed > 0) {
                this.currentSpeed -= this.deceleration * deltaTime;
                if (this.currentSpeed < 0) this.currentSpeed = 0;
            } else if (this.currentSpeed < 0) {
                this.currentSpeed += this.deceleration * deltaTime;
                if (this.currentSpeed > 0) this.currentSpeed = 0;
            }
        }
    }
    
    updatePosition(deltaTime) {
        // Calculate new position based on angle and speed
        // Adjust for ship image orientation (bow points right in image, but we want it to point up)
        const deltaX = Math.cos(this.angle - Math.PI/2) * this.currentSpeed * deltaTime;
        const deltaY = Math.sin(this.angle - Math.PI/2) * this.currentSpeed * deltaTime;
        
        this.x += deltaX;
        this.y += deltaY;
    }
    
    handleMapConstraints(map) {
        if (!map) return;
        
        // Check map boundaries
        const constrainedPos = map.getConstrainedPosition(this.x, this.y, this.radius);
        
        if (constrainedPos.x !== this.x || constrainedPos.y !== this.y) {
            // Ship reached map edge
            this.x = constrainedPos.x;
            this.y = constrainedPos.y;
            this.currentSpeed *= 0.5; // reduce speed on edge collision
        }
        
        // Check island collisions
        const islandCollision = map.checkIslandCollision(this.x, this.y, this.radius);
        if (islandCollision.collision) {
            // Push away from island
            const pushForce = 50;
            this.x += islandCollision.pushX * pushForce * 0.016; // 0.016 ≈ deltaTime
            this.y += islandCollision.pushY * pushForce * 0.016;
            
            // Reduce speed on collision
            this.currentSpeed *= 0.3;
            
            // Constrain position within map after push
            const newConstrainedPos = map.getConstrainedPosition(this.x, this.y, this.radius);
            this.x = newConstrainedPos.x;
            this.y = newConstrainedPos.y;
        }
    }
    
    updateWakeTrail() {
        // Add new wake point if ship is moving
        if (Math.abs(this.currentSpeed) > 10) {
            // Calculate ship stern position (back of ship)
            const sternX = this.x - Math.cos(this.angle - Math.PI/2) * 25;
            const sternY = this.y - Math.sin(this.angle - Math.PI/2) * 25;
            
            this.wakeTrail.push({
                x: sternX,
                y: sternY,
                age: 0,
                opacity: 1.0
            });
        }
        
        // Update and remove old wake points
        this.wakeTrail = this.wakeTrail.filter(point => {
            point.age += 0.016; // approximate deltaTime
            point.opacity = Math.max(0, 1.0 - (point.age / 3)); // fade over 3 seconds
            return point.age < 3;
        });
        
        // Limit wake length
        if (this.wakeTrail.length > this.maxTrailLength) {
            this.wakeTrail = this.wakeTrail.slice(-this.maxTrailLength);
        }
    }
    
    draw(ctx) {
        // Draw wake trail
        this.drawWakeTrail(ctx);
        
        // Save context state
        ctx.save();
        
        // Move to ship center
        ctx.translate(this.x, this.y);
        
        // Rotate to current angle
        // Adjust rotation to account for ship image orientation (bow points right in image)
        ctx.rotate(this.angle - Math.PI/2);
        
        // Draw ship relative to center
        if (this.sprite) {
            ctx.drawImage(
                this.sprite,
                -this.width / 2,
                -this.height / 2,
                this.width,
                this.height
            );
        } else {
            // Fallback - simple triangle
            ctx.fillStyle = '#8b4513';
            ctx.beginPath();
            ctx.moveTo(0, -25); // bow
            ctx.lineTo(-15, 20); // port side
            ctx.lineTo(15, 20); // starboard side
            ctx.closePath();
            ctx.fill();
            
            // Sails
            ctx.fillStyle = '#f5f5dc';
            ctx.fillRect(-12, -10, 24, 20);
        }
        
        // Restore context state
        ctx.restore();
        
        // Draw additional effects
        this.drawSpeedEffects(ctx);
    }
    
    drawWakeTrail(ctx) {
        if (this.wakeTrail.length < 2) return;
        
        ctx.save();
        
        // Draw wider wake trail with ship-like contour
        for (let i = 0; i < this.wakeTrail.length - 1; i++) {
            const point = this.wakeTrail[i];
            const nextPoint = this.wakeTrail[i + 1];
            
            // Calculate trail width based on distance from ship (wider at back)
            const distanceFromShip = i / this.wakeTrail.length;
            const trailWidth = 8 + (distanceFromShip * 12); // 8px at front, 20px at back
            
            // More transparent and wider wake trail
            ctx.strokeStyle = `rgba(255, 255, 255, ${point.opacity * 0.4})`;
            ctx.lineWidth = trailWidth * point.opacity;
            
            ctx.beginPath();
            ctx.moveTo(point.x, point.y);
            ctx.lineTo(nextPoint.x, nextPoint.y);
            ctx.stroke();
        }
        
        // Draw ship-like contour at the back (stern area)
        if (this.wakeTrail.length > 0) {
            const sternPoint = this.wakeTrail[0]; // Most recent point (closest to ship)
            
            // Calculate stern position and angle
            const sternX = this.x - Math.cos(this.angle - Math.PI/2) * 25;
            const sternY = this.y - Math.sin(this.angle - Math.PI/2) * 25;
            
            // Draw ship stern contour
            ctx.strokeStyle = `rgba(255, 255, 255, ${sternPoint.opacity * 0.6})`;
            ctx.lineWidth = 3;
            
            // Draw curved stern contour
            ctx.beginPath();
            ctx.arc(sternX, sternY, 15, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw additional detail lines
            ctx.strokeStyle = `rgba(255, 255, 255, ${sternPoint.opacity * 0.3})`;
            ctx.lineWidth = 1;
            
            // Draw stern detail lines
            const detailRadius = 12;
            ctx.beginPath();
            ctx.arc(sternX, sternY, detailRadius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawSpeedEffects(ctx) {
        // Removed splash animation at ship bow for cleaner look
    }
    
    getInfo() {
        return {
            x: Math.round(this.x),
            y: Math.round(this.y),
            angle: Math.round(this.angle * 180 / Math.PI),
            speed: Math.round(this.currentSpeed),
            direction: this.getDirectionString()
        };
    }
    
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
    }
    
    setAngle(angle) {
        this.angle = angle;
    }
    
    drawDebugInfo(ctx) {
        // Draw collision radius
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        
        // Draw movement direction
        if (Math.abs(this.currentSpeed) > 5) {
            ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)';
            ctx.lineWidth = 3;
            const endX = this.x + Math.cos(this.angle - Math.PI/2) * 50;
            const endY = this.y + Math.sin(this.angle - Math.PI/2) * 50;
            
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
    }
    
    getDirectionString() {
        const angle = this.angle * 180 / Math.PI;
        const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        const index = Math.round(angle / 45) % 8;
        return directions[index < 0 ? index + 8 : index];
    }
} 