// Main game initialization and entry point
class FightingGame {
    constructor(app) {
        this.app = app;
        this.scene = null;
        this.gameManager = null;
        this.inputSystem = null;
        this.combatSystem = null;
        this.animationSystem = null;
        this.gameUI = null;
        
        this.players = {
            player1: null,
            player2: null
        };
        
        this.characterData = new Map();
        this.loadedAssets = new Map();
        
        console.log('Fighting Game initialized');
    }
    
    async initialize() {
        console.log('Starting game initialization...');
        
        try {
            // Set up the scene
            await this.setupScene();
            
            // Load character data
            await this.loadCharacterData();
            
            // Initialize core systems
            this.initializeSystems();
            
            // Load and setup assets
            await this.loadAssets();
            
            // Create the main scene
            await this.createGameScene();
            
            console.log('Game initialization complete!');
            
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }
    
    async setupScene() {
        // Create a new scene
        this.scene = new pc.Scene();
        this.app.scene = this.scene;
        
        // Set up camera
        const cameraEntity = new pc.Entity('MainCamera');
        cameraEntity.addComponent('camera', {
            clearColor: new pc.Color(0.1, 0.1, 0.2),
            projection: pc.PROJECTION_ORTHOGRAPHIC,
            orthoHeight: 600,
            nearClip: 0.1,
            farClip: 1000
        });
        cameraEntity.setPosition(0, 0, 10);
        this.scene.root.addChild(cameraEntity);
        
        // Set up lighting
        const lightEntity = new pc.Entity('DirectionalLight');
        lightEntity.addComponent('light', {
            type: pc.LIGHTTYPE_DIRECTIONAL,
            color: new pc.Color(1, 1, 1),
            intensity: 1,
            castShadows: false
        });
        lightEntity.setRotation(45, 30, 0);
        this.scene.root.addChild(lightEntity);
        
        console.log('Scene setup complete');
    }
    
    async loadCharacterData() {
        const characterFiles = [
            'ryu.json',
            'chun_li.json', 
            'ken.json',
            'lei_wulong.json',
            'sagat.json',
            'zangief.json'
        ];
        
        for (const filename of characterFiles) {
            try {
                const response = await fetch(`data/characters/${filename}`);
                const characterData = await response.json();
                this.characterData.set(characterData.characterId, characterData);
                console.log(`Loaded character data: ${characterData.name}`);
            } catch (error) {
                console.warn(`Failed to load character data: ${filename}`, error);
            }
        }
        
        console.log(`Loaded ${this.characterData.size} characters`);
    }
    
    initializeSystems() {
        // Initialize core game systems
        this.inputSystem = new InputSystem(this.app);
        this.combatSystem = new CombatSystem(this.app);
        this.animationSystem = new AnimationSystem(this.app);
        this.gameManager = new GameManager(this.app, this);
        this.gameUI = new GameUI(this.app, this);
        
        console.log('Core systems initialized');
    }
    
    async loadAssets() {
        // For now, we'll use placeholder sprites
        // In a full implementation, this would load the actual sprite assets
        console.log('Asset loading complete (using placeholders)');
    }
    
    async createGameScene() {
        // Create stage background
        const stageEntity = new pc.Entity('Stage');
        stageEntity.addComponent('sprite', {
            type: pc.SPRITE_TYPE_SIMPLE,
            color: new pc.Color(0.3, 0.5, 0.3), // Green background for now
            width: 1200,
            height: 400
        });
        stageEntity.setPosition(0, -200, -1);
        this.scene.root.addChild(stageEntity);
        
        // Create floor
        const floorEntity = new pc.Entity('Floor');
        floorEntity.addComponent('sprite', {
            type: pc.SPRITE_TYPE_SIMPLE,
            color: new pc.Color(0.4, 0.4, 0.4),
            width: 1200,
            height: 20
        });
        floorEntity.setPosition(0, -290, 0);
        this.scene.root.addChild(floorEntity);
        
        // Create players
        await this.createPlayer1();
        await this.createPlayer2();
        
        // Initialize UI
        this.gameUI.initialize();
        
        // Start the game manager
        this.gameManager.startMatch();
        
        console.log('Game scene created');
    }
    
    async createPlayer1() {
        const ryuData = this.characterData.get('ryu');
        if (!ryuData) {
            console.error('Ryu character data not found');
            return;
        }
        
        const player1Entity = new pc.Entity('Player1');
        player1Entity.addComponent('sprite', {
            type: pc.SPRITE_TYPE_SIMPLE,
            color: new pc.Color(1, 0.8, 0.6), // Skin tone placeholder
            width: 80,
            height: 120
        });
        player1Entity.setPosition(-200, -170, 0);
        
        // Add Fighter component
        player1Entity.addComponent('script');
        player1Entity.script.create('fighter', {
            attributes: {
                characterData: ryuData,
                playerNumber: 1,
                facingDirection: 1
            }
        });
        
        this.scene.root.addChild(player1Entity);
        this.players.player1 = player1Entity;
        
        console.log('Player 1 (Ryu) created');
    }
    
    async createPlayer2() {
        const chunLiData = this.characterData.get('chun_li');
        if (!chunLiData) {
            console.error('Chun-Li character data not found');
            return;
        }
        
        const player2Entity = new pc.Entity('Player2');
        player2Entity.addComponent('sprite', {
            type: pc.SPRITE_TYPE_SIMPLE,
            color: new pc.Color(1, 0.9, 0.7), // Different skin tone placeholder
            width: 80,
            height: 120
        });
        player2Entity.setPosition(200, -170, 0);
        
        // Add Fighter component
        player2Entity.addComponent('script');
        player2Entity.script.create('fighter', {
            attributes: {
                characterData: chunLiData,
                playerNumber: 2,
                facingDirection: -1
            }
        });
        
        this.scene.root.addChild(player2Entity);
        this.players.player2 = player2Entity;
        
        console.log('Player 2 (Chun-Li) created');
    }
    
    getCharacterData(characterId) {
        return this.characterData.get(characterId);
    }
    
    getPlayer(playerNumber) {
        return playerNumber === 1 ? this.players.player1 : this.players.player2;
    }
}

// Global initialization function called from index.html
window.initializeGame = async function(app) {
    console.log('Initializing Fighting Game...');
    
    const game = new FightingGame(app);
    await game.initialize();
    
    // Make game globally available for debugging
    window.game = game;
    
    console.log('Fighting Game ready!');
};