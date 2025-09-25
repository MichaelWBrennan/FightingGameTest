import { pc } from 'playcanvas';

export class HoverHandler extends pc.ScriptType {
    public static scriptName = 'hoverHandler';

    private originalScale: pc.Vec3 = new pc.Vec3(1, 1, 1);
    private hoverScale: pc.Vec3 = new pc.Vec3(1.05, 1.05, 1.05);
    private originalColor: pc.Color = new pc.Color(1, 1, 1, 1);
    private hoverColor: pc.Color = new pc.Color(1, 0.4, 0.2, 1);

    public initialize(): void {
        // Store original scale
        this.originalScale.copy(this.entity.getLocalScale());
        
        // Add mouse events
        this.entity.on('mouseenter', this.onMouseEnter, this);
        this.entity.on('mouseleave', this.onMouseLeave, this);
    }

    public onMouseEnter(event: pc.MouseEvent): void {
        // Scale up the entity
        this.entity.setLocalScale(this.hoverScale);
        
        // Change color if it's a text element
        const element = this.entity.element;
        if (element && element.type === pc.ELEMENTTYPE_TEXT) {
            this.originalColor.copy(element.color);
            element.color = this.hoverColor;
        }
        
        // Add glow effect
        this.addGlowEffect();
    }

    public onMouseLeave(event: pc.MouseEvent): void {
        // Scale back to original
        this.entity.setLocalScale(this.originalScale);
        
        // Restore original color
        const element = this.entity.element;
        if (element && element.type === pc.ELEMENTTYPE_TEXT) {
            element.color = this.originalColor;
        }
        
        // Remove glow effect
        this.removeGlowEffect();
    }

    private addGlowEffect(): void {
        // Add a subtle glow effect by creating a duplicate entity with blur
        const glowEntity = this.entity.findByName('GlowEffect');
        if (!glowEntity) {
            const glow = this.entity.clone();
            glow.name = 'GlowEffect';
            glow.setLocalScale(1.1, 1.1, 1.1);
            
            // Make it slightly transparent and offset
            const glowElement = glow.element;
            if (glowElement) {
                glowElement.color = new pc.Color(1, 0.4, 0.2, 0.3);
            }
            
            this.entity.addChild(glow);
        }
    }

    private removeGlowEffect(): void {
        const glowEntity = this.entity.findByName('GlowEffect');
        if (glowEntity) {
            glowEntity.destroy();
        }
    }
}

pc.registerScript(HoverHandler);