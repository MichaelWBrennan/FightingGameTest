// Game Manager - handles match state, rounds, and game flow
class GameManager {
    constructor(app, game) {
        this.app = app;
        this.game = game;
        
        // Match state
        this.matchState = 'waiting'; // waiting, countdown, fighting, round_end, match_end
        this.currentRound = 1;
        this.maxRounds = 3; // Best of 3
        
        // Round tracking
        this.roundsWon = {
            player1: 0,
            player2: 0
        };
        
        // Timer management
        this.roundTimer = 99; // 99 seconds per round
        this.maxRoundTime = 99;
        this.countdownTimer = 3; // 3 second countdown
        
        // Health tracking
        this.maxHealth = {
            player1: 1000,
            player2: 1000
        };
        
        // Match settings
        this.settings = {
            timeLimit: 99,
            rounds: 3,
            allowChipKO: true,
            perfectBonus: true
        };
        
        // Performance tracking
        this.matchData = {
            startTime: null,
            endTime: null,
            totalDamageDealt: { player1: 0, player2: 0 },
            combosLanded: { player1: 0, player2: 0 },
            perfectRounds: { player1: [], player2: [] }
        };
        
        // UI callbacks
        this.uiCallbacks = new Map();
        
        console.log('Game Manager initialized');
    }
    
    // Start a new match
    startMatch() {
        console.log('Starting new match...');
        
        this.matchState = 'countdown';
        this.currentRound = 1;
        this.roundsWon.player1 = 0;
        this.roundsWon.player2 = 0;
        this.matchData.startTime = Date.now();
        
        // Reset fighters
        this.resetFighters();
        
        // Start round countdown
        this.startRoundCountdown();
        
        this.triggerUICallback('matchStart', {
            round: this.currentRound,
            maxRounds: this.maxRounds
        });
    }
    
    // Start round countdown
    startRoundCountdown() {
        this.matchState = 'countdown';
        this.countdownTimer = 3;
        
        console.log('Round countdown starting...');
        
        this.triggerUICallback('countdownStart', {
            count: this.countdownTimer
        });
        
        const countdownInterval = setInterval(() => {
            this.countdownTimer--;
            
            this.triggerUICallback('countdownUpdate', {
                count: this.countdownTimer
            });
            
            if (this.countdownTimer <= 0) {
                clearInterval(countdownInterval);
                this.startRound();
            }
        }, 1000);
    }
    
    // Start the active round
    startRound() {
        console.log(`Round ${this.currentRound} - FIGHT!`);
        
        this.matchState = 'fighting';
        this.roundTimer = this.maxRoundTime;
        
        // Enable fighter input
        this.enableFighterInput();
        
        this.triggerUICallback('roundStart', {
            round: this.currentRound,
            timer: this.roundTimer
        });
        
        // Start round timer
        this.startRoundTimer();
    }
    
    startRoundTimer() {
        const timerInterval = setInterval(() => {
            if (this.matchState !== 'fighting') {
                clearInterval(timerInterval);
                return;
            }
            
            this.roundTimer--;
            
            this.triggerUICallback('timerUpdate', {
                timer: this.roundTimer
            });
            
            // Time over
            if (this.roundTimer <= 0) {
                clearInterval(timerInterval);
                this.endRoundByTime();
            }
        }, 1000);
    }
    
    // End round due to time limit
    endRoundByTime() {
        console.log('Time over!');
        
        const player1 = this.game.getPlayer(1);
        const player2 = this.game.getPlayer(2);
        
        if (!player1 || !player2) return;
        
        const p1Health = player1.script.fighter.health;
        const p2Health = player2.script.fighter.health;
        
        let winner = null;
        if (p1Health > p2Health) {
            winner = 1;
        } else if (p2Health > p1Health) {
            winner = 2;
        }
        // If equal health, it's a draw (no winner)
        
        this.endRound(winner, 'time');
    }
    
