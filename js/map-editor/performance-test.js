/**
 * Performance Testing Utility for Map Editor
 * 
 * Usage: Include this script in both editors and call runPerformanceTest()
 * from the browser console to measure performance metrics
 */

window.runPerformanceTest = function() {
    console.log('🚀 Starting Map Editor Performance Test...');
    
    const metrics = {
        renderCalls: 0,
        frameTimes: [],
        mouseEvents: 0,
        memoryStart: 0,
        memoryEnd: 0,
        startTime: performance.now()
    };
    
    // Get initial memory usage if available
    if (performance.memory) {
        metrics.memoryStart = performance.memory.usedJSHeapSize / 1048576; // MB
    }
    
    // Hook into render function
    const originalRender = mapEditor.render;
    mapEditor.render = function() {
        const start = performance.now();
        originalRender.call(this);
        const end = performance.now();
        
        metrics.renderCalls++;
        metrics.frameTimes.push(end - start);
    };
    
    // Track mouse events
    const originalMouseMove = mapEditor.handleMouseMove || mapEditor.handleMouseMoveInternal;
    if (originalMouseMove) {
        mapEditor.handleMouseMove = function(e) {
            metrics.mouseEvents++;
            originalMouseMove.call(this, e);
        };
    }
    
    // Simulate user interaction
    console.log('📍 Simulating user interaction for 10 seconds...');
    
    // Simulate mouse movement
    let mouseX = 100;
    let mouseY = 100;
    const mouseInterval = setInterval(() => {
        mouseX = (mouseX + 10) % window.innerWidth;
        mouseY = (mouseY + 10) % window.innerHeight;
        
        const event = new MouseEvent('mousemove', {
            clientX: mouseX,
            clientY: mouseY,
            bubbles: true
        });
        mapEditor.canvas.dispatchEvent(event);
    }, 16); // 60fps mouse movement
    
    // Simulate zoom
    const zoomInterval = setInterval(() => {
        const event = new WheelEvent('wheel', {
            deltaY: Math.random() > 0.5 ? -100 : 100,
            clientX: window.innerWidth / 2,
            clientY: window.innerHeight / 2
        });
        mapEditor.canvas.dispatchEvent(event);
    }, 1000); // Zoom every second
    
    // Stop test after 10 seconds
    setTimeout(() => {
        clearInterval(mouseInterval);
        clearInterval(zoomInterval);
        
        // Restore original functions
        mapEditor.render = originalRender;
        if (originalMouseMove) {
            mapEditor.handleMouseMove = originalMouseMove;
        }
        
        // Get final memory usage
        if (performance.memory) {
            metrics.memoryEnd = performance.memory.usedJSHeapSize / 1048576; // MB
        }
        
        // Calculate statistics
        const totalTime = (performance.now() - metrics.startTime) / 1000; // seconds
        const avgFrameTime = metrics.frameTimes.reduce((a, b) => a + b, 0) / metrics.frameTimes.length;
        const maxFrameTime = Math.max(...metrics.frameTimes);
        const minFrameTime = Math.min(...metrics.frameTimes);
        const fps = 1000 / avgFrameTime;
        
        // Display results
        console.log('');
        console.log('📊 Performance Test Results:');
        console.log('============================');
        console.log(`⏱️  Test Duration: ${totalTime.toFixed(2)} seconds`);
        console.log(`🖼️  Total Render Calls: ${metrics.renderCalls}`);
        console.log(`📈 Renders per Second: ${(metrics.renderCalls / totalTime).toFixed(2)}`);
        console.log(`🖱️  Mouse Events Processed: ${metrics.mouseEvents}`);
        console.log('');
        console.log('Frame Time Statistics:');
        console.log(`  Average: ${avgFrameTime.toFixed(2)}ms (${fps.toFixed(1)} FPS)`);
        console.log(`  Min: ${minFrameTime.toFixed(2)}ms`);
        console.log(`  Max: ${maxFrameTime.toFixed(2)}ms`);
        console.log('');
        
        if (performance.memory) {
            console.log('Memory Usage:');
            console.log(`  Start: ${metrics.memoryStart.toFixed(2)} MB`);
            console.log(`  End: ${metrics.memoryEnd.toFixed(2)} MB`);
            console.log(`  Delta: ${(metrics.memoryEnd - metrics.memoryStart).toFixed(2)} MB`);
        }
        
        // Performance rating
        console.log('');
        console.log('Performance Rating:');
        if (fps >= 55) {
            console.log('✅ EXCELLENT - Smooth 60 FPS performance');
        } else if (fps >= 45) {
            console.log('🟨 GOOD - Acceptable performance');
        } else if (fps >= 30) {
            console.log('🟧 FAIR - Noticeable lag');
        } else {
            console.log('🔴 POOR - Significant performance issues');
        }
        
        // Recommendations
        if (metrics.renderCalls / totalTime > 100) {
            console.log('');
            console.log('⚠️  Warning: Excessive render calls detected!');
            console.log('   Consider implementing dirty flag system or render throttling.');
        }
        
        console.log('');
        console.log('💡 Tip: Run this test in both versions to compare performance.');
        
    }, 10000);
};

// Auto-run test if query parameter is present
if (window.location.search.includes('perftest=true')) {
    window.addEventListener('load', () => {
        setTimeout(() => {
            console.log('Auto-running performance test...');
            runPerformanceTest();
        }, 2000); // Wait for editor to fully initialize
    });
}

console.log('✅ Performance test utility loaded. Run `runPerformanceTest()` to start.');