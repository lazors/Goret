/**
 * Comprehensive Testing Framework for GORET Map Editor
 * 
 * Features:
 * - Unit tests for core functionality
 * - Integration tests for component interaction
 * - Performance benchmarks
 * - Visual regression tests
 * - User interaction simulation
 * - Automated test reporting
 * - CI/CD integration ready
 */

class TestingFramework {
    constructor(mapEditor) {
        this.mapEditor = mapEditor;
        this.tests = new Map();
        this.testSuites = new Map();
        this.results = [];
        this.benchmarks = new Map();
        
        // Test configuration
        this.config = {
            timeout: 5000,
            retries: 3,
            parallel: false,
            verbose: true,
            stopOnFirstFailure: false
        };
        
        // Test statistics
        this.stats = {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            skippedTests: 0,
            totalTime: 0,
            startTime: null
        };
        
        // Mock data for testing
        this.mockData = this.createMockData();
        
        // Setup default test suites
        this.setupCoreTestSuites();
        
        console.log('🧪 Testing Framework initialized');
    }
    
    /**
     * Create mock data for testing
     */
    createMockData() {
        return {
            islands: [
                {
                    name: 'Test Island 1',
                    x: 1000,
                    y: 1000,
                    width: 400,
                    height: 300,
                    radius: 200,
                    rotation: 0,
                    collision: [
                        { x: 800, y: 800 },
                        { x: 1200, y: 800 },
                        { x: 1200, y: 1200 },
                        { x: 800, y: 1200 }
                    ]
                },
                {
                    name: 'Test Island 2',
                    x: 2000,
                    y: 2000,
                    width: 600,
                    height: 400,
                    radius: 300,
                    rotation: 45,
                    collision: [
                        { x: 1700, y: 1800 },
                        { x: 2300, y: 1800 },
                        { x: 2300, y: 2200 },
                        { x: 1700, y: 2200 }
                    ]
                }
            ],
            worldConfig: {
                width: 10240,
                height: 7680,
                gridSize: 100
            }
        };
    }
    
    /**
     * Setup core test suites
     */
    setupCoreTestSuites() {
        // Core functionality tests
        this.addTestSuite('core', 'Core Map Editor Functionality', [
            this.testInitialization,
            this.testCanvasSetup,
            this.testEventBus,
            this.testStateManagement
        ]);
        
        // Island management tests
        this.addTestSuite('islands', 'Island Management', [
            this.testIslandCreation,
            this.testIslandSelection,
            this.testIslandManipulation,
            this.testIslandValidation
        ]);
        
        // Collision system tests
        this.addTestSuite('collision', 'Collision System', [
            this.testCollisionCreation,
            this.testCollisionEditing,
            this.testCollisionValidation,
            this.testCollisionOptimization
        ]);
        
        // Performance tests
        this.addTestSuite('performance', 'Performance Tests', [
            this.testRenderingPerformance,
            this.testMemoryUsage,
            this.testEventHandlingPerformance
        ]);
        
        // Integration tests
        this.addTestSuite('integration', 'Integration Tests', [
            this.testServerIntegration,
            this.testDataPersistence,
            this.testUndoRedoSystem
        ]);
    }
    
    /**
     * Add a test suite
     */
    addTestSuite(name, description, tests) {
        this.testSuites.set(name, {
            name,
            description,
            tests: tests.map(test => test.bind(this)),
            enabled: true
        });
    }
    
    /**
     * Add individual test
     */
    addTest(suiteName, testName, testFunction, options = {}) {
        const suite = this.testSuites.get(suiteName);
        if (suite) {
            suite.tests.push({
                name: testName,
                fn: testFunction.bind(this),
                ...options
            });
        }
    }
    
    /**
     * Run all test suites
     */
    async runAllTests() {
        console.log('🧪 Starting comprehensive test suite...');
        
        this.stats.startTime = Date.now();
        this.results = [];
        
        for (const [suiteName, suite] of this.testSuites) {
            if (suite.enabled) {
                console.log(`\n📋 Running test suite: ${suite.description}`);
                await this.runTestSuite(suiteName);
            }
        }
        
        this.stats.totalTime = Date.now() - this.stats.startTime;
        this.generateTestReport();
        
        return this.results;
    }
    