    // End round with a winner
    endRound(winner, reason = 'ko') {
        console.log(`Round ${this.currentRound} ended. Winner: Player ${winner || 'None'} (${reason})`);
        
        this.matchState = 'round_end';
        
        // Disable fighter input
        this.disableFighterInput();
        
        // Track round result
        if (winner) {
            this.roundsWon[`player${winner}`]++;
            
            // Check for perfect round
            const loser = winner === 1 ? 2 : 1;
            const loserHealth = this.game.getPlayer(loser)?.script?.fighter?.health || 0;
            if (loserHealth === this.maxHealth[`player${loser}`]) {
                this.matchData.perfectRounds[`player${winner}`].push(this.currentRound);
                console.log(`Perfect round for Player ${winner}!`);
            }
        }
        
        this.triggerUICallback('roundEnd', {
            winner: winner,
            reason: reason,
            round: this.currentRound,
            roundsWon: { ...this.roundsWon }
        });
        
        // Check if match is over
        const maxWins = Math.ceil(this.maxRounds / 2);
        if (this.roundsWon.player1 >= maxWins || this.roundsWon.player2 >= maxWins) {
            setTimeout(() => this.endMatch(), 2000);
        } else {
            setTimeout(() => this.nextRound(), 3000);
        }
    }
    
    // Start next round
    nextRound() {
        this.currentRound++;
        console.log(`Preparing for Round ${this.currentRound}...`);
        
        // Reset fighters for new round
        this.resetFighters();
        
        // Start new round countdown
        this.startRoundCountdown();
    }
    
    // End the match
    endMatch() {
        this.matchState = 'match_end';
        this.matchData.endTime = Date.now();
        
        const matchWinner = this.roundsWon.player1 > this.roundsWon.player2 ? 1 : 2;
        
        console.log(`Match ended! Winner: Player ${matchWinner}`);
        console.log(`Final score: ${this.roundsWon.player1} - ${this.roundsWon.player2}`);
        
        this.triggerUICallback('matchEnd', {
            winner: matchWinner,
            finalScore: { ...this.roundsWon },
            matchData: { ...this.matchData },
            duration: this.matchData.endTime - this.matchData.startTime
        });
    }
    
    // Reset fighters to starting positions and health
    resetFighters() {
        const player1 = this.game.getPlayer(1);
        const player2 = this.game.getPlayer(2);
        
        if (player1 && player1.script && player1.script.fighter) {
            const fighter1 = player1.script.fighter;
            fighter1.health = this.maxHealth.player1;
            fighter1.meter = 0;
            fighter1.isBlocking = false;
            fighter1.isAttacking = false;
            fighter1.isInHitstun = false;
            fighter1.isInBlockstun = false;
            fighter1.canAct = false; // Disabled until round starts
            fighter1.currentMove = null;
            fighter1.velocity.set(0, 0, 0);
            fighter1.grounded = true;
            
            // Reset position
            player1.setPosition(-200, -170, 0);
            
            // Clear input buffer
            if (this.game.inputSystem) {
                this.game.inputSystem.clearBuffer('player1');
            }
        }
        
        if (player2 && player2.script && player2.script.fighter) {
            const fighter2 = player2.script.fighter;
            fighter2.health = this.maxHealth.player2;
            fighter2.meter = 0;
            fighter2.isBlocking = false;
            fighter2.isAttacking = false;
            fighter2.isInHitstun = false;
            fighter2.isInBlockstun = false;
            fighter2.canAct = false; // Disabled until round starts
            fighter2.currentMove = null;
            fighter2.velocity.set(0, 0, 0);
            fighter2.grounded = true;
            
            // Reset position
            player2.setPosition(200, -170, 0);
            
            // Clear input buffer
            if (this.game.inputSystem) {
                this.game.inputSystem.clearBuffer('player2');
            }
        }
        
        console.log('Fighters reset for new round');
    }
    
