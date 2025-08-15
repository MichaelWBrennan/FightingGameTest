// Game UI - manages all user interface elements for the fighting game
class GameUI {
    constructor(app, game) {
        this.app = app;
        this.game = game;
        
        // UI elements
        this.elements = new Map();
        this.healthBars = {};
        this.meterBars = {};
        
        // UI state
        this.isVisible = true;
        this.currentScreen = 'game'; // game, pause, victory, defeat
        
        // Animation state
        this.animations = new Map();
        
        console.log('Game UI initialized');
    }
    
    // Initialize UI elements
    initialize() {
        this.createHealthBars();
        this.createMeterBars();
        this.createTimerDisplay();
        this.createRoundDisplay();
        this.createComboDisplay();
        this.createMessageDisplay();
        
        // Register with game manager for updates
        if (this.game.gameManager) {
            this.registerGameManagerCallbacks();
        }
        
        console.log('Game UI elements created');
    }
    
    createHealthBars() {
        // Player 1 Health Bar
        this.healthBars.player1 = this.createElement('healthbar-p1', {
            type: 'div',
            style: {
                position: 'absolute',
                top: '20px',
                left: '20px',
                width: '300px',
                height: '30px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: '2px solid #fff',
                borderRadius: '5px',
                overflow: 'hidden'
            }
        });
        
        this.healthBars.player1.fill = this.createElement('healthbar-p1-fill', {
            type: 'div',
            parent: this.healthBars.player1,
            style: {
                height: '100%',
                width: '100%',
                backgroundColor: '#ff4444',
                transition: 'width 0.3s ease-out'
            }
        });
        
        this.healthBars.player1.label = this.createElement('healthbar-p1-label', {
            type: 'div',
            parent: this.healthBars.player1,
            style: {
                position: 'absolute',
                top: '50%',
                left: '10px',
                transform: 'translateY(-50%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            },
            text: 'Player 1'
        });
        
        // Player 2 Health Bar (right side)
        this.healthBars.player2 = this.createElement('healthbar-p2', {
            type: 'div',
            style: {
                position: 'absolute',
                top: '20px',
                right: '20px',
                width: '300px',
                height: '30px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: '2px solid #fff',
                borderRadius: '5px',
                overflow: 'hidden'
            }
        });
        
        this.healthBars.player2.fill = this.createElement('healthbar-p2-fill', {
            type: 'div',
            parent: this.healthBars.player2,
            style: {
                height: '100%',
                width: '100%',
                backgroundColor: '#4444ff',
                transition: 'width 0.3s ease-out',
                transformOrigin: 'right',
                transform: 'scaleX(1)' // Will be updated to scale from right
            }
        });
        
        this.healthBars.player2.label = this.createElement('healthbar-p2-label', {
            type: 'div',
            parent: this.healthBars.player2,
            style: {
                position: 'absolute',
                top: '50%',
                right: '10px',
                transform: 'translateY(-50%)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            },
            text: 'Player 2'
        });
    }
    
    createMeterBars() {
        // Player 1 Meter Bar
        this.meterBars.player1 = this.createElement('meterbar-p1', {
            type: 'div',
            style: {
                position: 'absolute',
                top: '60px',
                left: '20px',
                width: '300px',
                height: '15px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid #fff',
                borderRadius: '3px',
                overflow: 'hidden'
            }
        });
        
        this.meterBars.player1.fill = this.createElement('meterbar-p1-fill', {
            type: 'div',
            parent: this.meterBars.player1,
            style: {
                height: '100%',
                width: '0%',
                backgroundColor: '#ffaa00',
                transition: 'width 0.2s ease-out'
            }
        });
        
        // Player 2 Meter Bar
        this.meterBars.player2 = this.createElement('meterbar-p2', {
            type: 'div',
            style: {
                position: 'absolute',
                top: '60px',
                right: '20px',
                width: '300px',
                height: '15px',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                border: '1px solid #fff',
                borderRadius: '3px',
                overflow: 'hidden'
            }
        });
        
        this.meterBars.player2.fill = this.createElement('meterbar-p2-fill', {
            type: 'div',
            parent: this.meterBars.player2,
            style: {
                height: '100%',
                width: '0%',
                backgroundColor: '#00aaff',
                transition: 'width 0.2s ease-out',
                transformOrigin: 'right'
            }
        });
    }
    
    createTimerDisplay() {
        this.elements.set('timer', this.createElement('timer', {
            type: 'div',
            style: {
                position: 'absolute',
                top: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '36px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: '10px 20px',
                borderRadius: '10px',
                border: '2px solid #fff'
            },
            text: '99'
        }));
    }
    
    createRoundDisplay() {
        this.elements.set('round', this.createElement('round', {
            type: 'div',
            style: {
                position: 'absolute',
                top: '80px',
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: '18px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            },
            text: 'Round 1'
        }));
        
        // Round indicators
        this.elements.set('round-indicators', this.createElement('round-indicators', {
            type: 'div',
            style: {
                position: 'absolute',
                top: '110px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '10px'
            }
        }));
        
        // Create round indicator dots
        for (let i = 1; i <= 3; i++) {
            const p1Dot = this.createElement(`round-dot-p1-${i}`, {
                type: 'div',
                parent: this.elements.get('round-indicators'),
                style: {
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255, 68, 68, 0.3)',
                    border: '1px solid #ff4444'
                }
            });
            
            const p2Dot = this.createElement(`round-dot-p2-${i}`, {
                type: 'div',
                parent: this.elements.get('round-indicators'),
                style: {
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(68, 68, 255, 0.3)',
                    border: '1px solid #4444ff'
                }
            });
        }
    }
    
    createComboDisplay() {
        // Player 1 Combo Display
        this.elements.set('combo-p1', this.createElement('combo-p1', {
            type: 'div',
            style: {
                position: 'absolute',
                bottom: '100px',
                left: '20px',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffaa00',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                opacity: '0',
                transition: 'opacity 0.3s ease'
            },
            text: ''
        }));
        
        // Player 2 Combo Display
        this.elements.set('combo-p2', this.createElement('combo-p2', {
            type: 'div',
            style: {
                position: 'absolute',
                bottom: '100px',
                right: '20px',
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#ffaa00',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                opacity: '0',
                transition: 'opacity 0.3s ease'
            },
            text: ''
        }));
    }
    
    createMessageDisplay() {
        this.elements.set('message', this.createElement('message', {
            type: 'div',
            style: {
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#fff',
                textShadow: '3px 3px 6px rgba(0,0,0,0.8)',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: '20px 40px',
                borderRadius: '15px',
                border: '3px solid #fff',
                opacity: '0',
                transition: 'opacity 0.5s ease',
                zIndex: '1000'
            },
            text: ''
        }));
    }
    
    createElement(id, options) {
        const element = document.createElement(options.type || 'div');
        element.id = id;
        
        // Apply styles
        if (options.style) {
            Object.assign(element.style, options.style);
        }
        
        // Set text content
        if (options.text) {
            element.textContent = options.text;
        }
        
        // Set parent
        const parent = options.parent || document.body;
        parent.appendChild(element);
        
        return element;
    }
    
    // Update health bars
    updateHealthBars() {
        const healthData = this.game.gameManager.getFighterHealth();
        
        // Player 1 health
        const p1HealthPercent = (healthData.player1.health / healthData.player1.maxHealth) * 100;
        this.healthBars.player1.fill.style.width = `${p1HealthPercent}%`;
        
        // Color based on health level
        if (p1HealthPercent > 60) {
            this.healthBars.player1.fill.style.backgroundColor = '#44ff44';
        } else if (p1HealthPercent > 30) {
            this.healthBars.player1.fill.style.backgroundColor = '#ffaa00';
        } else {
            this.healthBars.player1.fill.style.backgroundColor = '#ff4444';
        }
        
        // Player 2 health
        const p2HealthPercent = (healthData.player2.health / healthData.player2.maxHealth) * 100;
        this.healthBars.player2.fill.style.transform = `scaleX(${p2HealthPercent / 100})`;
        
        // Color based on health level
        if (p2HealthPercent > 60) {
            this.healthBars.player2.fill.style.backgroundColor = '#44ff44';
        } else if (p2HealthPercent > 30) {
            this.healthBars.player2.fill.style.backgroundColor = '#ffaa00';
        } else {
            this.healthBars.player2.fill.style.backgroundColor = '#ff4444';
        }
    }
    
    // Update meter bars
    updateMeterBars() {
        const healthData = this.game.gameManager.getFighterHealth();
        
        // Player 1 meter
        const p1MeterPercent = (healthData.player1.meter / healthData.player1.maxMeter) * 100;
        this.meterBars.player1.fill.style.width = `${p1MeterPercent}%`;
        
        // Player 2 meter
        const p2MeterPercent = (healthData.player2.meter / healthData.player2.maxMeter) * 100;
        this.meterBars.player2.fill.style.transform = `scaleX(${p2MeterPercent / 100})`;
    }
    
    // Update timer display
    updateTimer(time) {
        const timerElement = this.elements.get('timer');
        if (timerElement) {
            timerElement.textContent = time.toString().padStart(2, '0');
            
            // Change color when time is low
            if (time <= 10) {
                timerElement.style.color = '#ff4444';
                timerElement.style.animation = 'pulse 1s infinite';
            } else {
                timerElement.style.color = '#fff';
                timerElement.style.animation = '';
            }
        }
    }
    
    // Update round display
    updateRound(round, roundsWon) {
        const roundElement = this.elements.get('round');
        if (roundElement) {
            roundElement.textContent = `Round ${round}`;
        }
        
        // Update round indicators
        for (let i = 1; i <= 3; i++) {
            const p1Dot = document.getElementById(`round-dot-p1-${i}`);
            const p2Dot = document.getElementById(`round-dot-p2-${i}`);
            
            if (p1Dot) {
                p1Dot.style.backgroundColor = i <= roundsWon.player1 ? '#ff4444' : 'rgba(255, 68, 68, 0.3)';
            }
            
            if (p2Dot) {
                p2Dot.style.backgroundColor = i <= roundsWon.player2 ? '#4444ff' : 'rgba(68, 68, 255, 0.3)';
            }
        }
    }
    
    // Show message
    showMessage(text, duration = 2000, style = {}) {
        const messageElement = this.elements.get('message');
        if (!messageElement) return;
        
        messageElement.textContent = text;
        
        // Apply custom style
        Object.assign(messageElement.style, style);
        
        // Show message
        messageElement.style.opacity = '1';
        
        // Auto-hide after duration
        if (duration > 0) {
            setTimeout(() => {
                messageElement.style.opacity = '0';
            }, duration);
        }
    }
    
    // Show combo display
    showCombo(player, hits, damage) {
        const comboElement = this.elements.get(`combo-p${player}`);
        if (!comboElement) return;
        
        comboElement.textContent = `${hits} HIT COMBO! ${damage} DMG`;
        comboElement.style.opacity = '1';
        
        // Auto-hide after 2 seconds
        setTimeout(() => {
            comboElement.style.opacity = '0';
        }, 2000);
    }
    
    // Register callbacks with game manager
    registerGameManagerCallbacks() {
        const gm = this.game.gameManager;
        
        gm.registerUICallback('matchStart', (data) => {
            this.updateRound(data.round, { player1: 0, player2: 0 });
            this.showMessage('NEW MATCH', 1500);
        });
        
        gm.registerUICallback('countdownStart', (data) => {
            this.showMessage('GET READY!', 1000);
        });
        
        gm.registerUICallback('countdownUpdate', (data) => {
            if (data.count > 0) {
                this.showMessage(data.count.toString(), 900, {
                    fontSize: '72px',
                    color: '#ffaa00'
                });
            }
        });
        
        gm.registerUICallback('roundStart', (data) => {
            this.showMessage('FIGHT!', 1500, {
                fontSize: '64px',
                color: '#ff4444'
            });
            this.updateRound(data.round, { player1: 0, player2: 0 });
        });
        
        gm.registerUICallback('timerUpdate', (data) => {
            this.updateTimer(data.timer);
        });
        
        gm.registerUICallback('roundEnd', (data) => {
            const winnerText = data.winner ? `PLAYER ${data.winner} WINS!` : 'DRAW!';
            const reasonText = data.reason === 'time' ? ' (TIME OVER)' : '';
            
            this.showMessage(winnerText + reasonText, 3000, {
                fontSize: '56px',
                color: data.winner === 1 ? '#ff4444' : '#4444ff'
            });
            
            this.updateRound(data.round, data.roundsWon);
        });
        
        gm.registerUICallback('matchEnd', (data) => {
            const winnerText = `PLAYER ${data.winner} WINS THE MATCH!`;
            const scoreText = `Final Score: ${data.finalScore.player1} - ${data.finalScore.player2}`;
            
            this.showMessage(winnerText, 5000, {
                fontSize: '48px',
                color: data.winner === 1 ? '#ff4444' : '#4444ff'
            });
            
            setTimeout(() => {
                this.showMessage(scoreText, 3000, {
                    fontSize: '24px',
                    color: '#fff'
                });
            }, 2000);
        });
    }
    
    // Update UI elements each frame
    update(dt) {
        // Update health and meter bars
        this.updateHealthBars();
        this.updateMeterBars();
        
        // Update combo displays based on combat system
        this.updateCombos();
        
        // Update visual effects
        this.updateVisualEffects(dt);
    }
    
    updateCombos() {
        // This would integrate with the combat system to show combo information
        // For now, we'll skip this as it requires combat system integration
    }
    
    updateVisualEffects(dt) {
        // Update any animated UI elements
        // This could include screen shake, hit effects, etc.
    }
    
    // Toggle UI visibility
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        
        for (const [id, element] of this.elements) {
            element.style.display = this.isVisible ? 'block' : 'none';
        }
        
        // Toggle health and meter bars
        Object.values(this.healthBars).forEach(bar => {
            bar.style.display = this.isVisible ? 'block' : 'none';
        });
        
        Object.values(this.meterBars).forEach(bar => {
            bar.style.display = this.isVisible ? 'block' : 'none';
        });
    }
    
    // Cleanup UI elements
    destroy() {
        for (const [id, element] of this.elements) {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
        }
        
        Object.values(this.healthBars).forEach(bar => {
            if (bar.parentNode) {
                bar.parentNode.removeChild(bar);
            }
        });
        
        Object.values(this.meterBars).forEach(bar => {
            if (bar.parentNode) {
                bar.parentNode.removeChild(bar);
            }
        });
        
        this.elements.clear();
        this.healthBars = {};
        this.meterBars = {};
        
        console.log('Game UI destroyed');
    }
}

// Make GameUI globally available
window.GameUI = GameUI;