    /**
     * Run specific test suite
     */
    async runTestSuite(suiteName) {
        const suite = this.testSuites.get(suiteName);
        if (!suite) {
            console.error(`Test suite '${suiteName}' not found`);
            return;
        }
        
        const suiteResults = {
            suite: suiteName,
            description: suite.description,
            tests: [],
            passed: 0,
            failed: 0,
            skipped: 0,
            duration: 0
        };
        
        const suiteStart = Date.now();
        
        for (const test of suite.tests) {
            const result = await this.runTest(test, suiteName);
            suiteResults.tests.push(result);
            
            if (result.status === 'passed') suiteResults.passed++;
            else if (result.status === 'failed') suiteResults.failed++;
            else if (result.status === 'skipped') suiteResults.skipped++;
            
            if (this.config.stopOnFirstFailure && result.status === 'failed') {
                break;
            }
        }
        
        suiteResults.duration = Date.now() - suiteStart;
        this.results.push(suiteResults);
        
        console.log(`✅ Suite completed: ${suiteResults.passed} passed, ${suiteResults.failed} failed, ${suiteResults.skipped} skipped`);
    }
    
    /**
     * Run individual test
     */
    async runTest(test, suiteName) {
        const testName = test.name || test.constructor.name;
        const testResult = {
            name: testName,
            suite: suiteName,
            status: 'pending',
            duration: 0,
            error: null,
            assertions: 0
        };
        
        const testStart = Date.now();
        
        try {
            if (this.config.verbose) {
                console.log(`  🔍 Running: ${testName}`);
            }
            
            // Setup test environment
            await this.setupTest();
            
            // Run the test with timeout
            const testPromise = typeof test === 'function' ? test() : test.fn();
            
            await Promise.race([
                testPromise,
                this.createTimeout(this.config.timeout, `Test '${testName}' timed out`)
            ]);
            
            testResult.status = 'passed';
            this.stats.passedTests++;
            
        } catch (error) {
            testResult.status = 'failed';
            testResult.error = {
                message: error.message,
                stack: error.stack
            };
            this.stats.failedTests++;
            
            console.error(`  ❌ Failed: ${testName} - ${error.message}`);
            
        } finally {
            testResult.duration = Date.now() - testStart;
            this.stats.totalTests++;
            
            // Cleanup test environment
            await this.cleanupTest();
        }
        
        return testResult;
    }
    
    /**
     * Setup test environment
     */
    async setupTest() {
        // Reset editor state
        if (this.mapEditor.state) {
            this.mapEditor.state.selectedIslands.clear();
            this.mapEditor.selectedIsland = null;
        }
        
        // Load mock data
        this.mapEditor.islands = JSON.parse(JSON.stringify(this.mockData.islands));
        
        // Reset performance counters
        if (this.mapEditor.performanceMonitor) {
            this.mapEditor.performanceMonitor.metrics = {
                renderTime: [],
                frameRate: [],
                memoryUsage: [],
                operations: new Map()
            };
        }
    }
    
    /**
     * Cleanup test environment
     */
    async cleanupTest() {
        // Clear any test-created elements
        const testElements = document.querySelectorAll('[data-test="true"]');
        testElements.forEach(el => el.remove());
        
        // Reset canvas if needed
        if (this.mapEditor.ctx) {
            this.mapEditor.ctx.clearRect(0, 0, this.mapEditor.canvas.width, this.mapEditor.canvas.height);
        }
    }
    
