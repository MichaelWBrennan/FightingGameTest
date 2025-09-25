import { pc } from 'playcanvas';

export class ButtonHandler extends pc.ScriptType {
    public static scriptName = 'buttonHandler';

    public featureId: string = '';
    public action: string = '';

    public initialize(): void {
        // Add click event listener
        this.entity.on('click', this.onClick, this);
        this.entity.on('mouseenter', this.onMouseEnter, this);
        this.entity.on('mouseleave', this.onMouseLeave, this);
    }

    public onClick(event: pc.MouseEvent): void {
        if (this.action === 'close') {
            this.closeUI();
        } else if (this.featureId) {
            this.navigateToFeature(this.featureId);
        }
    }

    public onMouseEnter(event: pc.MouseEvent): void {
        // Add hover effect
        const element = this.entity.element;
        if (element) {
            element.color = new pc.Color(1, 0.5, 0.3, 0.9);
        }
    }

    public onMouseLeave(event: pc.MouseEvent): void {
        // Remove hover effect
        const element = this.entity.element;
        if (element) {
            element.color = new pc.Color(1, 0.4, 0.2, 0.8);
        }
    }

    private closeUI(): void {
        // Find the FeatureShowcaseUI and hide it
        const uiEntity = this.app.root.findByName('FeatureShowcaseUI');
        if (uiEntity && uiEntity.script && uiEntity.script.get('FeatureShowcaseUI')) {
            uiEntity.script.get('FeatureShowcaseUI').hide();
        }
    }

    private navigateToFeature(featureId: string): void {
        // Find the FeatureShowcaseUI and navigate to the feature
        const uiEntity = this.app.root.findByName('FeatureShowcaseUI');
        if (uiEntity && uiEntity.script && uiEntity.script.get('FeatureShowcaseUI')) {
            const ui = uiEntity.script.get('FeatureShowcaseUI');
            ui.navigateToFeature(featureId);
        }
    }
}

pc.registerScript(ButtonHandler);