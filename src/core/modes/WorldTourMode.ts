import type { pc } from 'playcanvas';
import { Character } from '../../../types/character';
import { Logger } from '../utils/Logger';

export interface WorldLocation {
  id: string;
  name: string;
  description: string;
  type: 'city' | 'dojo' | 'tournament' | 'training' | 'shop' | 'story';
  position: { x: number; y: number; z: number };
  requirements: {
    level?: number;
    storyProgress?: number;
    characterUnlocked?: string;
  };
  activities: WorldActivity[];
  npcs: WorldNPC[];
  connections: string[]; // Connected location IDs
}

export interface WorldActivity {
  id: string;
  name: string;
  description: string;
  type: 'fight' | 'training' | 'story' | 'shop' | 'minigame';
  rewards: {
    experience?: number;
    money?: number;
    items?: string[];
    storyProgress?: number;
  };
  requirements: {
    level?: number;
    storyProgress?: number;
    characterUnlocked?: string;
  };
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  duration: number; // in minutes
}

export interface WorldNPC {
  id: string;
  name: string;
  description: string;
  type: 'trainer' | 'shopkeeper' | 'story' | 'rival' | 'master';
  dialogue: string[];
  quests: WorldQuest[];
  shop?: WorldShop;
}

export interface WorldQuest {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'side' | 'daily' | 'weekly';
  objectives: QuestObjective[];
  rewards: {
    experience?: number;
    money?: number;
    items?: string[];
    characterUnlock?: string;
    storyProgress?: number;
  };
  requirements: {
    level?: number;
    storyProgress?: number;
    characterUnlocked?: string;
  };
  status: 'available' | 'active' | 'completed' | 'failed';
}

export interface QuestObjective {
  id: string;
  description: string;
  type: 'defeat' | 'collect' | 'visit' | 'complete' | 'talk';
  target: string;
  count: number;
  current: number;
  completed: boolean;
}

export interface WorldShop {
  id: string;
  name: string;
  items: ShopItem[];
  refreshRate: number; // hours
  lastRefresh: number;
}

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  type: 'equipment' | 'consumable' | 'cosmetic' | 'character' | 'move';
  price: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  requirements: {
    level?: number;
    storyProgress?: number;
    characterUnlocked?: string;
  };
  stock: number;
  maxStock: number;
}

export interface PlayerProgress {
  level: number;
  experience: number;
  money: number;
  storyProgress: number;
  unlockedCharacters: string[];
  unlockedMoves: string[];
  unlockedLocations: string[];
  completedQuests: string[];
  inventory: PlayerItem[];
  stats: {
    fightsWon: number;
    fightsLost: number;
    trainingHours: number;
    moneyEarned: number;
    moneySpent: number;
  };
}

export interface PlayerItem {
  id: string;
  quantity: number;
  equipped: boolean;
}

export class WorldTourMode {
  private app: pc.Application;
  private locations: Map<string, WorldLocation> = new Map();
  private currentLocation: string | null = null;
  private playerProgress: PlayerProgress;
  private activeQuests: Map<string, WorldQuest> = new Map();
  private worldMap: WorldMap;
  private npcInteractions: Map<string, number> = new Map();
  private shopInventories: Map<string, ShopItem[]> = new Map();

  constructor(app: pc.Application) {
    this.app = app;
    this.initializeWorldTour();
  }

  private initializeWorldTour(): void {
    this.initializePlayerProgress();
    this.initializeLocations();
    this.initializeWorldMap();
    this.initializeQuests();
    this.initializeShops();
  }

  private initializePlayerProgress(): void {
    this.playerProgress = {
      level: 1,
      experience: 0,
      money: 1000,
      storyProgress: 0,
      unlockedCharacters: ['ryu'],
      unlockedMoves: [],
      unlockedLocations: ['metro_city'],
      completedQuests: [],
      inventory: [],
      stats: {
        fightsWon: 0,
        fightsLost: 0,
        trainingHours: 0,
        moneyEarned: 0,
        moneySpent: 0
      }
    };
  }

