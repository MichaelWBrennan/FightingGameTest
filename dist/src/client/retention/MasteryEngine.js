/**
 * MasteryEngine - Deterministic XP allocation and prestige logic
 *
 * Handles account mastery, character mastery, and archetype challenges.
 * All progression is power-neutral - only cosmetic rewards are granted.
 *
 * Usage:
 * const mastery = new MasteryEngine({
 *   retentionClient,
 *   saveCallback: (data) => localStorage.setItem('mastery', JSON.stringify(data))
 * });
 *
 * mastery.grantXP('account', 150, 'match_victory');
 * mastery.grantCharacterXP('grappler_a', 200, 'lab_completion');
 *
 * How to extend:
 * - Add new XP sources by extending XPSource enum
 * - Modify XP calculations in calculateXP() method
 * - Add new cosmetic reward types in CosmeticReward interface
 * - Customize prestige requirements in getPrestigeThreshold()
 */
import { EventEmitter } from 'eventemitter3';
export class MasteryEngine extends EventEmitter {
    constructor(config) {
        super();
        Object.defineProperty(this, "config", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "data", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "rewardTable", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: {}
        });
        Object.defineProperty(this, "archetypeChallenges", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        this.config = config;
        this.data = this.loadMasteryData();
        this.setupRewardTables();
        this.setupArchetypeChallenges();
    }
    /**
     * Grant account-level XP
     */
    grantAccountXP(amount, source, performanceTier) {
        const adjustedAmount = this.calculateXP(amount, source, performanceTier);
        const previousLevel = this.data.account.level;
        this.data.account.xp += adjustedAmount;
        this.data.account.totalXp += adjustedAmount;
        const newLevel = this.calculateLevel(this.data.account.xp);
        this.data.account.level = newLevel;
        // Check for level ups and prestige
        this.checkAccountLevelUp(previousLevel, newLevel);
        this.checkAccountPrestige();
        // Track progression event
        this.config.retentionClient.trackProgression({
            grantType: 'account_xp',
            amount: adjustedAmount,
            reason: source,
            previousLevel,
            newLevel,
            prestigeLevel: this.data.account.prestigeLevel
        });
        this.saveMasteryData();
        this.emit('account_xp_granted', { amount: adjustedAmount, newLevel, source });
    }
    /**
     * Grant character-specific XP
     */
    grantCharacterXP(characterId, amount, source, performanceTier) {
        if (!this.data.characters[characterId]) {
            this.initializeCharacter(characterId);
        }
        const adjustedAmount = this.calculateXP(amount, source, performanceTier);
        const character = this.data.characters[characterId];
        const previousLevel = character.level;
        character.xp += adjustedAmount;
        character.totalXp += adjustedAmount;
        const newLevel = this.calculateLevel(character.xp);
        character.level = newLevel;
        // Check for level ups and prestige
        this.checkCharacterLevelUp(characterId, previousLevel, newLevel);
        this.checkCharacterPrestige(characterId);
        // Track progression event
        this.config.retentionClient.trackProgression({
            grantType: 'character_xp',
            amount: adjustedAmount,
            reason: source,
            characterId,
            previousLevel,
            newLevel,
            prestigeLevel: character.prestigeLevel
        });
        this.saveMasteryData();
        this.emit('character_xp_granted', { characterId, amount: adjustedAmount, newLevel, source });
    }
    /**
     * Grant archetype mastery XP and update challenges
     */
    grantArchetypeXP(archetypeId, amount, source) {
        if (!this.data.archetypes[archetypeId]) {
            this.initializeArchetype(archetypeId);
        }
        const archetype = this.data.archetypes[archetypeId];
        const previousLevel = archetype.level;
        archetype.xp += amount;
        archetype.totalXp += amount;
        const newLevel = this.calculateLevel(archetype.xp);
        archetype.level = newLevel;
        // Update archetype challenges
        this.updateArchetypeChallenges(archetypeId, source, amount);
        // Check for level ups
        this.checkArchetypeLevelUp(archetypeId, previousLevel, newLevel);
        // Track progression event
        this.config.retentionClient.trackProgression({
            grantType: 'mastery_points',
            amount,
            reason: source,
            previousLevel,
            newLevel
        });
        this.saveMasteryData();
        this.emit('archetype_xp_granted', { archetypeId, amount, newLevel, source });
    }
    /**
     * Trigger prestige for account mastery
     */
    prestigeAccount() {
        if (!this.canPrestigeAccount()) {
            return false;
        }
        const currentLevel = this.data.account.level;
        this.data.account.prestigeLevel++;
        this.data.account.lastPrestigeXp = this.data.account.totalXp;
        this.data.account.xp = 0;
        this.data.account.level = 1;
        // Grant prestige rewards
        this.grantPrestigeRewards('account', this.data.account.prestigeLevel);
        // Track progression event
        this.config.retentionClient.trackProgression({
            grantType: 'achievement',
            amount: 1,
            reason: 'prestige',
            itemId: `account_prestige_${this.data.account.prestigeLevel}`,
            previousLevel: currentLevel,
            newLevel: 1,
            prestigeLevel: this.data.account.prestigeLevel
        });
        this.saveMasteryData();
        this.emit('account_prestige', { prestigeLevel: this.data.account.prestigeLevel });
        return true;
    }
    /**
     * Trigger prestige for character mastery
     */
    prestigeCharacter(characterId) {
        const character = this.data.characters[characterId];
        if (!character || !this.canPrestigeCharacter(characterId)) {
            return false;
        }
        const currentLevel = character.level;
        character.prestigeLevel++;
        character.lastPrestigeXp = character.totalXp;
        character.xp = 0;
        character.level = 1;
        // Grant prestige rewards
        this.grantPrestigeRewards('character', character.prestigeLevel, characterId);
        // Track progression event
        this.config.retentionClient.trackProgression({
            grantType: 'achievement',
            amount: 1,
            reason: 'prestige',
            characterId,
            itemId: `character_prestige_${character.prestigeLevel}`,
            previousLevel: currentLevel,
            newLevel: 1,
            prestigeLevel: character.prestigeLevel
        });
        this.saveMasteryData();
        this.emit('character_prestige', { characterId, prestigeLevel: character.prestigeLevel });
        return true;
    }
    /**
     * Get current mastery data (read-only)
     */
    getMasteryData() {
        return { ...this.data };
    }
    /**
     * Get rewards for a specific level and track type
     */
    getRewardsForLevel(trackType, level) {
        const rewards = this.rewardTable[trackType];
        return rewards?.find(r => r.level === level) || null;
    }
    /**
     * Check if account can prestige
     */
    canPrestigeAccount() {
        return this.data.account.level >= this.getPrestigeThreshold('account');
    }
    /**
     * Check if character can prestige
     */
    canPrestigeCharacter(characterId) {
        const character = this.data.characters[characterId];
        return character && character.level >= this.getPrestigeThreshold('character');
    }
    calculateXP(baseAmount, source, performanceTier) {
        let multiplier = 1.0;
        // Source-based multipliers
        switch (source) {
            case 'match_victory':
                multiplier = 1.5;
                break;
            case 'daily_objective':
                multiplier = 1.2;
                break;
            case 'weekly_objective':
                multiplier = 2.0;
                break;
            case 'lab_completion':
                multiplier = 1.3;
                break;
            case 'mentor_activity':
                multiplier = 1.4;
                break;
            case 'perfect_round':
                multiplier = 1.8;
                break;
            case 'first_time_bonus':
                multiplier = 3.0;
                break;
        }
        // Performance tier multipliers
        if (performanceTier) {
            switch (performanceTier) {
                case 'bronze':
                    multiplier *= 1.0;
                    break;
                case 'silver':
                    multiplier *= 1.1;
                    break;
                case 'gold':
                    multiplier *= 1.25;
                    break;
                case 'platinum':
                    multiplier *= 1.5;
                    break;
            }
        }
        return Math.floor(baseAmount * multiplier);
    }
    calculateLevel(xp) {
        // Quadratic XP curve: level = floor(sqrt(xp / 100)) + 1
        return Math.floor(Math.sqrt(xp / 100)) + 1;
    }
    getPrestigeThreshold(trackType) {
        // Account prestige at level 100, character prestige at level 50
        return trackType === 'account' ? 100 : 50;
    }
    checkAccountLevelUp(previousLevel, newLevel) {
        for (let level = previousLevel + 1; level <= newLevel; level++) {
            const rewards = this.getRewardsForLevel('account', level);
            if (rewards) {
                this.grantLevelRewards(rewards.rewards, level, 'account');
            }
        }
    }
    checkCharacterLevelUp(characterId, previousLevel, newLevel) {
        for (let level = previousLevel + 1; level <= newLevel; level++) {
            const rewards = this.getRewardsForLevel(characterId, level);
            if (rewards) {
                this.grantLevelRewards(rewards.rewards, level, 'character', characterId);
            }
        }
    }
    checkArchetypeLevelUp(archetypeId, previousLevel, newLevel) {
        for (let level = previousLevel + 1; level <= newLevel; level++) {
            const rewards = this.getRewardsForLevel(archetypeId, level);
            if (rewards) {
                this.grantLevelRewards(rewards.rewards, level, 'archetype', archetypeId);
            }
        }
    }
    checkAccountPrestige() {
        if (this.canPrestigeAccount() && !this.hasSeenPrestigePrompt('account')) {
            this.emit('prestige_available', { type: 'account' });
        }
    }
    checkCharacterPrestige(characterId) {
        if (this.canPrestigeCharacter(characterId) && !this.hasSeenPrestigePrompt('character', characterId)) {
            this.emit('prestige_available', { type: 'character', characterId });
        }
    }
    grantLevelRewards(rewards, level, trackType, trackId) {
        rewards.forEach(reward => {
            if (!this.data.unlockedRewards.includes(reward.id)) {
                this.data.unlockedRewards.push(reward.id);
                // Track unlock event
                this.config.retentionClient.trackProgression({
                    grantType: 'cosmetic_unlock',
                    amount: 1,
                    reason: 'match_participation', // Level-based unlock
                    itemId: reward.id,
                    characterId: trackId
                });
                this.emit('cosmetic_unlocked', { reward, level, trackType, trackId });
            }
        });
    }
    grantPrestigeRewards(trackType, prestigeLevel, characterId) {
        const prestigeReward = {
            id: `${trackType}_prestige_${prestigeLevel}_${characterId || 'global'}`,
            type: 'title',
            name: `Prestige ${prestigeLevel}`,
            description: `Achieved prestige level ${prestigeLevel} in ${trackType} mastery`,
            characterId,
            rarity: 'legendary'
        };
        this.data.unlockedRewards.push(prestigeReward.id);
        this.emit('cosmetic_unlocked', { reward: prestigeReward, prestige: true });
    }
    updateArchetypeChallenges(archetypeId, _source, amount) {
        const relevantChallenges = this.archetypeChallenges.filter(c => c.archetype === archetypeId);
        relevantChallenges.forEach(challenge => {
            const challengeData = this.data.archetypes[archetypeId].challenges[challenge.id];
            if (!challengeData.completed) {
                challengeData.progress += amount;
                if (challengeData.progress >= challenge.target) {
                    challengeData.completed = true;
                    challengeData.completedAt = Date.now();
                    // Grant challenge rewards
                    challenge.rewards.forEach(reward => {
                        if (!this.data.unlockedRewards.includes(reward.id)) {
                            this.data.unlockedRewards.push(reward.id);
                            this.config.retentionClient.trackProgression({
                                grantType: 'achievement',
                                amount: 1,
                                reason: 'match_participation',
                                itemId: reward.id
                            });
                            this.emit('challenge_completed', { challenge, reward });
                        }
                    });
                }
            }
        });
    }
    hasSeenPrestigePrompt(_type, _characterId) {
        // Implementation would track whether user has seen prestige prompt
        // This prevents spam notifications
        return false;
    }
    initializeCharacter(characterId) {
        this.data.characters[characterId] = {
            level: 1,
            xp: 0,
            totalXp: 0,
            prestigeLevel: 0,
            lastPrestigeXp: 0
        };
    }
    initializeArchetype(archetypeId) {
        this.data.archetypes[archetypeId] = {
            level: 1,
            xp: 0,
            totalXp: 0,
            challenges: {}
        };
        // Initialize challenge tracking
        this.archetypeChallenges
            .filter(c => c.archetype === archetypeId)
            .forEach(challenge => {
            this.data.archetypes[archetypeId].challenges[challenge.id] = {
                progress: 0,
                completed: false
            };
        });
    }
    loadMasteryData() {
        try {
            const loaded = this.config.loadCallback();
            if (loaded) {
                return loaded;
            }
        }
        catch (error) {
            console.warn('MasteryEngine: Failed to load data:', error);
        }
        // Return default data structure
        return {
            account: { level: 1, xp: 0, totalXp: 0, prestigeLevel: 0, lastPrestigeXp: 0 },
            characters: {},
            archetypes: {},
            unlockedRewards: [],
            lastUpdated: Date.now()
        };
    }
    saveMasteryData() {
        try {
            this.data.lastUpdated = Date.now();
            this.config.saveCallback(this.data);
        }
        catch (error) {
            console.warn('MasteryEngine: Failed to save data:', error);
        }
    }
    setupRewardTables() {
        // Example reward tables - in production these would be loaded from configuration
        this.rewardTable['account'] = [
            { level: 5, rewards: [{ id: 'title_novice', type: 'title', name: 'Novice Fighter', description: 'Reached account level 5', rarity: 'common' }] },
            { level: 10, rewards: [{ id: 'banner_bronze', type: 'banner', name: 'Bronze Banner', description: 'Reached account level 10', rarity: 'common' }] },
            { level: 25, rewards: [{ id: 'announcer_classic', type: 'announcer', name: 'Classic Announcer', description: 'Reached account level 25', rarity: 'rare' }] },
            { level: 50, rewards: [{ id: 'vfx_gold', type: 'vfx_palette', name: 'Golden Effects', description: 'Reached account level 50', rarity: 'epic' }] },
            { level: 100, rewards: [{ id: 'title_master', type: 'title', name: 'Fighting Master', description: 'Reached account level 100', rarity: 'legendary' }], isPrestigeUnlock: true }
        ];
    }
    setupArchetypeChallenges() {
        // Example archetype challenges
        this.archetypeChallenges = [
            {
                id: 'grappler_100_throws',
                name: 'Throw Master',
                description: 'Land 100 throws with grappler characters',
                archetype: 'grappler',
                target: 100,
                rewards: [{ id: 'title_throw_master', type: 'title', name: 'Throw Master', description: 'Mastered the art of grappling', rarity: 'rare' }]
            },
            {
                id: 'rushdown_50_combos',
                name: 'Combo Artist',
                description: 'Perform 50 extended combos with rushdown characters',
                archetype: 'rushdown',
                target: 50,
                rewards: [{ id: 'vfx_combo_sparks', type: 'vfx_palette', name: 'Combo Sparks', description: 'Flashy effects for combo masters', rarity: 'epic' }]
            }
        ];
    }
}
//# sourceMappingURL=MasteryEngine.js.map