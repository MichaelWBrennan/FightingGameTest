import { pc } from 'playcanvas';

export interface FeatureInfo {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'training' | 'competitive' | 'social' | 'accessibility' | 'ai' | 'performance';
    features: string[];
    demoFunction?: () => void;
}

export class FeatureShowcaseUI {
    private app: pc.Application;
    private uiContainer: pc.Entity;
    private currentPanel: pc.Entity | null = null;
    private features: Map<string, FeatureInfo> = new Map();
    private isVisible: boolean = false;

    constructor(app: pc.Application) {
        this.app = app;
        this.initializeFeatures();
        this.createUIContainer();
        this.setupEventHandlers();
    }

    private initializeFeatures(): void {
        // Training Mode Features
        this.addFeature({
            id: 'training_mode',
            title: 'Advanced Training Mode',
            description: 'Master the game with cutting-edge training tools designed for serious players.',
            icon: '🎯',
            category: 'training',
            features: [
                'Real-time Frame Data Display',
                'Hitbox Visualization System',
                'Combo Trials with AI Hints',
                'Recording & Analysis Tools',
                'AI-Powered Performance Feedback'
            ],
            demoFunction: () => this.startTrainingDemo()
        });

        // Bayesian Ranking Features
        this.addFeature({
            id: 'bayesian_ranking',
            title: 'Bayesian Anti-Toxic Ranking',
            description: 'Revolutionary ranking system that rewards good behavior and creates fair matches.',
            icon: '🧠',
            category: 'competitive',
            features: [
                'Multi-Algorithm System (Beta-Binomial, TrueSkill, Glicko-2)',
                'Reliability Weighting & Confidence-Based Matchmaking',
                'Anti-Toxic Measures & Behavior Analysis',
                'Consistency Rewards & Skill Decay Protection',
                '9 Competitive Tiers (Iron to Challenger)'
            ],
            demoFunction: () => this.startRankingDemo()
        });

        // Social Features
        this.addFeature({
            id: 'social_features',
            title: 'Social & Community',
            description: 'Connect with players, learn from coaches, and build lasting friendships.',
            icon: '👥',
            category: 'social',
            features: [
                'Live Spectating with Real-time Commentary',
                'Coaching System & Mentor Matching',
                'Guilds & Tournament Management',
                'Voice & Text Chat Integration',
                'Leaderboards & Achievement System'
            ],
            demoFunction: () => this.startSocialDemo()
        });

        // Accessibility Features
        this.addFeature({
            id: 'accessibility',
            title: 'Practical Accessibility',
            description: 'Play regardless of ability with comprehensive accessibility features.',
            icon: '♿',
            category: 'accessibility',
            features: [
                'Colorblind Support (Protanopia, Deuteranopia, Tritanopia)',
                'Customizable Controls & Key Remapping',
                'Text Scaling & High Contrast Modes',
                'Audio Descriptions & Screen Reader Support',
                'Voice Control & Gesture Recognition'
            ],
            demoFunction: () => this.startAccessibilityDemo()
        });

        // AI Features
        this.addFeature({
            id: 'ai_features',
            title: 'AI-Powered Features',
            description: 'Advanced AI systems that enhance your gameplay and learning experience.',
            icon: '🤖',
            category: 'ai',
            features: [
                '24-Layer Transformer Neural Network Coaching',
                'Adaptive AI Difficulty & Learning',
                'Smart Matchmaking with Quality Prediction',
                'Neural Network Input Prediction',
                'Machine Learning Cheat Detection'
            ],
            demoFunction: () => this.startAIDemo()
        });

        // Performance Features
        this.addFeature({
            id: 'performance',
            title: 'Performance Optimization',
            description: 'Smooth gameplay on any device with advanced optimization systems.',
            icon: '⚡',
            category: 'performance',
            features: [
                'Real-time Performance Monitoring',
                'Adaptive Quality Scaling',
                'Network Optimization & Lag Reduction',
                'Memory Management & Crash Prevention',
                'Battery Optimization for Mobile'
            ],
            demoFunction: () => this.startPerformanceDemo()
        });
    }

    private addFeature(feature: FeatureInfo): void {
        this.features.set(feature.id, feature);
    }

