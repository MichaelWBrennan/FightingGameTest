import { pc } from 'playcanvas';

export interface FeatureInfo {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'play' | 'training' | 'online' | 'collection' | 'settings';
    features: string[];
    action: string;
}

export interface UISection {
    id: string;
    title: string;
    icon: string;
    color: pc.Color;
    features: FeatureInfo[];
}

export class FeatureShowcaseUI {
    private app: pc.Application;
    private uiContainer: pc.Entity;
    private currentPanel: pc.Entity | null = null;
    private sections: Map<string, UISection> = new Map();
    private currentSection: string | null = null;
    private isVisible: boolean = false;

    constructor(app: pc.Application) {
        this.app = app;
        this.initializeFeatures();
        this.createUIContainer();
        this.setupEventHandlers();
    }

    private initializeFeatures(): void {
        // STORY MODE
        this.addSection({
            id: 'story_mode',
            title: 'STORY MODE',
            icon: '📖',
            color: new pc.Color(1, 0.4, 0.2, 1),
            features: [
                {
                    id: 'story_mode',
                    title: 'Story Mode',
                    description: 'Experience the epic narrative',
                    icon: '📖',
                    category: 'play',
                    features: [],
                    action: 'storyMode'
                }
            ]
        });

        // ARCADE MODE
        this.addSection({
            id: 'arcade_mode',
            title: 'ARCADE MODE',
            icon: '🕹️',
            color: new pc.Color(0.2, 0.8, 0.4, 1),
            features: [
                {
                    id: 'arcade_mode',
                    title: 'Arcade Mode',
                    description: 'Classic arcade experience',
                    icon: '🕹️',
                    category: 'play',
                    features: [],
                    action: 'arcadeMode'
                }
            ]
        });

        // VERSUS MODE
        this.addSection({
            id: 'versus_mode',
            title: 'VERSUS MODE',
            icon: '👥',
            color: new pc.Color(0.2, 0.4, 1, 1),
            features: [
                {
                    id: 'versus_mode',
                    title: 'Versus Mode',
                    description: 'Local and online multiplayer',
                    icon: '👥',
                    category: 'play',
                    features: [],
                    action: 'versusMode'
                }
            ]
        });

        // TRAINING MODE
        this.addSection({
            id: 'training_mode',
            title: 'TRAINING MODE',
            icon: '🎯',
            color: new pc.Color(0.8, 0.2, 1, 1),
            features: [
                {
                    id: 'training_mode',
                    title: 'Training Mode',
                    description: 'Practice and improve your skills',
                    icon: '🎯',
                    category: 'training',
                    features: [],
                    action: 'trainingMode'
                }
            ]
        });

        // ONLINE MODE
        this.addSection({
            id: 'online_mode',
            title: 'ONLINE MODE',
            icon: '🏆',
            color: new pc.Color(1, 0.8, 0.2, 1),
            features: [
                {
                    id: 'online_mode',
                    title: 'Online Mode',
                    description: 'Compete with players worldwide',
                    icon: '🏆',
                    category: 'online',
                    features: [],
                    action: 'onlineMode'
                }
            ]
        });

        // CHARACTER SELECT
        this.addSection({
            id: 'character_select',
            title: 'CHARACTER SELECT',
            icon: '🥋',
            color: new pc.Color(0.5, 0.5, 0.5, 1),
            features: [
                {
                    id: 'character_select',
                    title: 'Character Select',
                    description: 'Choose your fighter',
                    icon: '🥋',
                    category: 'collection',
                    features: [],
                    action: 'characterSelect'
                }
            ]
        });

        // PROFILE - Player profile and related features
        this.addSection({
            id: 'profile',
            title: 'PROFILE',
            icon: '👤',
            color: new pc.Color(0.8, 0.4, 0.8, 1),
            features: [
                {
                    id: 'player_profile',
                    title: 'Player Profile',
                    description: 'View your stats and progress',
                    icon: '👤',
                    category: 'profile',
                    features: [],
                    action: 'playerProfile'
                },
                {
                    id: 'rankings',
                    title: 'Rankings',
                    description: 'Check your competitive standing',
                    icon: '🏆',
                    category: 'profile',
                    features: [],
                    action: 'rankings'
                },
                {
                    id: 'achievements',
                    title: 'Achievements',
                    description: 'View your accomplishments',
                    icon: '🏅',
                    category: 'profile',
                    features: [],
                    action: 'achievements'
                },
                {
                    id: 'replay_gallery',
                    title: 'Replay Gallery',
                    description: 'Your saved matches and combos',
                    icon: '📁',
                    category: 'profile',
                    features: [],
                    action: 'replayGallery'
                },
                {
                    id: 'social_hub',
                    title: 'Social Hub',
                    description: 'Connect with the community',
                    icon: '👥',
                    category: 'profile',
                    features: [],
                    action: 'socialHub'
                },
                {
                    id: 'customization',
                    title: 'Customization',
                    description: 'Personalize your experience',
                    icon: '🎨',
                    category: 'profile',
                    features: [],
                    action: 'customization'
                }
            ]
        });

        // SETTINGS
        this.addSection({
            id: 'settings',
            title: 'SETTINGS',
            icon: '⚙️',
            color: new pc.Color(0.3, 0.3, 0.3, 1),
            features: [
                {
                    id: 'settings',
                    title: 'Settings',
                    description: 'Configure game options',
                    icon: '⚙️',
                    category: 'settings',
                    features: [],
                    action: 'settings'
                }
            ]
        });
    }

