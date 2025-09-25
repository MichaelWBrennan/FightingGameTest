import { pc } from 'playcanvas';
import { MainMenuUI } from './MainMenuUI';
import { FeatureShowcaseUI } from './FeatureShowcaseUI';

export class UIDemo {
    private app: pc.Application;
    private mainMenuUI: MainMenuUI;
    private featureShowcaseUI: FeatureShowcaseUI;
    private isInitialized: boolean = false;

    constructor(app: pc.Application) {
        this.app = app;
        this.initialize();
    }

    private async initialize(): Promise<void> {
        try {
            // Initialize UI systems
            this.mainMenuUI = new MainMenuUI(this.app);
            this.featureShowcaseUI = new FeatureShowcaseUI(this.app);

            // Setup event handlers
            this.setupEventHandlers();

            // Show the main menu
            this.mainMenuUI.show();

            this.isInitialized = true;
            console.log('🎮 UI Demo initialized successfully!');
        } catch (error) {
            console.error('❌ Failed to initialize UI Demo:', error);
        }
    }

    private setupEventHandlers(): void {
        // Game events
        this.app.on('game:start', () => {
            console.log('🎮 Game started!');
            this.mainMenuUI.hide();
        });

        this.app.on('game:trainingMode', () => {
            console.log('🎯 Training mode started!');
            this.mainMenuUI.hide();
        });

        this.app.on('game:rankedMatch', () => {
            console.log('🏆 Ranked match started!');
            this.mainMenuUI.hide();
        });

        this.app.on('game:exit', () => {
            console.log('👋 Game exiting...');
            // In a real game, this would close the application
        });

        // UI events
        this.app.on('ui:characterSelect', () => {
            console.log('👥 Character select opened!');
        });

        this.app.on('ui:socialHub', () => {
            console.log('👥 Social hub opened!');
        });

        this.app.on('ui:settings', () => {
            console.log('⚙️ Settings opened!');
        });

        // Keyboard shortcuts
        this.app.keyboard.on('keydown', (event) => {
            switch (event.key) {
                case pc.KEY_ESCAPE:
                    this.toggleMainMenu();
                    break;
                case pc.KEY_F1:
                    this.toggleFeatureShowcase();
                    break;
                case pc.KEY_F2:
                    this.showTrainingDemo();
                    break;
                case pc.KEY_F3:
                    this.showRankingDemo();
                    break;
                case pc.KEY_F4:
                    this.showSocialDemo();
                    break;
                case pc.KEY_F5:
                    this.showAccessibilityDemo();
                    break;
                case pc.KEY_F6:
                    this.showAIDemo();
                    break;
                case pc.KEY_F7:
                    this.showPerformanceDemo();
                    break;
            }
        });
    }

    // Public API methods
    public toggleMainMenu(): void {
        if (this.mainMenuUI) {
            this.mainMenuUI.toggle();
        }
    }

    public toggleFeatureShowcase(): void {
        if (this.featureShowcaseUI) {
            this.featureShowcaseUI.toggle();
        }
    }

    public showTrainingDemo(): void {
        if (this.featureShowcaseUI) {
            this.featureShowcaseUI.show();
            // Simulate clicking the training mode demo
            setTimeout(() => {
                console.log('🎯 Starting Training Mode Demo...');
            }, 100);
        }
    }

    public showRankingDemo(): void {
        if (this.featureShowcaseUI) {
            this.featureShowcaseUI.show();
            // Simulate clicking the ranking demo
            setTimeout(() => {
                console.log('🧠 Starting Ranking System Demo...');
            }, 100);
        }
    }

    public showSocialDemo(): void {
        if (this.featureShowcaseUI) {
            this.featureShowcaseUI.show();
            // Simulate clicking the social demo
            setTimeout(() => {
                console.log('👥 Starting Social Features Demo...');
            }, 100);
        }
    }

    public showAccessibilityDemo(): void {
        if (this.featureShowcaseUI) {
            this.featureShowcaseUI.show();
            // Simulate clicking the accessibility demo
            setTimeout(() => {
                console.log('♿ Starting Accessibility Demo...');
            }, 100);
        }
    }

    public showAIDemo(): void {
        if (this.featureShowcaseUI) {
            this.featureShowcaseUI.show();
            // Simulate clicking the AI demo
            setTimeout(() => {
                console.log('🤖 Starting AI Features Demo...');
            }, 100);
        }
    }

    public showPerformanceDemo(): void {
        if (this.featureShowcaseUI) {
            this.featureShowcaseUI.show();
            // Simulate clicking the performance demo
            setTimeout(() => {
                console.log('⚡ Starting Performance Demo...');
            }, 100);
        }
    }

    public destroy(): void {
        if (this.mainMenuUI) {
            this.mainMenuUI.destroy();
        }
        if (this.featureShowcaseUI) {
            this.featureShowcaseUI.destroy();
        }
    }
}