    private createUIContainer(): void {
        // Create main UI container
        this.uiContainer = new pc.Entity('FeatureShowcaseUI');
        this.uiContainer.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0, 0, 0, 0],
            pivot: [0, 0, 0, 0],
            margin: [0, 0, 0, 0]
        });
        this.app.root.addChild(this.uiContainer);

        // Create background overlay
        this.createBackgroundOverlay();
        
        // Create main menu
        this.createMainMenu();
        
        // Initially hide the UI
        this.uiContainer.enabled = false;
    }

    private createBackgroundOverlay(): void {
        const overlay = new pc.Entity('BackgroundOverlay');
        overlay.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 0, 0],
            pivot: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            color: new pc.Color(0, 0, 0, 0.8)
        });
        this.uiContainer.addChild(overlay);
    }

    private createMainMenu(): void {
        // Create main menu container
        const menuContainer = new pc.Entity('MainMenu');
        menuContainer.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0.1, 0.1, 0.9, 0.9],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0]
        });
        this.uiContainer.addChild(menuContainer);

        // Create title
        this.createTitle(menuContainer);

        // Create feature grid
        this.createFeatureGrid(menuContainer);

        // Create character showcase
        this.createCharacterShowcase(menuContainer);

        // Create stats section
        this.createStatsSection(menuContainer);

        // Create close button
        this.createCloseButton(menuContainer);
    }

    private createTitle(container: pc.Entity): void {
        const title = new pc.Entity('Title');
        title.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.85, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: 'Street Fighter III: 3rd Strike\nPlayCanvas Edition',
            fontSize: 48,
            color: new pc.Color(1, 0.4, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        container.addChild(title);

        const subtitle = new pc.Entity('Subtitle');
        subtitle.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.75, 1, 0.85],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: 'The most advanced browser-based fighting game ever created',
            fontSize: 24,
            color: new pc.Color(1, 1, 1, 0.9),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        container.addChild(subtitle);
    }

    private createFeatureGrid(container: pc.Entity): void {
        const gridContainer = new pc.Entity('FeatureGrid');
        gridContainer.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0, 0.4, 1, 0.75],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0]
        });
        container.addChild(gridContainer);

        const features = Array.from(this.features.values());
        const cols = 3;
        const rows = Math.ceil(features.length / cols);

        features.forEach((feature, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            const x = (col + 0.5) / cols;
            const y = 1 - (row + 0.5) / rows;

            this.createFeatureCard(gridContainer, feature, x, y);
        });
    }

    private createFeatureCard(container: pc.Entity, feature: FeatureInfo, x: number, y: number): void {
        const card = new pc.Entity(`FeatureCard_${feature.id}`);
        card.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [x - 0.15, y - 0.15, x + 0.15, y + 0.15],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0]
        });
        container.addChild(card);

        // Card background
        const background = new pc.Entity('Background');
        background.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            color: new pc.Color(0.1, 0.1, 0.2, 0.8)
        });
        card.addChild(background);

        // Feature icon
        const icon = new pc.Entity('Icon');
        icon.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0.1, 0.7, 0.3, 0.9],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: feature.icon,
            fontSize: 32,
            color: new pc.Color(1, 0.4, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        card.addChild(icon);

        // Feature title
        const title = new pc.Entity('Title');
        title.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0.35, 0.7, 0.9, 0.9],
            pivot: [0, 0.5, 0, 0.5],
            margin: [0, 0, 0, 0],
            text: feature.title,
            fontSize: 18,
            color: new pc.Color(1, 0.4, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_LEFT
        });
        card.addChild(title);

        // Feature description
        const description = new pc.Entity('Description');
        description.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0.05, 0.4, 0.95, 0.65],
            pivot: [0, 0.5, 0, 0.5],
            margin: [0, 0, 0, 0],
            text: feature.description,
            fontSize: 12,
            color: new pc.Color(1, 1, 1, 0.8),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_LEFT
        });
        card.addChild(description);

        // Demo button
        const demoButton = new pc.Entity('DemoButton');
        demoButton.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0.1, 0.1, 0.9, 0.3],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            color: new pc.Color(1, 0.4, 0.2, 0.8)
        });
        card.addChild(demoButton);

        const buttonText = new pc.Entity('ButtonText');
        buttonText.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: 'Try Demo',
            fontSize: 14,
            color: new pc.Color(1, 1, 1, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        demoButton.addChild(buttonText);

        // Add click handler
        demoButton.addComponent('script');
        demoButton.script.create('buttonHandler', {
            attributes: {
                featureId: feature.id
            }
        });

        // Add hover effects
        this.addHoverEffects(card);
    }

    private createCharacterShowcase(container: pc.Entity): void {
        const characterContainer = new pc.Entity('CharacterShowcase');
        characterContainer.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0, 0.1, 1, 0.35],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0]
        });
        container.addChild(characterContainer);

        // Character showcase title
        const title = new pc.Entity('CharacterTitle');
        title.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.8, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: '30 Unique Character Archetypes',
            fontSize: 24,
            color: new pc.Color(1, 0.4, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        characterContainer.addChild(title);

        // Character grid
        this.createCharacterGrid(characterContainer);
    }

    private createCharacterGrid(container: pc.Entity): void {
        const characters = [
            { name: 'Ryu', icon: '🥋', archetypes: ['Shoto', 'Grappler', 'Zoner', 'Setplay', 'Vortex'] },
            { name: 'Zangief', icon: '💪', archetypes: ['Rushdown', 'Power', 'Defensive', 'Puppet', 'Turtle'] },
            { name: 'Cammy', icon: '🥷', archetypes: ['Mix-up', 'Technical', 'Speed', 'Install', 'Pressure'] },
            { name: 'Dhalsim', icon: '🧘', archetypes: ['Projectile', 'Teleport', 'Area Control', 'Stance', 'Counter'] },
            { name: 'Ibuki', icon: '🥷', archetypes: ['Ninja', 'Glass Cannon', 'Execution', 'Resource', 'Rekka'] },
            { name: 'Akuma', icon: '👹', archetypes: ['Charge', 'Vortex', 'Turtle', 'Poke', 'Reset'] }
        ];

        const cols = 6;
        const rows = 1;

        characters.forEach((char, index) => {
            const x = (index + 0.5) / cols;
            const y = 0.5;

            this.createCharacterCard(container, char, x, y);
        });
    }

    private createCharacterCard(container: pc.Entity, character: any, x: number, y: number): void {
        const card = new pc.Entity(`CharacterCard_${character.name}`);
        card.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [x - 0.08, y - 0.3, x + 0.08, y + 0.3],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0]
        });
        container.addChild(card);

        // Character avatar
        const avatar = new pc.Entity('Avatar');
        avatar.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0.1, 0.6, 0.9, 0.9],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: character.icon,
            fontSize: 24,
            color: new pc.Color(1, 0.4, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        card.addChild(avatar);

        // Character name
        const name = new pc.Entity('Name');
        name.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.4, 1, 0.6],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: character.name,
            fontSize: 14,
            color: new pc.Color(1, 0.4, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        card.addChild(name);

        // Archetype count
        const archetypeCount = new pc.Entity('ArchetypeCount');
        archetypeCount.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.2, 1, 0.4],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: `${character.archetypes.length} Variants`,
            fontSize: 10,
            color: new pc.Color(1, 1, 1, 0.7),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        card.addChild(archetypeCount);

        // Add hover effects
        this.addHoverEffects(card);
    }

    private createStatsSection(container: pc.Entity): void {
        const statsContainer = new pc.Entity('StatsSection');
        statsContainer.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0, 0, 1, 0.1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0]
        });
        container.addChild(statsContainer);

        const stats = [
            { label: 'FPS', value: '120' },
            { label: 'Resolution', value: '8K' },
            { label: 'Latency', value: '<1ms' },
            { label: 'Compression', value: '99%' },
            { label: 'AI Accuracy', value: '98%' },
            { label: 'Archetypes', value: '30' }
        ];

        stats.forEach((stat, index) => {
            const x = (index + 0.5) / stats.length;
            const y = 0.5;

            this.createStatCard(statsContainer, stat, x, y);
        });
    }

    private createStatCard(container: pc.Entity, stat: any, x: number, y: number): void {
        const card = new pc.Entity(`StatCard_${stat.label}`);
        card.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [x - 0.08, y - 0.4, x + 0.08, y + 0.4],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0]
        });
        container.addChild(card);

        // Stat value
        const value = new pc.Entity('Value');
        value.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.6, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: stat.value,
            fontSize: 20,
            color: new pc.Color(1, 0.4, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        card.addChild(value);

        // Stat label
        const label = new pc.Entity('Label');
        label.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0, 1, 0.6],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: stat.label,
            fontSize: 12,
            color: new pc.Color(1, 1, 1, 0.8),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        card.addChild(label);
    }

    private createCloseButton(container: pc.Entity): void {
        const closeButton = new pc.Entity('CloseButton');
        closeButton.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0.9, 0.9, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            color: new pc.Color(1, 0.2, 0.2, 0.8)
        });
        container.addChild(closeButton);

        const closeText = new pc.Entity('CloseText');
        closeText.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: '✕',
            fontSize: 24,
            color: new pc.Color(1, 1, 1, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        closeButton.addChild(closeText);

        // Add click handler
        closeButton.addComponent('script');
        closeButton.script.create('buttonHandler', {
            attributes: {
                action: 'close'
            }
        });
    }

    private addHoverEffects(entity: pc.Entity): void {
        // Add hover effects using scripts
        entity.addComponent('script');
        entity.script.create('hoverHandler', {
            attributes: {}
        });
    }

    private setupEventHandlers(): void {
        // Setup keyboard shortcuts
        this.app.keyboard.on('keydown', (event) => {
            if (event.key === pc.KEY_ESCAPE) {
                this.toggle();
            }
        });
    }

    // Demo functions
    private startTrainingDemo(): void {
        console.log('🎯 Starting Training Mode Demo');
        // This would start the actual training mode demo
        this.showDemoPanel('Training Mode Demo', [
            'Real-time frame data display',
            'Hitbox visualization',
            'Combo trials with AI hints',
            'Recording & analysis tools',
            'AI-powered feedback'
        ]);
    }

    private startRankingDemo(): void {
        console.log('🧠 Starting Ranking System Demo');
        this.showDemoPanel('Bayesian Ranking Demo', [
            'Multi-algorithm system',
            'Reliability weighting',
            'Anti-toxic measures',
            'Confidence-based matchmaking',
            '9 competitive tiers'
        ]);
    }

    private startSocialDemo(): void {
        console.log('👥 Starting Social Features Demo');
        this.showDemoPanel('Social Features Demo', [
            'Live spectating',
            'Coaching system',
            'Guild management',
            'Voice & text chat',
            'Leaderboards'
        ]);
    }

    private startAccessibilityDemo(): void {
        console.log('♿ Starting Accessibility Demo');
        this.showDemoPanel('Accessibility Demo', [
            'Colorblind support',
            'Customizable controls',
            'Text scaling',
            'Audio descriptions',
            'Voice control'
        ]);
    }

    private startAIDemo(): void {
        console.log('🤖 Starting AI Features Demo');
        this.showDemoPanel('AI Features Demo', [
            '24-layer neural network',
            'Adaptive difficulty',
            'Smart matchmaking',
            'Input prediction',
            'Cheat detection'
        ]);
    }

    private startPerformanceDemo(): void {
        console.log('⚡ Starting Performance Demo');
        this.showDemoPanel('Performance Demo', [
            'Real-time monitoring',
            'Adaptive quality',
            'Network optimization',
            'Memory management',
            'Battery optimization'
        ]);
    }

    private showDemoPanel(title: string, features: string[]): void {
        // Create demo panel
        if (this.currentPanel) {
            this.currentPanel.destroy();
        }

        this.currentPanel = new pc.Entity('DemoPanel');
        this.currentPanel.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0.2, 0.2, 0.8, 0.8],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0]
        });
        this.uiContainer.addChild(this.currentPanel);

        // Demo background
        const background = new pc.Entity('DemoBackground');
        background.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            color: new pc.Color(0.1, 0.1, 0.2, 0.9)
        });
        this.currentPanel.addChild(background);

        // Demo title
        const demoTitle = new pc.Entity('DemoTitle');
        demoTitle.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.8, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: title,
            fontSize: 24,
            color: new pc.Color(1, 0.4, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        this.currentPanel.addChild(demoTitle);

        // Demo features list
        features.forEach((feature, index) => {
            const featureText = new pc.Entity(`Feature_${index}`);
            featureText.addComponent('element', {
                type: pc.ELEMENTTYPE_TEXT,
                anchor: [0.1, 0.6 - (index * 0.08), 0.9, 0.68 - (index * 0.08)],
                pivot: [0, 0.5, 0, 0.5],
                margin: [0, 0, 0, 0],
                text: `• ${feature}`,
                fontSize: 16,
                color: new pc.Color(1, 1, 1, 0.9),
                fontAsset: this.app.assets.find('arial') || null,
                textAlign: pc.TEXTALIGN_LEFT
            });
            this.currentPanel.addChild(featureText);
        });

        // Close demo button
        const closeDemoButton = new pc.Entity('CloseDemoButton');
        closeDemoButton.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0.4, 0.1, 0.6, 0.2],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            color: new pc.Color(1, 0.4, 0.2, 0.8)
        });
        this.currentPanel.addChild(closeDemoButton);

        const closeDemoText = new pc.Entity('CloseDemoText');
        closeDemoText.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: 'Close Demo',
            fontSize: 16,
            color: new pc.Color(1, 1, 1, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        closeDemoButton.addChild(closeDemoText);

        // Add click handler
        closeDemoButton.addComponent('script');
        closeDemoButton.script.create('buttonHandler', {
            attributes: {
                action: 'closeDemo'
            }
        });
    }

    // Public API
    public show(): void {
        this.isVisible = true;
        this.uiContainer.enabled = true;
    }

    public hide(): void {
        this.isVisible = false;
        this.uiContainer.enabled = false;
        if (this.currentPanel) {
            this.currentPanel.destroy();
            this.currentPanel = null;
        }
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    public destroy(): void {
        if (this.uiContainer) {
            this.uiContainer.destroy();
        }
    }
}