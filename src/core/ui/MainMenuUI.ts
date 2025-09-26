import { pc } from 'playcanvas';
import { FeatureShowcaseUI } from './FeatureShowcaseUI';

export class MainMenuUI {
    private app: pc.Application;
    private menuContainer: pc.Entity;
    private featureShowcase: FeatureShowcaseUI;
    private isVisible: boolean = false;

    constructor(app: pc.Application) {
        this.app = app;
        this.featureShowcase = new FeatureShowcaseUI(app);
        this.createMenuContainer();
        this.setupEventHandlers();
    }

    private createMenuContainer(): void {
        // Create main menu container
        this.menuContainer = new pc.Entity('MainMenuUI');
        this.menuContainer.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0, 0, 0, 0],
            pivot: [0, 0, 0, 0],
            margin: [0, 0, 0, 0]
        });
        this.app.root.addChild(this.menuContainer);

        // Create background
        this.createBackground();

        // Create menu buttons
        this.createMenuButtons();

        // Initially hide the menu
        this.menuContainer.enabled = false;
    }

    private createBackground(): void {
        const background = new pc.Entity('MenuBackground');
        background.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, 0, 1, 1],
            pivot: [0, 0, 0, 0],
            margin: [0, 0, 0, 0],
            color: new pc.Color(0, 0, 0, 0.7)
        });
        this.menuContainer.addChild(background);
    }

    private createMenuButtons(): void {
        const buttonContainer = new pc.Entity('ButtonContainer');
        buttonContainer.addComponent('element', {
            type: pc.ELEMENTTYPE_GROUP,
            anchor: [0.3, 0.2, 0.7, 0.8],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0]
        });
        this.menuContainer.addChild(buttonContainer);

        const buttons = [
            { text: 'Play Now', action: 'play', color: new pc.Color(1, 0.4, 0.2, 0.8) },
            { text: 'Feature Showcase', action: 'features', color: new pc.Color(0.2, 0.4, 1, 0.8) },
            { text: 'Character Select', action: 'characters', color: new pc.Color(0.2, 1, 0.4, 0.8) },
            { text: 'Training Mode', action: 'training', color: new pc.Color(1, 0.8, 0.2, 0.8) },
            { text: 'Ranked Match', action: 'ranked', color: new pc.Color(1, 0.2, 0.8, 0.8) },
            { text: 'Social Hub', action: 'social', color: new pc.Color(0.8, 0.2, 1, 0.8) },
            { text: 'Settings', action: 'settings', color: new pc.Color(0.5, 0.5, 0.5, 0.8) },
            { text: 'Exit', action: 'exit', color: new pc.Color(1, 0.2, 0.2, 0.8) }
        ];

        buttons.forEach((button, index) => {
            this.createMenuButton(buttonContainer, button, index, buttons.length);
        });
    }

    private createMenuButton(container: pc.Entity, button: any, index: number, total: number): void {
        const buttonEntity = new pc.Entity(`MenuButton_${button.action}`);
        buttonEntity.addComponent('element', {
            type: pc.ELEMENTTYPE_IMAGE,
            anchor: [0, (index / total), 1, ((index + 1) / total)],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0.1, 0.05, 0.1, 0.05],
            color: button.color
        });
        container.addChild(buttonEntity);

        // Button text
        const buttonText = new pc.Entity('ButtonText');
        buttonText.addComponent('element', {
            type: pc.ELEMENTTYPE_TEXT,
            anchor: [0, 0, 1, 1],
            pivot: [0.5, 0.5, 0.5, 0.5],
            margin: [0, 0, 0, 0],
            text: button.text,
            fontSize: 24,
            color: new pc.Color(1, 1, 1, 1),
            fontAsset: this.app.assets.find('arial') || null,
            textAlign: pc.TEXTALIGN_CENTER
        });
        buttonEntity.addChild(buttonText);

        // Add button handler
        buttonEntity.addComponent('script');
        buttonEntity.script.create('menuButtonHandler', {
            attributes: {
                action: button.action
            }
        });

        // Add hover effects
        buttonEntity.addComponent('script');
        buttonEntity.script.create('hoverHandler', {
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

    // Public API
    public show(): void {
        this.isVisible = true;
        this.menuContainer.enabled = true;
    }

    public hide(): void {
        this.isVisible = false;
        this.menuContainer.enabled = false;
    }

    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    public showFeatureShowcase(): void {
        this.featureShowcase.show();
    }

    public hideFeatureShowcase(): void {
        this.featureShowcase.hide();
    }

    public destroy(): void {
        if (this.menuContainer) {
            this.menuContainer.destroy();
        }
        if (this.featureShowcase) {
            this.featureShowcase.destroy();
        }
    }
}