  private initializeLocations(): void {
    // Metro City
    this.locations.set('metro_city', {
      id: 'metro_city',
      name: 'Metro City',
      description: 'A bustling metropolis where fighters gather',
      type: 'city',
      position: { x: 0, y: 0, z: 0 },
      requirements: {},
      activities: [
        {
          id: 'street_fight',
          name: 'Street Fight',
          description: 'Fight random opponents in the streets',
          type: 'fight',
          rewards: { experience: 50, money: 100 },
          requirements: {},
          difficulty: 'easy',
          duration: 5
        },
        {
          id: 'tournament_entry',
          name: 'Tournament Entry',
          description: 'Enter the local fighting tournament',
          type: 'fight',
          rewards: { experience: 200, money: 500, storyProgress: 10 },
          requirements: { level: 5 },
          difficulty: 'medium',
          duration: 15
        }
      ],
      npcs: [
        {
          id: 'metro_trainer',
          name: 'Master Chen',
          description: 'A wise old trainer who teaches the basics',
          type: 'trainer',
          dialogue: [
            'Welcome to Metro City, young fighter!',
            'I can teach you the fundamentals of fighting.',
            'Come back when you\'re ready to learn more advanced techniques.'
          ],
          quests: [
            {
              id: 'learn_basics',
              name: 'Learn the Basics',
              description: 'Complete basic training with Master Chen',
              type: 'main',
              objectives: [
                {
                  id: 'complete_training',
                  description: 'Complete basic training session',
                  type: 'complete',
                  target: 'basic_training',
                  count: 1,
                  current: 0,
                  completed: false
                }
              ],
              rewards: { experience: 100, money: 200, storyProgress: 5 },
              requirements: {},
              status: 'available'
            }
          ]
        }
      ],
      connections: ['training_grounds', 'tournament_hall']
    });

    // Training Grounds
    this.locations.set('training_grounds', {
      id: 'training_grounds',
      name: 'Training Grounds',
      description: 'A dedicated facility for honing your skills',
      type: 'training',
      position: { x: 100, y: 0, z: 0 },
      requirements: { storyProgress: 5 },
      activities: [
        {
          id: 'basic_training',
          name: 'Basic Training',
          description: 'Learn fundamental fighting techniques',
          type: 'training',
          rewards: { experience: 75, storyProgress: 3 },
          requirements: {},
          difficulty: 'easy',
          duration: 10
        },
        {
          id: 'advanced_training',
          name: 'Advanced Training',
          description: 'Master advanced fighting techniques',
          type: 'training',
          rewards: { experience: 150, storyProgress: 8 },
          requirements: { level: 10 },
          difficulty: 'medium',
          duration: 20
        }
      ],
      npcs: [
        {
          id: 'training_master',
          name: 'Sensei Yamato',
          description: 'A master of the fighting arts',
          type: 'master',
          dialogue: [
            'Training is the path to mastery.',
            'Focus on your fundamentals before advancing.',
            'Only through dedication can you achieve greatness.'
          ],
          quests: []
        }
      ],
      connections: ['metro_city', 'mountain_dojo']
    });

    // Tournament Hall
    this.locations.set('tournament_hall', {
      id: 'tournament_hall',
      name: 'Tournament Hall',
      description: 'Where the greatest fighters compete',
      type: 'tournament',
      position: { x: -100, y: 0, z: 0 },
      requirements: { level: 8 },
      activities: [
        {
          id: 'weekly_tournament',
          name: 'Weekly Tournament',
          description: 'Compete in the weekly fighting tournament',
          type: 'fight',
          rewards: { experience: 300, money: 1000, storyProgress: 15 },
          requirements: { level: 8 },
          difficulty: 'hard',
          duration: 30
        }
      ],
      npcs: [
        {
          id: 'tournament_organizer',
          name: 'Tournament Organizer',
          description: 'Manages the fighting tournaments',
          type: 'story',
          dialogue: [
            'Welcome to the Tournament Hall!',
            'Only the strongest fighters compete here.',
            'Prove your worth and claim the championship!'
          ],
          quests: []
        }
      ],
      connections: ['metro_city', 'championship_arena']
    });

    // Mountain Dojo
    this.locations.set('mountain_dojo', {
      id: 'mountain_dojo',
      name: 'Mountain Dojo',
      description: 'A secluded dojo high in the mountains',
      type: 'dojo',
      position: { x: 200, y: 50, z: 0 },
      requirements: { level: 15, storyProgress: 20 },
      activities: [
        {
          id: 'master_training',
          name: 'Master Training',
          description: 'Learn from the legendary masters',
          type: 'training',
          rewards: { experience: 500, storyProgress: 25 },
          requirements: { level: 15 },
          difficulty: 'expert',
          duration: 45
        }
      ],
      npcs: [
        {
          id: 'mountain_master',
          name: 'Mountain Master',
          description: 'A legendary master of the fighting arts',
          type: 'master',
          dialogue: [
            'Few have the dedication to reach this place.',
            'The path to mastery is long and difficult.',
            'Only those who persevere will succeed.'
          ],
          quests: []
        }
      ],
      connections: ['training_grounds', 'championship_arena']
    });

    // Championship Arena
    this.locations.set('championship_arena', {
      id: 'championship_arena',
      name: 'Championship Arena',
      description: 'The ultimate fighting venue',
      type: 'tournament',
      position: { x: 0, y: 100, z: 0 },
      requirements: { level: 20, storyProgress: 50 },
      activities: [
        {
          id: 'championship_tournament',
          name: 'Championship Tournament',
          description: 'The ultimate fighting tournament',
          type: 'fight',
          rewards: { experience: 1000, money: 5000, storyProgress: 100 },
          requirements: { level: 20 },
          difficulty: 'expert',
          duration: 60
        }
      ],
      npcs: [
        {
          id: 'championship_organizer',
          name: 'Championship Organizer',
          description: 'Organizes the ultimate fighting tournament',
          type: 'story',
          dialogue: [
            'Welcome to the Championship Arena!',
            'Only the greatest fighters compete here.',
            'This is where legends are made!'
          ],
          quests: []
        }
      ],
      connections: ['tournament_hall', 'mountain_dojo']
    });
  }

