const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8001;
const ASSETS_DIR = path.join(__dirname, 'assets', 'Islands');

// Ensure assets/Islands directory exists
if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

const server = http.createServer(async (req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === '/api/save-island-image' && req.method === 'POST') {
        try {
            let body = '';
            
            req.on('data', chunk => {
                body += chunk.toString();
            });
            
            req.on('end', () => {
                try {
                    const data = JSON.parse(body);
                    const { filename, imageData, islandName } = data;
                    
                    // Validate input
                    if (!filename || !imageData || !islandName) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Missing required fields' }));
                        return;
                    }
                    
                    // Clean filename
                    const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
                    const filepath = path.join(ASSETS_DIR, cleanFilename);
                    
                    // Convert base64 to buffer
                    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
                    const buffer = Buffer.from(base64Data, 'base64');
                    
                    // Save file
                    fs.writeFileSync(filepath, buffer);
                    
                    console.log(`Saved island image: ${cleanFilename} for island: ${islandName}`);
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        success: true, 
                        filename: cleanFilename,
                        path: `assets/Islands/${cleanFilename}`
                    }));
                    
                } catch (error) {
                    console.error('Error saving image:', error);
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Failed to save image' }));
                }
            });
            
        } catch (error) {
            console.error('Error processing request:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Server error' }));
        }
    } else if (pathname === '/api/list-island-images' && req.method === 'GET') {
        try {
            const files = fs.readdirSync(ASSETS_DIR)
                .filter(file => /\.(png|jpg|jpeg|gif|webp)$/i.test(file))
                .map(file => ({
                    filename: file,
                    path: `assets/Islands/${file}`
                }));
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ images: files }));
        } catch (error) {
            console.error('Error listing images:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to list images' }));
        }
    } else {
        // Serve static files (fallback to existing functionality)
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

server.listen(PORT, () => {
    console.log(`🚀 GORET Map Editor Server running on http://localhost:${PORT}`);
    console.log(`📁 Island images will be saved to: ${ASSETS_DIR}`);
    console.log(`💡 Run your main game on http://localhost:8000 (http-server)`);
    console.log(`💡 This server handles image uploads for the map editor`);
});

// Handle server shutdown gracefully
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server shut down successfully');
        process.exit(0);
    });
});