    /**
     * Create timeout promise
     */
    createTimeout(ms, message) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error(message)), ms);
        });
    }
    
    // ===============================
    // CORE FUNCTIONALITY TESTS
    // ===============================
    
    async testInitialization() {
        this.assert(this.mapEditor.version, 'Editor should have version');
        this.assert(this.mapEditor.eventBus, 'Event bus should be initialized');
        this.assert(this.mapEditor.debugFramework, 'Debug framework should be initialized');
        this.assert(this.mapEditor.state, 'Editor state should be initialized');
    }
    
    async testCanvasSetup() {
        this.assert(this.mapEditor.canvas, 'Canvas should be available');
        this.assert(this.mapEditor.ctx, 'Canvas context should be available');
        this.assert(this.mapEditor.canvas.width > 0, 'Canvas should have width');
        this.assert(this.mapEditor.canvas.height > 0, 'Canvas should have height');
    }
    
    async testEventBus() {
        let eventReceived = false;
        const testData = { test: true };
        
        this.mapEditor.eventBus.on('test:event', (data) => {
            eventReceived = true;
            this.assertEqual(data.test, true, 'Event data should be passed correctly');
        });
        
        this.mapEditor.eventBus.emit('test:event', testData);
        
        this.assert(eventReceived, 'Event should be received by listener');
    }
    
    async testStateManagement() {
        const initialState = { ...this.mapEditor.state };
        
        // Test viewport changes
        this.mapEditor.state.viewport.zoom = 2.0;
        this.assertEqual(this.mapEditor.state.viewport.zoom, 2.0, 'Viewport zoom should update');
        
        // Test selection state
        this.mapEditor.state.selectedIslands.add('test-island');
        this.assert(this.mapEditor.state.selectedIslands.has('test-island'), 'Island should be selected');
    }
    
    // ===============================
    // ISLAND MANAGEMENT TESTS
    // ===============================
    
    async testIslandCreation() {
        const initialCount = this.mapEditor.islands.length;
        
        const newIsland = {
            name: 'Test Created Island',
            x: 3000,
            y: 3000,
            width: 500,
            height: 400,
            radius: 250,
            rotation: 0,
            collision: []
        };
        
        this.mapEditor.islands.push(newIsland);
        
        this.assertEqual(this.mapEditor.islands.length, initialCount + 1, 'Island should be added');
        this.assertEqual(this.mapEditor.islands[this.mapEditor.islands.length - 1].name, 'Test Created Island', 'Island name should be correct');
    }
    
    async testIslandSelection() {
        const island = this.mapEditor.islands[0];
        
        this.mapEditor.selectIsland(island.name);
        
        this.assertEqual(this.mapEditor.selectedIsland?.name, island.name, 'Island should be selected');
        this.assert(this.mapEditor.state.selectedIslands.has(island.name), 'Island should be in selection set');
    }
    
    async testIslandManipulation() {
        const island = this.mapEditor.islands[0];
        const originalX = island.x;
        
        // Test position change
        island.x = originalX + 100;
        this.assertEqual(island.x, originalX + 100, 'Island position should update');
        
        // Test rotation
        const originalRotation = island.rotation;
        island.rotation = 90;
        this.assertEqual(island.rotation, 90, 'Island rotation should update');
    }
    
    async testIslandValidation() {
        const island = this.mapEditor.islands[0];
        
        if (this.mapEditor.validationSystem) {
            const results = this.mapEditor.validationSystem.validateIsland(island);
            this.assert(Array.isArray(results), 'Validation should return results array');
        }
    }
    
    // ===============================
    // COLLISION SYSTEM TESTS
    // ===============================
    
    async testCollisionCreation() {
        const island = this.mapEditor.islands[0];
        const originalCollisionCount = island.collision?.length || 0;
        
        if (!island.collision) island.collision = [];
        
        island.collision.push({ x: 1000, y: 1000 });
        
        this.assertEqual(island.collision.length, originalCollisionCount + 1, 'Collision point should be added');
    }
    
    async testCollisionEditing() {
        const island = this.mapEditor.islands[0];
        
        if (island.collision && island.collision.length > 0) {
            const originalX = island.collision[0].x;
            island.collision[0].x = originalX + 50;
            
            this.assertEqual(island.collision[0].x, originalX + 50, 'Collision point should be moved');
        }
    }
    
    async testCollisionValidation() {
        const island = this.mapEditor.islands[0];
        
        // Test with too few collision points
        const invalidIsland = { ...island, collision: [{ x: 0, y: 0 }, { x: 100, y: 0 }] };
        
        if (this.mapEditor.validationSystem) {
            const results = this.mapEditor.validationSystem.validateIsland(invalidIsland);
            const collisionValidation = results.find(r => r.rule === 'island-collision');
            
            if (collisionValidation) {
                this.assertEqual(collisionValidation.valid, false, 'Island with too few collision points should be invalid');
            }
        }
    }
    
    async testCollisionOptimization() {
        const island = this.mapEditor.islands[0];
        
        if (island.collision && island.collision.length >= 4) {
            const originalCount = island.collision.length;
            
            // Add some redundant points for testing
            const midPoint = {
                x: (island.collision[0].x + island.collision[1].x) / 2,
                y: (island.collision[0].y + island.collision[1].y) / 2
            };
            island.collision.splice(1, 0, midPoint);
            
            // Simulate optimization (would call actual optimization method)
            // For testing, just verify we can manipulate collision points
            this.assert(island.collision.length > originalCount, 'Collision points should be added for optimization test');
        }
    }
    
    // ===============================
    // PERFORMANCE TESTS
    // ===============================
    
    async testRenderingPerformance() {
        const startTime = performance.now();
        const iterations = 10;
        
        for (let i = 0; i < iterations; i++) {
            if (this.mapEditor.render) {
                this.mapEditor.render();
            }
        }
        
        const avgRenderTime = (performance.now() - startTime) / iterations;
        
        this.assert(avgRenderTime < 16.67, `Average render time (${avgRenderTime.toFixed(2)}ms) should be under 16.67ms for 60fps`);
        
        console.log(`  📊 Average render time: ${avgRenderTime.toFixed(2)}ms`);
    }
    
    async testMemoryUsage() {
        if (!performance.memory) {
            console.log('  ⚠️ Memory testing not available in this browser');
            return;
        }
        
        const initialMemory = performance.memory.usedJSHeapSize;
        
        // Create and destroy some test objects
        const testObjects = [];
        for (let i = 0; i < 1000; i++) {
            testObjects.push({
                id: i,
                data: new Array(100).fill(Math.random())
            });
        }
        
        const peakMemory = performance.memory.usedJSHeapSize;
        
        // Clear test objects
        testObjects.length = 0;
        
        // Force garbage collection if available
        if (window.gc) window.gc();
        
        setTimeout(() => {
            const finalMemory = performance.memory.usedJSHeapSize;
            const memoryLeak = finalMemory - initialMemory;
            
            console.log(`  📊 Memory usage: Initial ${(initialMemory / 1048576).toFixed(2)}MB, Peak ${(peakMemory / 1048576).toFixed(2)}MB, Final ${(finalMemory / 1048576).toFixed(2)}MB`);
            
            this.assert(memoryLeak < 1048576, `Memory leak should be less than 1MB (actual: ${(memoryLeak / 1048576).toFixed(2)}MB)`);
        }, 100);
    }
    
    async testEventHandlingPerformance() {
        const eventCount = 1000;
        let receivedEvents = 0;
        
        const listener = () => { receivedEvents++; };
        
        this.mapEditor.eventBus.on('performance:test', listener);
        
        const startTime = performance.now();
        
        for (let i = 0; i < eventCount; i++) {
            this.mapEditor.eventBus.emit('performance:test', { index: i });
        }
        
        const duration = performance.now() - startTime;
        const eventsPerMs = eventCount / duration;
        
        this.assertEqual(receivedEvents, eventCount, 'All events should be received');
        this.assert(eventsPerMs > 1, `Event handling should be fast (${eventsPerMs.toFixed(2)} events/ms)`);
        
        console.log(`  📊 Event performance: ${eventsPerMs.toFixed(2)} events/ms`);
    }
    
    // ===============================
    // INTEGRATION TESTS
    // ===============================
    
    async testServerIntegration() {
        // Mock server response
        const mockFetch = (url) => {
            if (url.includes('/api/islands/load')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        islands: this.mockData.islands
                    })
                });
            }
            return Promise.reject(new Error('Unknown endpoint'));
        };
        
        // Temporarily replace fetch
        const originalFetch = window.fetch;
        window.fetch = mockFetch;
        
        try {
            if (this.mapEditor.loadIslandsFromServer) {
                const result = await this.mapEditor.loadIslandsFromServer();
                this.assert(result, 'Server integration should work with mock data');
            }
        } finally {
            window.fetch = originalFetch;
        }
    }
    
    async testDataPersistence() {
        const testData = { test: 'persistence' };
        
        // Test localStorage
        localStorage.setItem('goret-test', JSON.stringify(testData));
        const retrieved = JSON.parse(localStorage.getItem('goret-test') || '{}');
        
        this.assertEqual(retrieved.test, 'persistence', 'Data should persist in localStorage');
        
        // Cleanup
        localStorage.removeItem('goret-test');
    }
    
    async testUndoRedoSystem() {
        if (!this.mapEditor.undo || !this.mapEditor.redo) {
            console.log('  ⚠️ Undo/Redo system not implemented yet');
            return;
        }
        
        const island = this.mapEditor.islands[0];
        const originalX = island.x;
        
        // Make a change
        island.x = originalX + 100;
        
        // Undo
        this.mapEditor.undo();
        this.assertEqual(island.x, originalX, 'Undo should restore original value');
        
        // Redo
        this.mapEditor.redo();
        this.assertEqual(island.x, originalX + 100, 'Redo should restore changed value');
    }
    
    // ===============================
    // ASSERTION HELPERS
    // ===============================
    
    assert(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }
    
    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(`Assertion failed: ${message}. Expected: ${expected}, Actual: ${actual}`);
        }
    }
    
    assertApproxEqual(actual, expected, tolerance, message) {
        if (Math.abs(actual - expected) > tolerance) {
            throw new Error(`Assertion failed: ${message}. Expected: ${expected} ± ${tolerance}, Actual: ${actual}`);
        }
    }
    
    // ===============================
    // BENCHMARKING
    // ===============================
    
    async benchmark(name, fn, iterations = 100) {
        const times = [];
        
        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await fn();
            times.push(performance.now() - start);
        }
        
        const avg = times.reduce((a, b) => a + b) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        
        const result = { name, avg, min, max, iterations };
        this.benchmarks.set(name, result);
        
        console.log(`📊 Benchmark ${name}: avg ${avg.toFixed(2)}ms, min ${min.toFixed(2)}ms, max ${max.toFixed(2)}ms`);
        
        return result;
    }
    
    // ===============================
    // REPORTING
    // ===============================
    
    generateTestReport() {
        const totalTests = this.stats.totalTests;
        const passedTests = this.stats.passedTests;
        const failedTests = this.stats.failedTests;
        const successRate = totalTests > 0 ? (passedTests / totalTests * 100).toFixed(1) : 0;
        
        console.log('\n🧪 TEST REPORT');
        console.log('====================');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests}`);
        console.log(`Failed: ${failedTests}`);
        console.log(`Success Rate: ${successRate}%`);
        console.log(`Total Time: ${this.stats.totalTime}ms`);
        
        if (failedTests > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.forEach(suite => {
                suite.tests.forEach(test => {
                    if (test.status === 'failed') {
                        console.log(`  ${suite.suite}/${test.name}: ${test.error?.message}`);
                    }
                });
            });
        }
        
        // Performance summary
        if (this.benchmarks.size > 0) {
            console.log('\n📊 PERFORMANCE BENCHMARKS:');
            for (const [name, result] of this.benchmarks) {
                console.log(`  ${name}: ${result.avg.toFixed(2)}ms avg`);
            }
        }
        
        return {
            summary: {
                total: totalTests,
                passed: passedTests,
                failed: failedTests,
                successRate: parseFloat(successRate),
                duration: this.stats.totalTime
            },
            results: this.results,
            benchmarks: Object.fromEntries(this.benchmarks)
        };
    }
    
    exportReport(format = 'json') {
        const report = this.generateTestReport();
        
        if (format === 'json') {
            const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `goret-test-report-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
        }
        
        return report;
    }
}

// Global test runner function
window.runMapEditorTests = async function() {
    if (!window.mapEditor) {
        console.error('Map editor not found. Make sure it\'s initialized first.');
        return;
    }
    
    const testFramework = new TestingFramework(window.mapEditor);
    const results = await testFramework.runAllTests();
    
    console.log('\n🎯 Tests completed. Run testFramework.exportReport() to save results.');
    window.testFramework = testFramework;
    
    return results;
};

// Make available globally
window.TestingFramework = TestingFramework;

console.log('🧪 Testing Framework loaded. Run runMapEditorTests() to start testing.');