    enableFighterInput() {
        const player1 = this.game.getPlayer(1);
        const player2 = this.game.getPlayer(2);
        
        if (player1 && player1.script && player1.script.fighter) {
            player1.script.fighter.canAct = true;
        }
        
        if (player2 && player2.script && player2.script.fighter) {
            player2.script.fighter.canAct = true;
        }
    }
    
    disableFighterInput() {
        const player1 = this.game.getPlayer(1);
        const player2 = this.game.getPlayer(2);
        
        if (player1 && player1.script && player1.script.fighter) {
            player1.script.fighter.canAct = false;
        }
        
        if (player2 && player2.script && player2.script.fighter) {
            player2.script.fighter.canAct = false;
        }
    }
    
    // Check for round end conditions
    checkRoundEndConditions() {
        if (this.matchState !== 'fighting') return;
        
        const player1 = this.game.getPlayer(1);
        const player2 = this.game.getPlayer(2);
        
        if (!player1 || !player2) return;
        
        const fighter1 = player1.script?.fighter;
        const fighter2 = player2.script?.fighter;
        
        if (!fighter1 || !fighter2) return;
        
        // Check for KO
        if (fighter1.health <= 0) {
            this.endRound(2, 'ko');
            return;
        }
        
        if (fighter2.health <= 0) {
            this.endRound(1, 'ko');
            return;
        }
        
        // Check for special conditions (ring out, etc.)
        // This would be implemented based on stage boundaries
    }
    
    // Register UI callback
    registerUICallback(event, callback) {
        if (!this.uiCallbacks.has(event)) {
            this.uiCallbacks.set(event, []);
        }
        this.uiCallbacks.get(event).push(callback);
    }
    
    // Trigger UI callback
    triggerUICallback(event, data) {
        const callbacks = this.uiCallbacks.get(event);
        if (callbacks) {
            callbacks.forEach(callback => callback(data));
        }
    }
    
    // Update game manager each frame
    update(dt) {
        // Check round end conditions
        this.checkRoundEndConditions();
        
        // Update match statistics
        this.updateMatchStatistics();
        
        // Handle pause/resume logic
        this.handlePauseState();
    }
    
    updateMatchStatistics() {
        // Track damage dealt, combos, etc.
        // This would integrate with the combat system to track detailed statistics
    }
    
    handlePauseState() {
        // Handle game pause/resume functionality
        // This would be triggered by pause inputs or UI
    }
    
    // Get current match state for UI
    getMatchState() {
        return {
            state: this.matchState,
            round: this.currentRound,
            maxRounds: this.maxRounds,
            timer: this.roundTimer,
            roundsWon: { ...this.roundsWon },
            countdown: this.countdownTimer
        };
    }
    
    // Get fighter health for UI
    getFighterHealth() {
        const player1 = this.game.getPlayer(1);
        const player2 = this.game.getPlayer(2);
        
        return {
            player1: {
                health: player1?.script?.fighter?.health || 0,
                maxHealth: this.maxHealth.player1,
                meter: player1?.script?.fighter?.meter || 0,
                maxMeter: player1?.script?.fighter?.maxMeter || 100
            },
            player2: {
                health: player2?.script?.fighter?.health || 0,
                maxHealth: this.maxHealth.player2,
                meter: player2?.script?.fighter?.meter || 0,
                maxMeter: player2?.script?.fighter?.maxMeter || 100
            }
        };
    }
    
    // Restart match
    restartMatch() {
        console.log('Restarting match...');
        this.startMatch();
    }
    
    // Pause/Resume match
    pauseMatch() {
        if (this.matchState === 'fighting') {
            this.matchState = 'paused';
            this.disableFighterInput();
            console.log('Match paused');
        }
    }
    
    resumeMatch() {
        if (this.matchState === 'paused') {
            this.matchState = 'fighting';
            this.enableFighterInput();
            console.log('Match resumed');
        }
    }
}

// Make GameManager globally available
window.GameManager = GameManager;