import { pc } from 'playcanvas';

export class MenuButtonHandler extends pc.ScriptType {
    public static scriptName = 'menuButtonHandler';

    public action: string = '';

    public initialize(): void {
        // Add click event listener
        this.entity.on('click', this.onClick, this);
    }

    public onClick(event: pc.MouseEvent): void {
        switch (this.action) {
            case 'play':
                this.startGame();
                break;
            case 'features':
                this.showFeatureShowcase();
                break;
            case 'characters':
                this.showCharacterSelect();
                break;
            case 'training':
                this.startTrainingMode();
                break;
            case 'ranked':
                this.startRankedMatch();
                break;
            case 'social':
                this.showSocialHub();
                break;
            case 'settings':
                this.showSettings();
                break;
            case 'exit':
                this.exitGame();
                break;
        }
    }

    private startGame(): void {
        console.log('🎮 Starting Game...');
        // Hide main menu and start the game
        const mainMenu = this.app.root.findByName('MainMenuUI');
        if (mainMenu && mainMenu.script && mainMenu.script.get('MainMenuUI')) {
            mainMenu.script.get('MainMenuUI').hide();
        }
        
        // Emit game start event
        this.app.fire('game:start');
    }

    private showFeatureShowcase(): void {
        console.log('🎯 Showing Feature Showcase...');
        const mainMenu = this.app.root.findByName('MainMenuUI');
        if (mainMenu && mainMenu.script && mainMenu.script.get('MainMenuUI')) {
            mainMenu.script.get('MainMenuUI').showFeatureShowcase();
        }
    }

    private showCharacterSelect(): void {
        console.log('👥 Showing Character Select...');
        // This would show the character selection screen
        this.app.fire('ui:characterSelect');
    }

    private startTrainingMode(): void {
        console.log('🎯 Starting Training Mode...');
        // This would start the training mode
        this.app.fire('game:trainingMode');
    }

    private startRankedMatch(): void {
        console.log('🏆 Starting Ranked Match...');
        // This would start matchmaking for ranked play
        this.app.fire('game:rankedMatch');
    }

    private showSocialHub(): void {
        console.log('👥 Showing Social Hub...');
        // This would show the social features hub
        this.app.fire('ui:socialHub');
    }

    private showSettings(): void {
        console.log('⚙️ Showing Settings...');
        // This would show the settings menu
        this.app.fire('ui:settings');
    }

    private exitGame(): void {
        console.log('👋 Exiting Game...');
        // This would exit the game
        this.app.fire('game:exit');
    }
}

pc.registerScript(MenuButtonHandler);