    private addSection(section: UISection): void {
        this.sections.set(section.id, section);
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
            anchor: [0, 0, 1, 1],
            pivot: [0, 0, 0, 0],
            margin: [0, 0, 0, 0]
        });
        this.uiContainer.addChild(menuContainer);

        // Create GG Strive-style layout
        this.createGGStriveLayout(menuContainer);
    }

    private createGGStriveLayout(container: pc.Entity): void {
        // Create main sections (like GG Strive's main menu)
        this.createMainSections(container);
        
        // Create character showcase (prominent display)
        this.createCharacterShowcase(container);
        
        // Create stats bar at bottom
        this.createStatsBar(container);
        
        // Create close button
        this.createCloseButton(container);
    }

    private createMainSections(container: pc.Entity): void {
        const sectionsContainer = new pc.Entity('MainSections');
        sectionsContainer.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0.1, 0.2, 0.9, 0.8],
            pivot: [0, 0, 0, 0],
            margin: [0, 0, 0, 0]
        });
        container.addChild(sectionsContainer);

        const sections = Array.from(this.sections.values());
        const cols = 2;
        const rows = 3;

        sections.forEach((section, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            const x = (col + 0.5) / cols;
            const y = 1 - (row + 0.5) / rows;

            this.createSectionCard(sectionsContainer, section, x, y);
        });
    }

    private createSectionCard(container: pc.Entity, section: UISection, x: number, y: number): void {
        const card = new pc.Entity(`SectionCard_${section.id}`);
        card.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [x - 0.4, y - 0.4, x + 0.4, y + 0.4],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0]
        });
        container.addChild(card);

        // Section background
        const background = new pc.Entity('Background');
        background.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            color: new pc.Color(section.color.r, section.color.g, section.color.b, 0.2)
        });
        card.addChild(background);

        // Section border
        const border = new pc.Entity('Border');
        border.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            color: new pc.Color(section.color.r, section.color.g, section.color.b, 0.8)
        });
        card.addChild(border);

        // Section icon
        const icon = new pc.Entity('Icon');
        icon.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0.1, 0.7, 0.3, 0.9],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: section.icon,
            fontSize: 32,
            color: section.color,
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        card.addChild(icon);

        // Section title
        const title = new pc.Entity('Title');
        title.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0.35, 0.7, 0.9, 0.9],
            pivot: [0, 0.5, 0, 0.5],
            margin: [0, 0, 0, 0],
            text: section.title,
            fontSize: 24,
            color: section.color,
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_LEFT
        });
        card.addChild(title);

        // Feature count
        const featureCount = new pc.Entity('FeatureCount');
        featureCount.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0.1, 0.5, 0.9, 0.7],
            pivot: [0, 0.5, 0, 0.5],
            margin: [0, 0, 0, 0],
            text: `${section.features.length} Features`,
            fontSize: 14,
            color: new pc.Color(1, 1, 1, 0.8),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_LEFT
        });
        card.addChild(featureCount);

        // Quick feature preview
        const preview = new pc.Entity('Preview');
        preview.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0.1, 0.2, 0.9, 0.5],
            pivot: [0, 0.5, 0, 0.5],
            margin: [0, 0, 0, 0],
            text: section.features.slice(0, 2).map(f => f.title).join(' • '),
            fontSize: 12,
            color: new pc.Color(1, 1, 1, 0.6),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_LEFT
        });
        card.addChild(preview);

        // Add click handler
        card.addComponent('script');
        card.script.create('buttonHandler', {
            attributes: {
                sectionId: section.id
            }
        });

        // Add hover effects
        this.addHoverEffects(card);
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

        // Feature action button
        const actionButton = new pc.Entity('ActionButton');
        actionButton.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0.1, 0.1, 0.9, 0.3],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            color: new pc.Color(1, 0.4, 0.2, 0.8)
        });
        card.addChild(actionButton);

        const buttonText = new pc.Entity('ButtonText');
        buttonText.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: this.getActionButtonText(feature.id),
            fontSize: 14,
            color: new pc.Color(1, 1, 1, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        actionButton.addChild(buttonText);

        // Add click handler
        actionButton.addComponent('script');
        actionButton.script.create('buttonHandler', {
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
            anchor: [0.05, 0.05, 0.95, 0.2],
            pivot: [0, 0, 0, 0],
            margin: [0, 0, 0, 0]
        });
        container.addChild(characterContainer);

        // Character showcase background
        const background = new pc.Entity('CharacterBackground');
        background.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 1, 1],
            pivot: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            color: new pc.Color(0.1, 0.1, 0.2, 0.8)
        });
        characterContainer.addChild(background);

        // Player profile section
        const playerSection = new pc.Entity('PlayerSection');
        playerSection.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0.02, 0.7, 0.48, 1],
            pivot: [0, 0, 0, 0],
            margin: [0, 0, 0, 0]
        });
        characterContainer.addChild(playerSection);

        // Player name
        const playerName = new pc.Entity('PlayerName');
        playerName.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.6, 1, 1],
            pivot: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            text: 'PLAYER',
            fontSize: 16,
            color: new pc.Color(1, 1, 1, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_LEFT
        });
        playerSection.addChild(playerName);

        // Player rank
        const playerRank = new pc.Entity('PlayerRank');
        playerRank.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.2, 1, 0.6],
            pivot: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            text: 'RANK: BRONZE',
            fontSize: 12,
            color: new pc.Color(0.8, 0.6, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_LEFT
        });
        playerSection.addChild(playerRank);

        // Character showcase title
        const title = new pc.Entity('CharacterTitle');
        title.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0.5, 0.7, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: '30 UNIQUE CHARACTER ARCHETYPES',
            fontSize: 18,
            color: new pc.Color(1, 0.4, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        characterContainer.addChild(title);

        // Character grid (compact)
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
            const y = 0.3;

            this.createCharacterCard(container, char, x, y);
        });
    }

    private createCharacterCard(container: pc.Entity, character: any, x: number, y: number): void {
        const card = new pc.Entity(`CharacterCard_${character.name}`);
        card.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [x - 0.08, y - 0.2, x + 0.08, y + 0.2],
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
            fontSize: 20,
            color: new pc.Color(1, 0.4, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        card.addChild(avatar);

        // Character name
        const name = new pc.Entity('Name');
        name.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0.3, 1, 0.6],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: character.name,
            fontSize: 12,
            color: new pc.Color(1, 0.4, 0.2, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        card.addChild(name);

        // Archetype count
        const archetypeCount = new pc.Entity('ArchetypeCount');
        archetypeCount.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0, 1, 0.3],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: `${character.archetypes.length} Variants`,
            fontSize: 8,
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

    private getActionButtonText(featureId: string): string {
        switch (featureId) {
            case 'training_mode':
                return 'Start Training';
            case 'bayesian_ranking':
                return 'View Rankings';
            case 'social_features':
                return 'Open Social Hub';
            case 'accessibility':
                return 'Open Settings';
            case 'ai_features':
                return 'AI Features';
            case 'performance':
                return 'View Stats';
            default:
                return 'Learn More';
        }
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

    // Game mode navigation functions
    private navigateToFeature(featureId: string): void {
        switch (featureId) {
            case 'storyMode':
                this.app.fire('game:storyMode');
                this.hide();
                break;
            case 'arcadeMode':
                this.app.fire('game:arcadeMode');
                this.hide();
                break;
            case 'versusMode':
                this.app.fire('game:versusMode');
                this.hide();
                break;
            case 'trainingMode':
                this.app.fire('game:trainingMode');
                this.hide();
                break;
            case 'onlineMode':
                this.app.fire('game:onlineMode');
                this.hide();
                break;
            case 'characterSelect':
                this.app.fire('ui:characterSelect');
                this.hide();
                break;
            case 'playerProfile':
                this.app.fire('ui:playerProfile');
                this.hide();
                break;
            case 'rankings':
                this.app.fire('ui:rankings');
                this.hide();
                break;
            case 'achievements':
                this.app.fire('ui:achievements');
                this.hide();
                break;
            case 'replayGallery':
                this.app.fire('ui:replayGallery');
                this.hide();
                break;
            case 'socialHub':
                this.app.fire('ui:socialHub');
                this.hide();
                break;
            case 'customization':
                this.app.fire('ui:customization');
                this.hide();
                break;
            case 'settings':
                this.app.fire('ui:settings');
                this.hide();
                break;
            default:
                Logger.warn(`Unknown game mode: ${featureId}`);
        }
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