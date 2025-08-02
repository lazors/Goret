/**
 * Pirate Game - Port Manager
 * Handles port interface and services when entering cities
 */

class PortManager {
    constructor(game) {
        this.game = game;
        this.currentPort = null;
        this.portInterface = null;
        this.portBackground = null;
        
        // Port services configuration
        this.services = {
            governor: {
                name: 'Governor\'s Mansion',
                icon: '🏛️',
                description: 'Meet with the colonial governor for special missions and pardons'
            },
            market: {
                name: 'Market Square',
                icon: '🏪',
                description: 'Buy and sell goods, manage your cargo'
            },
            tavern: {
                name: 'The Salty Sailor Tavern',
                icon: '🍺',
                description: 'Hire crew, gather information, and enjoy a drink'
            },
            dockmaster: {
                name: 'Dockmaster\'s Office',
                icon: '⚓',
                description: 'Ship repairs, upgrades, and harbor information'
            },
            bank: {
                name: 'Colonial Bank',
                icon: '🏦',
                description: 'Store gold, take loans, and exchange currencies'
            },
            church: {
                name: 'Sacred Heart Church',
                icon: '⛪',
                description: 'Blessing, healing, and sanctuary services'
            }
        };
        
        console.log('🏘️ Port Manager initialized');
    }
    
    async enterPort(portData) {
        try {
            console.log('🏘️ Entering port:', portData.name);
            
            this.currentPort = portData;
            this.game.gameState = 'port';
            
            // Load port background image
            await this.loadPortBackground();
            
            // Create port interface
            this.createPortInterface();
            
            // Hide any game UI elements
            this.hideGameUI();
            
        } catch (error) {
            console.error('❌ Error entering port:', error);
            // Fallback to old interface or show error
            alert('Error loading port interface. Please try again.');
            this.game.gameState = 'playing';
        }
    }
    
