import * as pc from 'playcanvas';

export interface StageSavePromptData {
  stageData: any;
  generationParams: any;
  matchResult: {
    winner: string;
    loser: string;
    duration: number;
    rounds: number;
    matchId: string;
    timestamp: Date;
  };
}

export class StageSavePrompt {
  private app: pc.Application;
  private container: pc.Entity | null = null;
  private isVisible = false;
  private promptData: StageSavePromptData | null = null;

  constructor(app: pc.Application) {
    this.app = app;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.app.on('ui:show_stage_save_prompt', this.show.bind(this));
    this.app.on('ui:hide_stage_save_prompt', this.hide.bind(this));
  }

  public show(event: any): void {
    this.promptData = event.prompt;
    this.isVisible = true;
    this.createUI();
  }

  public hide(): void {
    this.isVisible = false;
    this.destroyUI();
  }

  private createUI(): void {
    if (!this.promptData) return;

    // Create main container
    this.container = new pc.Entity('StageSavePrompt');
    this.container.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0, 0, 0, 0],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0]
    });

    // Create background overlay
    const background = new pc.Entity('Background');
    background.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 0, 0],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0, 0, 0, 0.8)
    });
    this.container.addChild(background);

    // Create main panel - unified dark theme
    const panel = new pc.Entity('Panel');
    panel.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-300, -200, 300, 200],
      color: new pc.Color(0.2, 0.2, 0.2, 0.95)
    });
    this.container.addChild(panel);

    // Panel border - subtle dark border
    const panelBorder = new pc.Entity('PanelBorder');
    panelBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.4, 0.4, 0.4, 0.8)
    });
    panel.addChild(panelBorder);

    // Create title
    const title = new pc.Entity('Title');
    title.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-250, 150, 250, 200],
      text: 'Save This Stage?',
      fontSize: 32,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    this.container.addChild(title);

    // Create stage preview info
    const stageInfo = this.createStageInfo();
    this.container.addChild(stageInfo);

    // Create input fields
    const nameInput = this.createNameInput();
    this.container.addChild(nameInput);

    const descriptionInput = this.createDescriptionInput();
    this.container.addChild(descriptionInput);

    const tagsInput = this.createTagsInput();
    this.container.addChild(tagsInput);

    // Create buttons
    const buttons = this.createButtons();
    this.container.addChild(buttons);

    // Add to scene
    this.app.root.addChild(this.container);
  }

  private createStageInfo(): pc.Entity {
    const info = new pc.Entity('StageInfo');
    info.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-250, 50, 250, 120]
    });

    if (this.promptData) {
      const stageName = this.promptData.stageData.name || 'Generated Stage';
      const theme = this.promptData.generationParams.theme || 'unknown';
      const size = this.promptData.generationParams.size || 'medium';
      const atmosphere = this.promptData.generationParams.atmosphere || 'mysterious';

      const nameText = new pc.Entity('StageName');
      nameText.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        anchor: [0, 0, 1, 0.3],
        pivot: [0, 0.5],
        margin: [10, 0, -10, 0],
        text: stageName,
        fontSize: 18,
        color: new pc.Color(1, 1, 1, 1),
        fontAsset: this.getFontAsset()
      });
      info.addChild(nameText);

      const detailsText = new pc.Entity('StageDetails');
      detailsText.addComponent('element', {
        type: pc.ELEMENTTYPE_TEXT,
        anchor: [0, 0.3, 1, 1],
        pivot: [0, 0.5],
        margin: [10, 0, -10, 0],
        text: `Theme: ${theme} | Size: ${size} | Atmosphere: ${atmosphere}`,
        fontSize: 14,
        color: new pc.Color(0.8, 0.8, 0.8, 1),
        fontAsset: this.getFontAsset()
      });
      info.addChild(detailsText);
    }

    return info;
  }

  private createNameInput(): pc.Entity {
    const input = new pc.Entity('NameInput');
    input.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-250, -20, 250, 20]
    });

    const label = new pc.Entity('NameLabel');
    label.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 0.3, 1],
      pivot: [0, 0.5],
      margin: [10, 0, 0, 0],
      text: 'Name:',
      fontSize: 16,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    input.addChild(label);

    const inputField = new pc.Entity('NameField');
    inputField.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.3, 0, 1, 1],
      pivot: [0, 0.5],
      margin: [10, 5, -10, -5],
      color: new pc.Color(0.15, 0.15, 0.15, 1)
    });
    input.addChild(inputField);

    // Input field border
    const inputBorder = new pc.Entity('InputBorder');
    inputBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.3, 0.3, 0.3, 0.8)
    });
    inputField.addChild(inputBorder);

    const inputText = new pc.Entity('NameText');
    inputText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 1, 1],
      pivot: [0, 0.5],
      margin: [5, 0, -5, 0],
      text: this.promptData?.stageData.name || 'Generated Stage',
      fontSize: 14,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    inputField.addChild(inputText);

    return input;
  }

  private createDescriptionInput(): pc.Entity {
    const input = new pc.Entity('DescriptionInput');
    input.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-250, -60, 250, -20]
    });

    const label = new pc.Entity('DescriptionLabel');
    label.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 0.3, 1],
      pivot: [0, 0.5],
      margin: [10, 0, 0, 0],
      text: 'Description:',
      fontSize: 16,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    input.addChild(label);

    const inputField = new pc.Entity('DescriptionField');
    inputField.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.3, 0, 1, 1],
      pivot: [0, 0.5],
      margin: [10, 5, -10, -5],
      color: new pc.Color(0.15, 0.15, 0.15, 1)
    });
    input.addChild(inputField);

    // Input field border
    const inputBorder = new pc.Entity('InputBorder');
    inputBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.3, 0.3, 0.3, 0.8)
    });
    inputField.addChild(inputBorder);

    const inputText = new pc.Entity('DescriptionText');
    inputText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 1, 1],
      pivot: [0, 0.5],
      margin: [5, 0, -5, 0],
      text: this.generateDefaultDescription(),
      fontSize: 12,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    inputField.addChild(inputText);

    return input;
  }

  private createTagsInput(): pc.Entity {
    const input = new pc.Entity('TagsInput');
    input.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-250, -100, 250, -60]
    });

    const label = new pc.Entity('TagsLabel');
    label.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 0.3, 1],
      pivot: [0, 0.5],
      margin: [10, 0, 0, 0],
      text: 'Tags:',
      fontSize: 16,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    input.addChild(label);

    const inputField = new pc.Entity('TagsField');
    inputField.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.3, 0, 1, 1],
      pivot: [0, 0.5],
      margin: [10, 5, -10, -5],
      color: new pc.Color(0.15, 0.15, 0.15, 1)
    });
    input.addChild(inputField);

    // Input field border
    const inputBorder = new pc.Entity('InputBorder');
    inputBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.3, 0.3, 0.3, 0.8)
    });
    inputField.addChild(inputBorder);

    const inputText = new pc.Entity('TagsText');
    inputText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 1, 1],
      pivot: [0, 0.5],
      margin: [5, 0, -5, 0],
      text: this.generateDefaultTags().join(', '),
      fontSize: 12,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    inputField.addChild(inputText);

    return input;
  }

  private createButtons(): pc.Entity {
    const buttons = new pc.Entity('Buttons');
    buttons.addComponent('element', {
      type: pc.ELEMENTTYPE_GROUP,
      anchor: [0.5, 0.5, 0.5, 0.5],
      pivot: [0.5, 0.5],
      margin: [-250, -150, 250, -100]
    });

    // Save button - unified dark theme
    const saveButton = new pc.Entity('SaveButton');
    saveButton.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 0.4, 1],
      pivot: [0, 0.5],
      margin: [10, 5, -10, -5],
      color: new pc.Color(0.2, 0.2, 0.2, 0.9)
    });
    buttons.addChild(saveButton);

    // Save button border
    const saveBorder = new pc.Entity('SaveBorder');
    saveBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.2, 0.6, 0.2, 0.8)
    });
    saveButton.addChild(saveBorder);

    const saveText = new pc.Entity('SaveText');
    saveText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      text: 'Save Stage',
      fontSize: 16,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    saveButton.addChild(saveText);

    // Cancel button - unified dark theme
    const cancelButton = new pc.Entity('CancelButton');
    cancelButton.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0.6, 0, 1, 1],
      pivot: [0, 0.5],
      margin: [10, 5, -10, -5],
      color: new pc.Color(0.2, 0.2, 0.2, 0.9)
    });
    buttons.addChild(cancelButton);

    // Cancel button border
    const cancelBorder = new pc.Entity('CancelBorder');
    cancelBorder.addComponent('element', {
      type: pc.ELEMENTTYPE_IMAGE,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      color: new pc.Color(0.6, 0.2, 0.2, 0.8)
    });
    cancelButton.addChild(cancelBorder);

    const cancelText = new pc.Entity('CancelText');
    cancelText.addComponent('element', {
      type: pc.ELEMENTTYPE_TEXT,
      anchor: [0, 0, 1, 1],
      pivot: [0.5, 0.5],
      margin: [0, 0, 0, 0],
      text: 'Cancel',
      fontSize: 16,
      color: new pc.Color(1, 1, 1, 1),
      fontAsset: this.getFontAsset()
    });
    cancelButton.addChild(cancelText);

    // Add click handlers
    this.addButtonHandlers(saveButton, cancelButton);

    return buttons;
  }

  private addButtonHandlers(saveButton: pc.Entity, cancelButton: pc.Entity): void {
    // Save button click
    saveButton.addComponent('script', {
      enabled: true,
      scripts: [{
        name: 'ButtonHandler',
        url: 'data:application/javascript;base64,' + btoa(`
          pc.registerScript('ButtonHandler', class {
            initialize() {
              this.entity.element.on('click', () => {
                this.app.fire('stage:save_requested', {
                  name: 'Generated Stage',
                  description: 'A procedurally generated stage',
                  tags: ['procedural', 'generated'],
                  isFavorite: false
                });
              });
            }
          }
        `)
      }]
    });

    // Cancel button click
    cancelButton.addComponent('script', {
      enabled: true,
      scripts: [{
        name: 'ButtonHandler',
        url: 'data:application/javascript;base64,' + btoa(`
          pc.registerScript('ButtonHandler', class {
            initialize() {
              this.entity.element.on('click', () => {
                this.app.fire('stage:save_cancelled');
              });
            }
          }
        `)
      }]
    });
  }

  private generateDefaultDescription(): string {
    if (!this.promptData) return 'A procedurally generated stage';
    
    const { stageData, generationParams } = this.promptData;
    const theme = generationParams.theme || 'unknown';
    const atmosphere = generationParams.atmosphere || 'mysterious';
    
    return `A ${atmosphere} ${theme} stage generated for this match.`;
  }

  private generateDefaultTags(): string[] {
    if (!this.promptData) return ['procedural', 'generated'];
    
    const { generationParams } = this.promptData;
    const tags: string[] = ['procedural', 'generated'];
    
    if (generationParams.theme) tags.push(generationParams.theme);
    if (generationParams.size) tags.push(generationParams.size);
    if (generationParams.atmosphere) tags.push(generationParams.atmosphere);
    if (generationParams.weather && generationParams.weather !== 'none') tags.push(generationParams.weather);
    if (generationParams.hazards) tags.push('hazards');
    if (generationParams.interactiveElements > 0) tags.push('interactive');
    
    return tags;
  }

  private getFontAsset(): pc.Asset | null {
    // This would return the actual font asset
    // For now, return null to use default font
    return null;
  }

  private destroyUI(): void {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }

  public destroy(): void {
    this.destroyUI();
  }
}