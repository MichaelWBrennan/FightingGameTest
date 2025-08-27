import { Logger } from '../utils/Logger';
export class CombatSystem {
    constructor(app) {
        this.frameCounter = 0;
        this.hitstop = 0;
        this.app = app;
    }
    initialize(characterManager, inputManager) {
        this.characterManager = characterManager;
        this.inputManager = inputManager;
        Logger.info('Combat system initialized');
    }
    update(deltaTime) {
        if (this.hitstop > 0) {
            this.hitstop--;
            return; // Skip frame during hitstop
        }
        this.frameCounter++;
        this.processInputs();
        this.updateHitboxes();
        this.checkCollisions();
    }
    processInputs() {
        const activeCharacters = this.characterManager.getActiveCharacters();
        for (let i = 0; i < activeCharacters.length; i++) {
            const character = activeCharacters[i];
            const inputs = this.inputManager.getPlayerInputs(i);
            this.processCharacterInputs(character, inputs);
        }
    }
    processCharacterInputs(character, inputs) {
        if (character.state !== 'idle' && character.state !== 'walking') {
            return; // Character is in an active state
        }
        // Process movement
        if (inputs.left) {
            this.moveCharacter(character, -1);
        }
        else if (inputs.right) {
            this.moveCharacter(character, 1);
        }
        // Process attacks
        if (inputs.lightPunch) {
            this.executeMove(character, 'lightPunch');
        }
        else if (inputs.mediumPunch) {
            this.executeMove(character, 'mediumPunch');
        }
        else if (inputs.heavyPunch) {
            this.executeMove(character, 'heavyPunch');
        }
        // Process special moves (simplified motion detection)
        if (inputs.hadoken) {
            this.executeMove(character, 'hadoken');
        }
    }
    moveCharacter(character, direction) {
        const walkSpeed = character.config.stats.walkSpeed;
        const currentPos = character.entity.getPosition();
        currentPos.x += direction * walkSpeed * (1 / 60); // Assuming 60fps
        character.entity.setPosition(currentPos);
        character.state = 'walking';
    }
    executeMove(character, moveName) {
        const moveData = character.config.moves[moveName];
        if (!moveData) {
            Logger.warn(`Move not found: ${moveName} for character ${character.id}`);
            return;
        }
        character.currentMove = {
            name: moveName,
            data: moveData,
            currentFrame: 0,
            phase: 'startup'
        };
        character.state = 'attacking';
        character.frameData = {
            startup: moveData.startupFrames,
            active: moveData.activeFrames,
            recovery: moveData.recoveryFrames,
            advantage: moveData.advantage || 0
        };
        Logger.info(`${character.id} executing ${moveName}`);
    }
    updateHitboxes() {
        const activeCharacters = this.characterManager.getActiveCharacters();
        for (const character of activeCharacters) {
            if (character.currentMove) {
                this.updateMoveFrames(character);
            }
        }
    }
    updateMoveFrames(character) {
        if (!character.currentMove)
            return;
        character.currentMove.currentFrame++;
        const move = character.currentMove;
        const frameData = character.frameData;
        if (move.currentFrame <= frameData.startup) {
            move.phase = 'startup';
        }
        else if (move.currentFrame <= frameData.startup + frameData.active) {
            move.phase = 'active';
        }
        else if (move.currentFrame <= frameData.startup + frameData.active + frameData.recovery) {
            move.phase = 'recovery';
        }
        else {
            // Move finished
            character.currentMove = null;
            character.state = 'idle';
        }
    }
    checkCollisions() {
        const activeCharacters = this.characterManager.getActiveCharacters();
        if (activeCharacters.length !== 2)
            return;
        const [p1, p2] = activeCharacters;
        if (p1.currentMove?.phase === 'active' && this.charactersColliding(p1, p2)) {
            this.processHit(p1, p2);
        }
        else if (p2.currentMove?.phase === 'active' && this.charactersColliding(p2, p1)) {
            this.processHit(p2, p1);
        }
    }
    charactersColliding(attacker, defender) {
        const attackerPos = attacker.entity.getPosition();
        const defenderPos = defender.entity.getPosition();
        const distance = attackerPos.distance(defenderPos);
        // Simple collision detection - should be replaced with proper hitbox system
        return distance < 2.0;
    }
    processHit(attacker, defender) {
        if (!attacker.currentMove)
            return;
        const moveData = attacker.currentMove.data;
        const damage = moveData.damage;
        defender.health = Math.max(0, defender.health - damage);
        this.hitstop = Math.floor(damage / 10); // Hitstop based on damage
        Logger.info(`${attacker.id} hits ${defender.id} for ${damage} damage`);
        if (defender.health <= 0) {
            this.handleKO(defender, attacker);
        }
    }
    handleKO(ko, winner) {
        ko.state = 'ko';
        Logger.info(`${ko.id} is KO'd! ${winner.id} wins!`);
        // Trigger victory sequence
        this.app.fire('match:victory', winner.id);
    }
    getCurrentFrame() {
        return this.frameCounter;
    }
    isInHistop() {
        return this.hitstop > 0;
    }
}
//# sourceMappingURL=CombatSystem.js.map