    async loadPortBackground() {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.portBackground = img;
                console.log('🖼️ Port background loaded');
                resolve();
            };
            img.onerror = (error) => {
                console.warn('⚠️ Failed to load port background, using fallback');
                this.portBackground = null;
                resolve(); // Continue even if image fails to load
            };
            img.src = 'assets/Ports/Saint-Kitts.jpg';
        });
    }
    
    createPortInterface() {
        // Remove existing interface if any
        this.removePortInterface();
        
        // Create main port interface container
        this.portInterface = document.createElement('div');
        this.portInterface.id = 'portInterface';
        this.portInterface.className = 'port-interface';
        
        // Set up the interface HTML
        this.portInterface.innerHTML = `
            <div class="port-background">
                <img src="assets/Ports/Saint-Kitts.jpg" alt="Saint Kitts Port" class="port-background-img" 
                     onerror="this.style.display='none'; this.parentElement.style.background='linear-gradient(135deg, #2C5282, #3182CE, #4299E1)';">
                <div class="port-overlay"></div>
            </div>
            
            <div class="port-content">
                <header class="port-header">
                    <h1 class="port-title">�🇧 ${this.currentPort.name}</h1>
                    <p class="port-subtitle">A bustling colonial port city</p>
                </header>
                
                <main class="port-main">
                    <div class="services-grid">
                        ${this.createServicesHTML()}
                    </div>
                </main>
                
                <footer class="port-footer">
                    <button class="exit-port-btn" onclick="game.portManager.exitPort()">
                        🚢 Return to Ship
                    </button>
                </footer>
            </div>
        `;
        
        document.body.appendChild(this.portInterface);
        
        // Add event listeners for service buttons
        this.setupServiceListeners();
        
        // Add CSS styles if not already present
        this.injectPortStyles();
    }
    
    createServicesHTML() {
        const serviceKeys = ['governor', 'market', 'tavern', 'dockmaster', 'bank', 'church'];
        
        return serviceKeys.map(serviceKey => {
            const service = this.services[serviceKey];
            return `
                <div class="service-card" data-service="${serviceKey}">
                    <div class="service-icon">${service.icon}</div>
                    <h3 class="service-name">${service.name}</h3>
                    <p class="service-description">${service.description}</p>
                    <button class="service-btn" data-service="${serviceKey}">
                        Visit
                    </button>
                </div>
            `;
        }).join('');
    }
    
    setupServiceListeners() {
        const serviceButtons = this.portInterface.querySelectorAll('.service-btn');
        serviceButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const serviceKey = e.target.getAttribute('data-service');
                this.visitService(serviceKey);
            });
        });
        
        // Add hover effects for service cards
        const serviceCards = this.portInterface.querySelectorAll('.service-card');
        serviceCards.forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.classList.add('service-card-hover');
            });
            card.addEventListener('mouseleave', () => {
                card.classList.remove('service-card-hover');
            });
        });
    }
    
    visitService(serviceKey) {
        const service = this.services[serviceKey];
        console.log(`🏢 Visiting ${service.name}`);
        
        // Create service interface modal
        this.showServiceInterface(serviceKey, service);
    }
    
    showServiceInterface(serviceKey, service) {
        // Create modal for specific service
        const modal = document.createElement('div');
        modal.className = 'service-modal';
        modal.innerHTML = `
            <div class="service-modal-content">
                <header class="service-modal-header">
                    <h2>${service.icon} ${service.name}</h2>
                    <button class="close-modal-btn" onclick="this.parentElement.parentElement.parentElement.remove()">×</button>
                </header>
                <main class="service-modal-body">
                    <p>${service.description}</p>
                    ${this.getServiceContent(serviceKey)}
                </main>
                <footer class="service-modal-footer">
                    <button class="modal-btn secondary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Leave
                    </button>
                </footer>
            </div>
        `;
        
        this.portInterface.appendChild(modal);
        
        // Add modal event listeners
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    getServiceContent(serviceKey) {
        switch (serviceKey) {
            case 'governor':
                return `
                    <div class="service-content">
                        <h3>Governor's Office</h3>
                        <p>The governor is currently reviewing colonial affairs.</p>
                        <div class="service-options">
                            <button class="modal-btn primary" onclick="alert('Letters of Marque - Coming Soon!')">Request Letters of Marque</button>
                            <button class="modal-btn primary" onclick="alert('Royal Missions - Coming Soon!')">Accept Royal Mission</button>
                            <button class="modal-btn primary" onclick="alert('Pardons - Coming Soon!')">Request Pardon</button>
                        </div>
                    </div>
                `;
            
            case 'market':
                return `
                    <div class="service-content">
                        <h3>Trading Post</h3>
                        <p>Merchants from across the Caribbean gather here to trade.</p>
                        <div class="service-options">
                            <button class="modal-btn primary" onclick="alert('Buy Goods - Coming Soon!')">Buy Goods</button>
                            <button class="modal-btn primary" onclick="alert('Sell Cargo - Coming Soon!')">Sell Cargo</button>
                            <button class="modal-btn primary" onclick="alert('View Prices - Coming Soon!')">View Market Prices</button>
                        </div>
                    </div>
                `;
            
            case 'tavern':
                return `
                    <div class="service-content">
                        <h3>The Salty Sailor</h3>
                        <p>A rowdy establishment where sailors gather to drink and share tales.</p>
                        <div class="service-options">
                            <button class="modal-btn primary" onclick="alert('Hire Crew - Coming Soon!')">Hire Crew</button>
                            <button class="modal-btn primary" onclick="alert('Gather Info - Coming Soon!')">Gather Information</button>
                            <button class="modal-btn primary" onclick="alert('Buy Drinks - Coming Soon!')">Buy Drinks</button>
                        </div>
                    </div>
                `;
            
            case 'dockmaster':
                return `
                    <div class="service-content">
                        <h3>Harbor Master's Office</h3>
                        <p>Manage your ship and harbor affairs here.</p>
                        <div class="service-options">
                            <button class="modal-btn primary" onclick="alert('Ship Repairs - Coming Soon!')">Repair Ship</button>
                            <button class="modal-btn primary" onclick="alert('Ship Upgrades - Coming Soon!')">Upgrade Ship</button>
                            <button class="modal-btn primary" onclick="alert('Harbor Info - Coming Soon!')">Harbor Information</button>
                        </div>
                    </div>
                `;
            
            case 'bank':
                return `
                    <div class="service-content">
                        <h3>Colonial Banking House</h3>
                        <p>Secure your wealth and manage your finances.</p>
                        <div class="service-options">
                            <button class="modal-btn primary" onclick="alert('Deposit Gold - Coming Soon!')">Deposit Gold</button>
                            <button class="modal-btn primary" onclick="alert('Withdraw Gold - Coming Soon!')">Withdraw Gold</button>
                            <button class="modal-btn primary" onclick="alert('Take Loan - Coming Soon!')">Apply for Loan</button>
                        </div>
                    </div>
                `;
            
            case 'church':
                return `
                    <div class="service-content">
                        <h3>Sacred Heart Chapel</h3>
                        <p>Find peace and spiritual guidance in these troubled waters.</p>
                        <div class="service-options">
                            <button class="modal-btn primary" onclick="alert('Blessing - Coming Soon!')">Receive Blessing</button>
                            <button class="modal-btn primary" onclick="alert('Healing - Coming Soon!')">Healing Services</button>
                            <button class="modal-btn primary" onclick="alert('Sanctuary - Coming Soon!')">Seek Sanctuary</button>
                        </div>
                    </div>
                `;
            
            default:
                return '<p>This service is currently unavailable.</p>';
        }
    }
    
    exitPort() {
        console.log('🚢 Exiting port, returning to sea');
        
        // Return to sailing mode
        this.game.gameState = 'playing';
        this.currentPort = null;
        
        // Remove port interface
        this.removePortInterface();
        
        // Show game UI again
        this.showGameUI();
        
        // Focus back on canvas for controls
        if (this.game.canvas) {
            this.game.canvas.focus();
        }
    }
    
    removePortInterface() {
        if (this.portInterface) {
            this.portInterface.remove();
            this.portInterface = null;
        }
    }
    
    hideGameUI() {
        try {
            const hud = document.querySelector('.hud');
            const header = document.querySelector('.header');
            
            if (hud) {
                hud.style.display = 'none';
                console.log('🔒 HUD hidden');
            }
            if (header) {
                header.style.display = 'none';
                console.log('🔒 Header hidden');
            }
        } catch (error) {
            console.warn('⚠️ Error hiding game UI:', error);
        }
    }
    
    showGameUI() {
        try {
            const hud = document.querySelector('.hud');
            const header = document.querySelector('.header');
            
            if (hud) {
                hud.style.display = 'block';
                console.log('🔓 HUD shown');
            }
            if (header) {
                header.style.display = 'block';
                console.log('🔓 Header shown');
            }
        } catch (error) {
            console.warn('⚠️ Error showing game UI:', error);
        }
    }
    
    injectPortStyles() {
        // Check if styles are already injected
        if (document.getElementById('port-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'port-styles';
        style.textContent = `
            .port-interface {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 2000;
                display: flex;
                flex-direction: column;
                font-family: 'Georgia', serif;
                overflow: hidden;
            }
            
            .port-background {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1;
            }
            
            .port-background-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                filter: brightness(0.8) sepia(0.1);
            }
            
            .port-background-img:not([src]) {
                background: linear-gradient(135deg, #2C5282, #3182CE, #4299E1);
                background-image: 
                    radial-gradient(circle at 20% 80%, rgba(44, 82, 130, 0.4) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(49, 130, 206, 0.4) 0%, transparent 50%);
            }
            
            .port-background-fallback {
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #8B4513, #CD853F, #DEB887);
                background-image: 
                    radial-gradient(circle at 20% 80%, rgba(139, 69, 19, 0.3) 0%, transparent 50%),
                    radial-gradient(circle at 80% 20%, rgba(205, 133, 63, 0.3) 0%, transparent 50%);
            }
            
            .port-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(1px);
            }
            
            .port-content {
                position: relative;
                z-index: 2;
                display: flex;
                flex-direction: column;
                height: 100%;
                color: white;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
            }
            
            .port-header {
                text-align: center;
                padding: 2rem;
                background: rgba(0, 0, 0, 0.6);
                border-bottom: 3px solid #FFD700;
            }
            
            .port-title {
                font-size: 3rem;
                margin: 0;
                color: #FFD700;
                text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.9);
            }
            
            .port-subtitle {
                font-size: 1.2rem;
                margin: 0.5rem 0 0 0;
                color: #F5DEB3;
                font-style: italic;
            }
            
            .port-main {
                flex: 1;
                padding: 2rem;
                overflow-y: auto;
            }
            
            .services-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .service-card {
                background: rgba(0, 0, 0, 0.7);
                border: 2px solid #8B4513;
                border-radius: 12px;
                padding: 1.5rem;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
                backdrop-filter: blur(4px);
            }
            
            .service-card:hover,
            .service-card-hover {
                transform: translateY(-5px);
                border-color: #FFD700;
                box-shadow: 0 8px 20px rgba(255, 215, 0, 0.3);
                background: rgba(0, 0, 0, 0.8);
            }
            
            .service-icon {
                font-size: 3rem;
                margin-bottom: 1rem;
                display: block;
            }
            
            .service-name {
                font-size: 1.4rem;
                margin: 0 0 1rem 0;
                color: #FFD700;
                font-weight: bold;
            }
            
            .service-description {
                font-size: 1rem;
                margin: 0 0 1.5rem 0;
                color: #F5DEB3;
                line-height: 1.4;
            }
            
            .service-btn {
                background: linear-gradient(45deg, #8B4513, #CD853F);
                color: white;
                border: 2px solid #FFD700;
                padding: 12px 24px;
                border-radius: 8px;
                font-size: 1.1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            }
            
            .service-btn:hover {
                background: linear-gradient(45deg, #CD853F, #FFD700);
                color: #8B4513;
                transform: scale(1.05);
                box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
            }
            
            .port-footer {
                text-align: center;
                padding: 2rem;
                background: rgba(0, 0, 0, 0.6);
                border-top: 3px solid #FFD700;
            }
            
            .exit-port-btn {
                background: linear-gradient(45deg, #DC143C, #B22222);
                color: white;
                border: 2px solid #FFD700;
                padding: 15px 30px;
                border-radius: 10px;
                font-size: 1.3rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
            }
            
            .exit-port-btn:hover {
                background: linear-gradient(45deg, #FF1493, #DC143C);
                transform: scale(1.05);
                box-shadow: 0 6px 16px rgba(220, 20, 60, 0.4);
            }
            
            .service-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 3000;
            }
            
            .service-modal-content {
                background: rgba(20, 20, 20, 0.95);
                border: 3px solid #FFD700;
                border-radius: 15px;
                max-width: 600px;
                width: 90%;
                max-height: 80%;
                overflow-y: auto;
                color: white;
                backdrop-filter: blur(8px);
            }
            
            .service-modal-header {
                padding: 1.5rem;
                border-bottom: 2px solid #8B4513;
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(0, 0, 0, 0.6);
            }
            
            .service-modal-header h2 {
                margin: 0;
                color: #FFD700;
                font-size: 1.5rem;
            }
            
            .close-modal-btn {
                background: none;
                border: none;
                color: #FFD700;
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.3s ease;
            }
            
            .close-modal-btn:hover {
                background: rgba(255, 215, 0, 0.2);
                transform: scale(1.1);
            }
            
            .service-modal-body {
                padding: 2rem;
            }
            
            .service-content h3 {
                color: #FFD700;
                margin-top: 0;
                margin-bottom: 1rem;
            }
            
            .service-options {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                margin-top: 1.5rem;
            }
            
            .modal-btn {
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                border: 2px solid transparent;
            }
            
            .modal-btn.primary {
                background: linear-gradient(45deg, #4169E1, #1E90FF);
                color: white;
                border-color: #FFD700;
            }
            
            .modal-btn.primary:hover {
                background: linear-gradient(45deg, #1E90FF, #00BFFF);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(30, 144, 255, 0.4);
            }
            
            .modal-btn.secondary {
                background: linear-gradient(45deg, #696969, #808080);
                color: white;
                border-color: #C0C0C0;
            }
            
            .modal-btn.secondary:hover {
                background: linear-gradient(45deg, #808080, #A9A9A9);
                transform: translateY(-2px);
            }
            
            .service-modal-footer {
                padding: 1.5rem;
                border-top: 2px solid #8B4513;
                text-align: center;
                background: rgba(0, 0, 0, 0.6);
            }
            
            @media (max-width: 768px) {
                .port-title {
                    font-size: 2rem;
                }
                
                .services-grid {
                    grid-template-columns: 1fr;
                    gap: 1rem;
                }
                
                .port-header, .port-main, .port-footer {
                    padding: 1rem;
                }
                
                .service-modal-content {
                    width: 95%;
                    max-height: 90%;
                }
                
                .service-modal-body {
                    padding: 1rem;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
}