  private initializeWorldMap(): void {
    this.worldMap = {
      width: 1000,
      height: 1000,
      locations: Array.from(this.locations.values()),
      connections: this.generateConnections()
    };
  }

  private generateConnections(): { from: string; to: string; distance: number }[] {
    const connections: { from: string; to: string; distance: number }[] = [];
    
    for (const location of this.locations.values()) {
      for (const connectedId of location.connections) {
        const connectedLocation = this.locations.get(connectedId);
        if (connectedLocation) {
          const distance = this.calculateDistance(location.position, connectedLocation.position);
          connections.push({
            from: location.id,
            to: connectedId,
            distance: distance
          });
        }
      }
    }
    
    return connections;
  }

  private calculateDistance(pos1: { x: number; y: number; z: number }, pos2: { x: number; y: number; z: number }): number {
    const dx = pos2.x - pos1.x;
    const dy = pos2.y - pos1.y;
    const dz = pos2.z - pos1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private initializeQuests(): void {
    // Main story quests
    this.initializeMainQuests();
    
    // Side quests
    this.initializeSideQuests();
    
    // Daily quests
    this.initializeDailyQuests();
  }

  private initializeMainQuests(): void {
    // These would be loaded from a quest database
    const mainQuests: WorldQuest[] = [
      {
        id: 'story_beginning',
        name: 'The Beginning',
        description: 'Start your journey as a fighter',
        type: 'main',
        objectives: [
          {
            id: 'visit_metro_city',
            description: 'Visit Metro City',
            type: 'visit',
            target: 'metro_city',
            count: 1,
            current: 0,
            completed: false
          },
          {
            id: 'talk_to_master_chen',
            description: 'Talk to Master Chen',
            type: 'talk',
            target: 'metro_trainer',
            count: 1,
            current: 0,
            completed: false
          }
        ],
        rewards: { experience: 200, money: 500, storyProgress: 10 },
        requirements: {},
        status: 'available'
      }
    ];

    for (const quest of mainQuests) {
      this.activeQuests.set(quest.id, quest);
    }
  }

  private initializeSideQuests(): void {
    // Side quests would be loaded from a database
  }

  private initializeDailyQuests(): void {
    // Daily quests would be generated dynamically
  }

  private initializeShops(): void {
    // Initialize shop inventories
    this.shopInventories.set('metro_shop', [
      {
        id: 'basic_gloves',
        name: 'Basic Fighting Gloves',
        description: 'Simple gloves for beginners',
        type: 'equipment',
        price: 100,
        rarity: 'common',
        requirements: {},
        stock: 10,
        maxStock: 10
      },
      {
        id: 'energy_drink',
        name: 'Energy Drink',
        description: 'Restores stamina during fights',
        type: 'consumable',
        price: 50,
        rarity: 'common',
        requirements: {},
        stock: 20,
        maxStock: 20
      }
    ]);
  }

  public async startWorldTour(): Promise<void> {
    Logger.info('Starting World Tour Mode');
    
    // Set initial location
    this.currentLocation = 'metro_city';
    
    // Initialize world map UI
    await this.initializeWorldMapUI();
    
    // Start world tour update loop
    this.startWorldTourUpdate();
    
    // Emit event
    this.app.fire('worldtour:started', {
      currentLocation: this.currentLocation,
      playerProgress: this.playerProgress
    });
  }

  private async initializeWorldMapUI(): Promise<void> {
    // Initialize world map UI
    // This would create the world map interface
  }

  private startWorldTourUpdate(): void {
    // Start update loop for world tour mode
    const updateWorldTour = () => {
      this.updateWorldTour();
      requestAnimationFrame(updateWorldTour);
    };
    updateWorldTour();
  }

  private updateWorldTour(): void {
    // Update world tour systems
    this.updateQuests();
    this.updateShops();
    this.updateNPCs();
  }

  private updateQuests(): void {
    // Update quest progress and status
    for (const quest of this.activeQuests.values()) {
      if (quest.status === 'active') {
        this.checkQuestObjectives(quest);
      }
    }
  }

  private updateShops(): void {
    // Update shop inventories and refresh rates
    for (const [shopId, items] of this.shopInventories.entries()) {
      // Check if shop needs refresh
      const now = Date.now();
      const shop = this.getShopById(shopId);
      if (shop && now - shop.lastRefresh > shop.refreshRate * 60 * 60 * 1000) {
        this.refreshShop(shopId);
      }
    }
  }

  private updateNPCs(): void {
    // Update NPC interactions and dialogue
  }

  public async travelToLocation(locationId: string): Promise<boolean> {
    const location = this.locations.get(locationId);
    if (!location) {
      Logger.warn(`Location ${locationId} not found`);
      return false;
    }

    // Check requirements
    if (!this.checkLocationRequirements(location)) {
      Logger.warn(`Requirements not met for location ${locationId}`);
      return false;
    }

    // Travel to location
    this.currentLocation = locationId;
    
    // Update UI
    await this.updateLocationUI(location);
    
    // Emit event
    this.app.fire('worldtour:location_changed', {
      locationId,
      location,
      playerProgress: this.playerProgress
    });

    Logger.info(`Traveled to ${location.name}`);
    return true;
  }

  private checkLocationRequirements(location: WorldLocation): boolean {
    // Check level requirement
    if (location.requirements.level && this.playerProgress.level < location.requirements.level) {
      return false;
    }

    // Check story progress requirement
    if (location.requirements.storyProgress && this.playerProgress.storyProgress < location.requirements.storyProgress) {
      return false;
    }

    // Check character unlock requirement
    if (location.requirements.characterUnlocked && !this.playerProgress.unlockedCharacters.includes(location.requirements.characterUnlocked)) {
      return false;
    }

    return true;
  }

  private async updateLocationUI(location: WorldLocation): Promise<void> {
    // Update location UI
    // This would update the world map and location interface
  }

  public async startActivity(activityId: string): Promise<boolean> {
    if (!this.currentLocation) {
      Logger.warn('No current location');
      return false;
    }

    const location = this.locations.get(this.currentLocation);
    if (!location) {
      Logger.warn(`Current location ${this.currentLocation} not found`);
      return false;
    }

    const activity = location.activities.find(a => a.id === activityId);
    if (!activity) {
      Logger.warn(`Activity ${activityId} not found in location ${this.currentLocation}`);
      return false;
    }

    // Check requirements
    if (!this.checkActivityRequirements(activity)) {
      Logger.warn(`Requirements not met for activity ${activityId}`);
      return false;
    }

    // Start activity
    await this.executeActivity(activity);

    // Emit event
    this.app.fire('worldtour:activity_started', {
      activityId,
      activity,
      location: this.currentLocation
    });

    Logger.info(`Started activity ${activity.name}`);
    return true;
  }

  private checkActivityRequirements(activity: WorldActivity): boolean {
    // Check level requirement
    if (activity.requirements.level && this.playerProgress.level < activity.requirements.level) {
      return false;
    }

    // Check story progress requirement
    if (activity.requirements.storyProgress && this.playerProgress.storyProgress < activity.requirements.storyProgress) {
      return false;
    }

    // Check character unlock requirement
    if (activity.requirements.characterUnlocked && !this.playerProgress.unlockedCharacters.includes(activity.requirements.characterUnlocked)) {
      return false;
    }

    return true;
  }

  private async executeActivity(activity: WorldActivity): Promise<void> {
    switch (activity.type) {
      case 'fight':
        await this.executeFightActivity(activity);
        break;
      case 'training':
        await this.executeTrainingActivity(activity);
        break;
      case 'story':
        await this.executeStoryActivity(activity);
        break;
      case 'shop':
        await this.executeShopActivity(activity);
        break;
      case 'minigame':
        await this.executeMinigameActivity(activity);
        break;
    }
  }

  private async executeFightActivity(activity: WorldActivity): Promise<void> {
    // Execute fight activity
    // This would start a fight with appropriate opponent
    
    // Simulate fight completion
    const won = Math.random() > 0.3; // 70% win rate for now
    
    if (won) {
      this.playerProgress.stats.fightsWon++;
      this.giveRewards(activity.rewards);
    } else {
      this.playerProgress.stats.fightsLost++;
    }
  }

  private async executeTrainingActivity(activity: WorldActivity): Promise<void> {
    // Execute training activity
    // This would start a training session
    
    this.playerProgress.stats.trainingHours += activity.duration / 60;
    this.giveRewards(activity.rewards);
  }

  private async executeStoryActivity(activity: WorldActivity): Promise<void> {
    // Execute story activity
    // This would play story content
    
    this.giveRewards(activity.rewards);
  }

  private async executeShopActivity(activity: WorldActivity): Promise<void> {
    // Execute shop activity
    // This would open the shop interface
    
    this.giveRewards(activity.rewards);
  }

  private async executeMinigameActivity(activity: WorldActivity): Promise<void> {
    // Execute minigame activity
    // This would start a minigame
    
    this.giveRewards(activity.rewards);
  }

  private giveRewards(rewards: any): void {
    if (rewards.experience) {
      this.playerProgress.experience += rewards.experience;
        this.checkLevelUp();
    }

    if (rewards.money) {
      this.playerProgress.money += rewards.money;
      this.playerProgress.stats.moneyEarned += rewards.money;
    }

    if (rewards.items) {
      for (const itemId of rewards.items) {
        this.addItemToInventory(itemId, 1);
      }
    }

    if (rewards.storyProgress) {
      this.playerProgress.storyProgress += rewards.storyProgress;
    }

    if (rewards.characterUnlock) {
      if (!this.playerProgress.unlockedCharacters.includes(rewards.characterUnlock)) {
        this.playerProgress.unlockedCharacters.push(rewards.characterUnlock);
      }
    }
  }

  private checkLevelUp(): void {
    const requiredExp = this.getRequiredExperience(this.playerProgress.level);
    if (this.playerProgress.experience >= requiredExp) {
      this.playerProgress.level++;
      this.playerProgress.experience -= requiredExp;
      
      // Emit level up event
      this.app.fire('worldtour:level_up', {
        newLevel: this.playerProgress.level,
        playerProgress: this.playerProgress
      });
      
      Logger.info(`Leveled up to ${this.playerProgress.level}`);
    }
  }

  private getRequiredExperience(level: number): number {
    return level * 1000; // Simple formula for now
  }

  private addItemToInventory(itemId: string, quantity: number): void {
    const existingItem = this.playerProgress.inventory.find(item => item.id === itemId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      this.playerProgress.inventory.push({
        id: itemId,
        quantity: quantity,
        equipped: false
      });
    }
  }

  public async interactWithNPC(npcId: string): Promise<void> {
    if (!this.currentLocation) {
      Logger.warn('No current location');
      return;
    }

    const location = this.locations.get(this.currentLocation);
    if (!location) {
      Logger.warn(`Current location ${this.currentLocation} not found`);
      return;
    }

    const npc = location.npcs.find(n => n.id === npcId);
    if (!npc) {
      Logger.warn(`NPC ${npcId} not found in location ${this.currentLocation}`);
      return;
    }

    // Update interaction count
    const interactionCount = this.npcInteractions.get(npcId) || 0;
    this.npcInteractions.set(npcId, interactionCount + 1);

    // Emit NPC interaction event
    this.app.fire('worldtour:npc_interaction', {
      npcId,
      npc,
      location: this.currentLocation,
      interactionCount: interactionCount + 1
    });

    Logger.info(`Interacted with NPC ${npc.name}`);
  }

  public async startQuest(questId: string): Promise<boolean> {
    const quest = this.activeQuests.get(questId);
    if (!quest) {
      Logger.warn(`Quest ${questId} not found`);
      return false;
    }

    if (quest.status !== 'available') {
      Logger.warn(`Quest ${questId} is not available`);
      return false;
    }

    // Check requirements
    if (!this.checkQuestRequirements(quest)) {
      Logger.warn(`Requirements not met for quest ${questId}`);
      return false;
    }

    // Start quest
    quest.status = 'active';
    
    // Emit quest started event
    this.app.fire('worldtour:quest_started', {
      questId,
      quest,
      playerProgress: this.playerProgress
    });

    Logger.info(`Started quest ${quest.name}`);
    return true;
  }

  private checkQuestRequirements(quest: WorldQuest): boolean {
    // Check level requirement
    if (quest.requirements.level && this.playerProgress.level < quest.requirements.level) {
      return false;
    }

    // Check story progress requirement
    if (quest.requirements.storyProgress && this.playerProgress.storyProgress < quest.requirements.storyProgress) {
      return false;
    }

    // Check character unlock requirement
    if (quest.requirements.characterUnlocked && !this.playerProgress.unlockedCharacters.includes(quest.requirements.characterUnlocked)) {
      return false;
    }

    return true;
  }

  private checkQuestObjectives(quest: WorldQuest): void {
    let allCompleted = true;
    
    for (const objective of quest.objectives) {
      if (!objective.completed) {
        // Check if objective is completed
        if (objective.current >= objective.count) {
          objective.completed = true;
        } else {
          allCompleted = false;
        }
      }
    }

    if (allCompleted) {
      this.completeQuest(quest);
    }
  }

  private completeQuest(quest: WorldQuest): void {
    quest.status = 'completed';
    this.playerProgress.completedQuests.push(quest.id);
    
    // Give rewards
    this.giveRewards(quest.rewards);
    
    // Emit quest completed event
    this.app.fire('worldtour:quest_completed', {
      questId: quest.id,
      quest,
      playerProgress: this.playerProgress
    });

    Logger.info(`Completed quest ${quest.name}`);
  }

  public async buyItem(shopId: string, itemId: string, quantity: number): Promise<boolean> {
    const shop = this.getShopById(shopId);
    if (!shop) {
      Logger.warn(`Shop ${shopId} not found`);
      return false;
    }

    const items = this.shopInventories.get(shopId) || [];
    const item = items.find(i => i.id === itemId);
    if (!item) {
      Logger.warn(`Item ${itemId} not found in shop ${shopId}`);
      return false;
    }

    // Check requirements
    if (!this.checkItemRequirements(item)) {
      Logger.warn(`Requirements not met for item ${itemId}`);
      return false;
    }

    // Check stock
    if (item.stock < quantity) {
      Logger.warn(`Not enough stock for item ${itemId}`);
      return false;
    }

    // Check money
    const totalCost = item.price * quantity;
    if (this.playerProgress.money < totalCost) {
      Logger.warn(`Not enough money for item ${itemId}`);
      return false;
    }

    // Buy item
    item.stock -= quantity;
    this.playerProgress.money -= totalCost;
    this.playerProgress.stats.moneySpent += totalCost;
    this.addItemToInventory(itemId, quantity);

    // Emit item bought event
    this.app.fire('worldtour:item_bought', {
      shopId,
      itemId,
      quantity,
      totalCost,
      playerProgress: this.playerProgress
    });

    Logger.info(`Bought ${quantity} x ${item.name} for ${totalCost} money`);
    return true;
  }

  private checkItemRequirements(item: ShopItem): boolean {
    // Check level requirement
    if (item.requirements.level && this.playerProgress.level < item.requirements.level) {
      return false;
    }

    // Check story progress requirement
    if (item.requirements.storyProgress && this.playerProgress.storyProgress < item.requirements.storyProgress) {
      return false;
    }

    // Check character unlock requirement
    if (item.requirements.characterUnlocked && !this.playerProgress.unlockedCharacters.includes(item.requirements.characterUnlocked)) {
      return false;
    }

    return true;
  }

  private getShopById(shopId: string): WorldShop | undefined {
    // This would search through all NPCs to find the shop
    return undefined; // Placeholder
  }

  private refreshShop(shopId: string): void {
    // Refresh shop inventory
    // This would regenerate the shop's inventory
  }

  public getCurrentLocation(): WorldLocation | null {
    if (!this.currentLocation) return null;
    return this.locations.get(this.currentLocation) || null;
  }

  public getPlayerProgress(): PlayerProgress {
    return this.playerProgress;
  }

  public getAvailableQuests(): WorldQuest[] {
    return Array.from(this.activeQuests.values()).filter(quest => 
      quest.status === 'available' && this.checkQuestRequirements(quest)
    );
  }

  public getActiveQuests(): WorldQuest[] {
    return Array.from(this.activeQuests.values()).filter(quest => quest.status === 'active');
  }

  public getCompletedQuests(): WorldQuest[] {
    return Array.from(this.activeQuests.values()).filter(quest => quest.status === 'completed');
  }

  public getWorldMap(): WorldMap {
    return this.worldMap;
  }

  public destroy(): void {
    this.locations.clear();
    this.activeQuests.clear();
    this.npcInteractions.clear();
    this.shopInventories.clear();
  }
}

interface WorldMap {
  width: number;
  height: number;
  locations: WorldLocation[];
  connections: { from: string; to: string; distance: number }[];
}