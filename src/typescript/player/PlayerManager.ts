
import { Character, CharacterState, PlayerData } from '../../../types/character';
import { CombatState } from '../../../types/combat';

export class PlayerManager {
    private players: Map<number, PlayerData> = new Map();
    private maxPlayers: number = 2;

    constructor() {
        this.initializePlayers();
    }

    private initializePlayers(): void {
        for (let i = 0; i < this.maxPlayers; i++) {
            const playerData: PlayerData = {
                id: i,
                character: this.createDefaultCharacter(i),
                score: 0,
                wins: 0,
                operator: false,
                inputBuffer: [],
                lastCommand: null,
                comboCount: 0,
                superMeter: 0,
                stunMeter: 0,
                isBlocking: false,
                facingRight: i === 0
            };
            this.players.set(i, playerData);
        }
    }

    private createDefaultCharacter(playerId: number): Character {
        return {
            id: `player_${playerId}`,
            name: 'Ryu',
            health: 100,
            maxHealth: 100,
            state: CharacterState.IDLE,
            position: { x: playerId === 0 ? 100 : 540, y: 300 },
            velocity: { x: 0, y: 0 },
            animations: new Map(),
            currentAnimation: 'idle',
            frameData: new Map(),
            hitboxes: [],
            hurtboxes: [],
            facing: playerId === 0 ? 1 : -1,
            hitstun: 0,
            blockstun: 0,
            invulnerable: false,
            properties: new Map()
        };
    }

    public getPlayer(playerId: number): PlayerData | undefined {
        return this.players.get(playerId);
    }

    public getAllPlayers(): PlayerData[] {
        return Array.from(this.players.values());
    }

    public updatePlayer(playerId: number, updates: Partial<PlayerData>): void {
        const player = this.players.get(playerId);
        if (player) {
            Object.assign(player, updates);
        }
    }

    public setCharacter(playerId: number, characterName: string): void {
        const player = this.players.get(playerId);
        if (player) {
            player.character = this.createCharacter(characterName, playerId);
        }
    }

    private createCharacter(name: string, playerId: number): Character {
        const character = this.createDefaultCharacter(playerId);
        character.name = name;
        
        // Set character-specific properties
        switch (name.toLowerCase()) {
            case 'ryu':
                character.health = 100;
                character.maxHealth = 100;
                break;
            case 'ken':
                character.health = 95;
                character.maxHealth = 95;
                break;
            case 'chun-li':
                character.health = 90;
                character.maxHealth = 90;
                break;
            case 'sagat':
                character.health = 110;
                character.maxHealth = 110;
                break;
            case 'zangief':
                character.health = 120;
                character.maxHealth = 120;
                break;
            default:
                // Default stats
                break;
        }

        return character;
    }

    public resetPlayer(playerId: number): void {
        const player = this.players.get(playerId);
        if (player) {
            player.character.health = player.character.maxHealth;
            player.character.state = CharacterState.IDLE;
            player.character.position = { 
                x: playerId === 0 ? 100 : 540, 
                y: 300 
            };
            player.character.velocity = { x: 0, y: 0 };
            player.character.hitstun = 0;
            player.character.blockstun = 0;
            player.character.invulnerable = false;
            player.comboCount = 0;
            player.stunMeter = 0;
            player.isBlocking = false;
        }
    }

    public updatePlayerPositions(): void {
        for (const player of this.players.values()) {
            // Update character position based on velocity
            player.character.position.x += player.character.velocity.x;
            player.character.position.y += player.character.velocity.y;

            // Apply gravity
            if (player.character.position.y < 300) {
                player.character.velocity.y += 0.5; // Gravity
            } else {
                player.character.position.y = 300;
                player.character.velocity.y = 0;
            }

            // Keep within screen bounds
            player.character.position.x = Math.max(0, Math.min(640, player.character.position.x));
        }
    }

    public updatePlayerFacing(): void {
        const player1 = this.players.get(0);
        const player2 = this.players.get(1);

        if (player1 && player2) {
            const p1Pos = player1.character.position.x;
            const p2Pos = player2.character.position.x;

            player1.character.facing = p1Pos < p2Pos ? 1 : -1;
            player2.character.facing = p2Pos < p1Pos ? 1 : -1;
            
            player1.facingRight = player1.character.facing === 1;
            player2.facingRight = player2.character.facing === 1;
        }
    }

    public dealDamage(playerId: number, damage: number): void {
        const player = this.players.get(playerId);
        if (player && !player.character.invulnerable) {
            player.character.health = Math.max(0, player.character.health - damage);
            
            if (player.character.health === 0) {
                player.character.state = CharacterState.KNOCKED_OUT;
            }
        }
    }

    public addScore(playerId: number, points: number): void {
        const player = this.players.get(playerId);
        if (player) {
            player.score += points;
        }
    }

    public incrementWins(playerId: number): void {
        const player = this.players.get(playerId);
        if (player) {
            player.wins++;
        }
    }

    public resetScores(): void {
        for (const player of this.players.values()) {
            player.score = 0;
        }
    }

    public resetWins(): void {
        for (const player of this.players.values()) {
            player.wins = 0;
        }
    }

    public setOperator(playerId: number, isOperator: boolean): void {
        const player = this.players.get(playerId);
        if (player) {
            player.operator = isOperator;
        }
    }

    public isOperator(playerId: number): boolean {
        const player = this.players.get(playerId);
        return player ? player.operator : false;
    }

    public getWinner(): PlayerData | null {
        const alivePlayers = Array.from(this.players.values())
            .filter(p => p.character.health > 0);
        
        return alivePlayers.length === 1 ? alivePlayers[0] : null;
    }

    public areAllPlayersReady(): boolean {
        return Array.from(this.players.values())
            .every(p => p.operator || p.character.state !== CharacterState.IDLE);
    }

    public getPlayerCount(): number {
        return this.players.size;
    }

    public clearPlayers(): void {
        this.players.clear();
        this.initializePlayers();
    }
}
