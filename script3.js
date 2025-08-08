// --- POKEMON CLASS DEFINITION ---
class Pokemon {
    constructor(name, level, forcedVariant = null, baseData) {
        if (!baseData) {
            console.error("Base data missing for Pokemon constructor:", name);
            // Potentially throw an error or handle gracefully
            return; // Or throw new Error("Missing baseData");
        }

        let variant = forcedVariant;
        if (!variant && Math.random() < 0.008) { // Shiny chance
            variant = 'shiny';
        }

        this.id = Date.now() + Math.random().toString(36).substr(2, 9);
        this.name = name;
        this.variant = variant;
        this.displayName = (this.variant === 'dark' ? "Dark " : "") + (this.variant === 'shiny' ? "Shiny " : "") + this.name;
        this.level = level;
        this.xp = 0;
        this.maxXp = (this.name === "Pikachu" && this.level === 5) ? 65 : (50 + this.level * 20);

        // Calculate stats based on baseData and level
        const calculatedMaxHp = Math.floor(((2 * baseData.baseHp + 31 + (84 / 4)) * this.level) / 100 + this.level + 10);
        const calculateOtherStat = (baseStatValue) => {
            return Math.floor(((2 * baseStatValue + 31 + (84 / 4)) * this.level) / 100 + 5);
        };
        this.currentHp = calculatedMaxHp;
        this.maxHp = calculatedMaxHp;
        this.baseAttack = calculateOtherStat(baseData.baseAtk);
        this.baseDefense = calculateOtherStat(baseData.baseDef);
        this.baseSpAttack = calculateOtherStat(baseData.baseSpAtk);
        this.baseSpDefense = calculateOtherStat(baseData.baseSpDef);
        this.baseSpeed = calculateOtherStat(baseData.baseSpeed);

        this.attackStage = 0;
        this.defenseStage = 0;
        this.spAttackStage = 0;
        this.spDefenseStage = 0;
        this.speedStage = 0;

        // Actual stats (initialized from base, updated by stages)
        this.attack = this.baseAttack;
        this.defense = this.baseDefense;
        this.spAttack = this.baseSpAttack;
        this.spDefense = this.baseSpDefense;
        this.speed = this.baseSpeed;
        // Call updateBattleStats AFTER all base stats and stages are set.
        // updateBattleStats(this); // This was here, but better to call after constructor fully finishes.

        this.spriteChar = baseData.spriteChar;
        this.color = baseData.color;
        this.types = baseData.types;

        // Moves
        let currentMoves = [];
        const pokemonTypes = baseData.types.map(t => t.toLowerCase());
        if (this.name === "Kakuna" || this.name === "Metapod") {
            const hardenMove = getMoveByName("Harden");
            if (hardenMove && hardenMove.name !== "Struggle") { currentMoves = [hardenMove]; }
            else { console.warn(`${this.name} could not find "Harden" move. Giving Struggle.`); currentMoves = [getMoveByName("Struggle")];}
        } else {
            if (baseData.learnset) {
                let learnableMovesObjects = baseData.learnset.filter(entry => entry.level <= this.level).map(entry => getMoveByName(entry.moveName)).filter(moveObj => moveObj && moveObj.name !== "Struggle");
                learnableMovesObjects.sort((a, b) => { const isAType1 = pokemonTypes.includes(a.type.toLowerCase()); const isBType1 = pokemonTypes.includes(b.type.toLowerCase()); const isANormal = a.type.toLowerCase() === 'normal'; const isBNormal = b.type.toLowerCase() === 'normal'; const levelA = baseData.learnset.find(ls => ls.moveName.toLowerCase() === a.name.toLowerCase())?.level || 0; const levelB = baseData.learnset.find(ls => ls.moveName.toLowerCase() === b.name.toLowerCase())?.level || 0; if (isAType1 && !isBType1) return -1; if (!isAType1 && isBType1) return 1; if (isANormal && !isBNormal && !isBType1) return -1; if (!isANormal && isBNormal && !isAType1) return 1; return levelB - levelA; });
                let addedMoves = new Set();
                for (const moveObj of learnableMovesObjects) { if (currentMoves.length < 4 && !addedMoves.has(moveObj.name)) { currentMoves.push(moveObj); addedMoves.add(moveObj.name); } if (currentMoves.length >= 4) break; }
            }
            if (currentMoves.length === 0) {
                if (this.name === "Magikarp") { currentMoves.push(getMoveByName("Splash")); }
                else { currentMoves.push(getMoveByName("Tackle")); if (currentMoves.length < 4) currentMoves.push(getMoveByName("Growl")); }
            }
            currentMoves = [...new Map(currentMoves.map(item => [item["name"], item])).values()];
        }
        this.moves = currentMoves;

        // Roaming properties
        this.isRoaming = true;
        this.worldX = 0;
        this.worldY = 0;
        this.roamTargetWorldX = 0;
        this.roamTargetWorldY = 0;
        this.roamStepTimer = Math.random() * 2;
        this.roamStepsTaken = 0;
        this.roamMaxSteps = 3;
        this.roamSpeed = TILE_SIZE * 4.4;

        // Follower properties
        this.isFollowingPlayer = false;
        this.followerTargetX = 0;
        this.followerTargetY = 0;
        this.followerPath = [];
        this.followerPathIndex = 0;
        this.followerMaxPathLength = 30;
        this.followerFollowDistanceThreshold = TILE_SIZE * 1.5;
        this.followerCatchUpDistance = TILE_SIZE * 7;
        this.followerWarpDistance = TILE_SIZE * 15;
        this.followerSpeed = (typeof player !== 'undefined' && player.speed) ? player.speed * 0.85 : 120;

        // Battle/XP animation
        this.isBattleXpAnimating = false;
        this.levelsGainedSinceLastMoveLearnAttempt = 0;
        this.nextMoveLearnInterval = 5; // Initial interval
        this.moveLearnOpportunitiesHad = 0;

        this.applyVariantMods(); // Apply mods after creation
        updateBattleStats(this); // Ensure actual stats reflect base stats and stages.

        this.roamTargetWorldX = this.worldX; // Initialize roam target
        this.roamTargetWorldY = this.worldY;
    }

    applyVariantMods() {
        if (this.variant === 'shiny') {
            this.roamSpeed *= 1.5; // 50% faster roaming
        } else if (this.variant === 'dark') {
            this.roamSpeed *= 0.5; // 50% slower roaming
        }
    }

    async addXp(amount, isFromBattle = false) {
        if (amount <= 0) return;
        let initialMaxXpForLevelGainCalculation = this.maxXp;
        let remainingXpToAnimate = amount;
        const BATTLE_XP_ANIMATION_DURATION_PER_LEVEL = 2000;
        let actualLevelUpsThisCycle = 0;

        if (isFromBattle && (this === currentBattle?.playerPokemon) && playerBattlePokemonXpFill && playerBattlePokemonXpText) {
            this.isBattleXpAnimating = true;
            while (remainingXpToAnimate > 0 && GAME_STATE !== 'MOVE_LEARNING_PROMPT') {
                const xpToFillThisBar = this.maxXp - this.xp;
                const gainForThisIteration = Math.min(remainingXpToAnimate, xpToFillThisBar);
                const startFillPercent = (this.xp / this.maxXp) * 100;
                this.xp += gainForThisIteration;
                const endFillPercent = (this.xp / this.maxXp) * 100;
                playerBattlePokemonXpText.textContent = `${Math.floor(this.xp)}/${Math.floor(this.maxXp)}`;
                const animationDurationForSegment = BATTLE_XP_ANIMATION_DURATION_PER_LEVEL * (gainForThisIteration / this.maxXp);
                await animateXpBarFillBattle(this, startFillPercent, endFillPercent, Math.max(500, animationDurationForSegment));
                remainingXpToAnimate -= gainForThisIteration;

                if (this.xp >= this.maxXp) {
                    actualLevelUpsThisCycle++;
                    const oldLevel = this.level;
                    this.xp -= this.maxXp;
                    this.level++;
                    this.levelsGainedSinceLastMoveLearnAttempt++;
                    console.log(`Pokemon ${this.displayName} (Battle) just reached Lvl ${this.level} (was Lvl ${oldLevel}). Active tasks before checking for LEVEL_UP_EVENTS:`, JSON.parse(JSON.stringify(player.activeTasks)));
                    player.activeTasks.forEach(task => { if (task.taskDetails && task.taskDetails.type === "LEVEL_UP_EVENTS" && task.progress < task.taskDetails.targetCount) { task.progress++; console.log(`LEVEL_UP_EVENT Task Progress INCREMENTED (Battle): NPC: ${task.npcName}, Objective: "${task.taskDetails.objective}", New Progress: ${task.progress}/${task.taskDetails.targetCount}, Pokemon: ${this.displayName} Lvl ${this.level}`); showGeneralMessage(`Task Progress: Level-up event counted (${task.progress}/${task.taskDetails.targetCount})`); } });
                    const oldMaxHp = this.maxHp;
                    const newBaseDataForStats = POKEMON_DATA[this.name];
                    this.maxHp = Math.floor(((2 * newBaseDataForStats.baseHp + 31 + (84 / 4)) * this.level) / 100 + this.level + 10);
                    const calculateOtherStat = (baseStatValue) => { return Math.floor(((2 * baseStatValue + 31 + (84 / 4)) * this.level) / 100 + 5); };
                    this.baseAttack = calculateOtherStat(newBaseDataForStats.baseAtk); this.baseDefense = calculateOtherStat(newBaseDataForStats.baseDef); this.baseSpAttack = calculateOtherStat(newBaseDataForStats.baseSpAtk); this.baseSpDefense = calculateOtherStat(newBaseDataForStats.baseSpDef); this.baseSpeed = calculateOtherStat(newBaseDataForStats.baseSpeed);
                    updateBattleStats(this);
                    if (this.currentHp > 0) { const hpIncreaseFromStatGain = this.maxHp - oldMaxHp; this.currentHp += hpIncreaseFromStatGain; const bonusHeal = Math.floor(Math.random() * 4) + 2; this.currentHp += bonusHeal; if (this.currentHp > this.maxHp) { this.currentHp = this.maxHp; } }
                    this.maxXp = Math.floor(initialMaxXpForLevelGainCalculation * 1.2 + 20); initialMaxXpForLevelGainCalculation = this.maxXp; if (this.name === "Pikachu" && this.level === 5) this.maxXp = 65;
                    addBattleLog(`${this.displayName} grew to Level ${this.level}!`); showGeneralMessage(`${this.displayName} reached Level ${this.level}!`); updateBattleUI(); await new Promise(resolve => setTimeout(resolve, 1000));
                    if (GAME_STATE !== 'MOVE_LEARNING_PROMPT') { await checkAndLearnMove(this); }
                    if (GAME_STATE === 'MOVE_LEARNING_PROMPT') { remainingXpToAnimate = 0; break; }
                    if (remainingXpToAnimate > 0) { playerBattlePokemonXpFill.style.transition = 'none'; playerBattlePokemonXpFill.style.width = '0%'; void playerBattlePokemonXpFill.offsetWidth; playerBattlePokemonXpFill.style.transition = 'width 0.3s ease-out'; playerBattlePokemonXpText.textContent = `${Math.floor(this.xp)}/${Math.floor(this.maxXp)}`; }
                }
            }
            this.isBattleXpAnimating = false; updateBattleUI(); updatePokemonXpBar(); updateTeamPokemonStatusBars();
        } else { // Non-battle XP gain
            this.xp += amount;
            while (this.xp >= this.maxXp) {
                actualLevelUpsThisCycle++; const oldLevel = this.level; this.xp -= this.maxXp; this.level++; this.levelsGainedSinceLastMoveLearnAttempt++;
                console.log(`Pokemon ${this.displayName} (Non-Battle) just reached Lvl ${this.level} (was Lvl ${oldLevel}). Active tasks before checking for LEVEL_UP_EVENTS:`, JSON.parse(JSON.stringify(player.activeTasks)));
                player.activeTasks.forEach(task => { if (task.taskDetails && task.taskDetails.type === "LEVEL_UP_EVENTS" && task.progress < task.taskDetails.targetCount) { task.progress++; console.log(`LEVEL_UP_EVENT Task Progress INCREMENTED (Non-Battle): NPC: ${task.npcName}, Objective: "${task.taskDetails.objective}", New Progress: ${task.progress}/${task.taskDetails.targetCount}, Pokemon: ${this.displayName} Lvl ${this.level}`); showGeneralMessage(`Task Progress: Level-up event counted (${task.progress}/${task.taskDetails.targetCount})`); } });
                const oldMaxHp = this.maxHp; let currentMaxXpBeforeChange = this.maxXp; this.maxXp = Math.floor(currentMaxXpBeforeChange * 1.2 + 20); if (this.name === "Pikachu" && this.level === 5) this.maxXp = 65;
                const newBaseDataForStats = POKEMON_DATA[this.name]; this.maxHp = Math.floor(((2 * newBaseDataForStats.baseHp + 31 + (84 / 4)) * this.level) / 100 + this.level + 10); const calculateOtherStat = (baseStatValue) => { return Math.floor(((2 * baseStatValue + 31 + (84 / 4)) * this.level) / 100 + 5); };
                this.baseAttack = calculateOtherStat(newBaseDataForStats.baseAtk); this.baseDefense = calculateOtherStat(newBaseDataForStats.baseDef); this.baseSpAttack = calculateOtherStat(newBaseDataForStats.baseSpAtk); this.baseSpDefense = calculateOtherStat(newBaseDataForStats.baseSpDef); this.baseSpeed = calculateOtherStat(newBaseDataForStats.baseSpeed);
                updateBattleStats(this);
                if (this.currentHp > 0) { const hpIncreaseFromStatGain = this.maxHp - oldMaxHp; this.currentHp += hpIncreaseFromStatGain; const bonusHeal = Math.floor(Math.random() * 4) + 2; this.currentHp += bonusHeal; if (this.currentHp > this.maxHp) { this.currentHp = this.maxHp; } }
                showGeneralMessage(`${this.displayName} reached Level ${this.level}!`);
                if (GAME_STATE !== 'MOVE_LEARNING_PROMPT') { await checkAndLearnMove(this); }
                if (GAME_STATE === 'MOVE_LEARNING_PROMPT') break;
            }
            if (this === player.team[0]) { updatePokemonXpBar(); }
            updateTeamPokemonStatusBars();
        }
        if (actualLevelUpsThisCycle > 0 && GAME_STATE !== 'MOVE_LEARNING_PROMPT') { if (this.levelsGainedSinceLastMoveLearnAttempt >= this.nextMoveLearnInterval) { console.log(`${this.displayName} reached move learn interval. Levels gained since last: ${this.levelsGainedSinceLastMoveLearnAttempt}, Interval needed: ${this.nextMoveLearnInterval}`); /* await attemptToLearnNewMoveFromInterval(this); // This function needs to be defined globally or passed */ this.levelsGainedSinceLastMoveLearnAttempt = 0; this.moveLearnOpportunitiesHad++; this.nextMoveLearnInterval = 5 + (this.moveLearnOpportunitiesHad * 3); console.log(`${this.displayName} next move learn interval set to: ${this.nextMoveLearnInterval}`); } }
    }
}

// --- POKEMON CREATION & LOGIC ---
function createPokemon(name, level, forcedVariant = null) {
    const baseData = POKEMON_DATA[name];
    if (!baseData) {
        console.error("Unknown Pokemon type in createPokemon:", name);
        return null;
    }
    return new Pokemon(name, level, forcedVariant, baseData);
}



// Pokemon.addXp method (too long to inline here, will be placed in its logical group)
async function animateXpBarFillBattle(pokemon, startXpPercentage, endXpPercentage, durationMs) { if (!playerBattlePokemonXpFill) return; pokemon.isBattleXpAnimating = true; const startTime = performance.now(); return new Promise(resolve => { function animationStep(currentTime) { const elapsedTime = currentTime - startTime; const progress = Math.min(elapsedTime / durationMs, 1); const currentXpPercentage = startXpPercentage + (endXpPercentage - startXpPercentage) * progress; playerBattlePokemonXpFill.style.width = `${currentXpPercentage}%`; if (progress < 1) { requestAnimationFrame(animationStep); } else { playerBattlePokemonXpFill.style.width = `${endXpPercentage}%`; pokemon.isBattleXpAnimating = false; resolve(); } } requestAnimationFrame(animationStep); }); }
async function attemptToLearnMove(pokemon, moveEntry) { const moveObject = getMoveByName(moveEntry.moveName); if (!moveObject) { console.warn(`Move ${moveEntry.moveName} not found in ALL_MOVES.`); return false; } if (pokemon.moves.some(m => m.name === moveObject.name)) { return false; } if (pokemon.moves.length < 4) { pokemon.moves.push(moveObject); showGeneralMessage(`${pokemon.name} learned ${moveObject.name}!`); if (GAME_STATE === 'BATTLE') addBattleLog(`${pokemon.name} learned ${moveObject.name}!`); updatePokemonXpBar(); return true; } else { pokemonLearningMove = pokemon; newMoveToLearn = moveObject; moveLearningPrompt.active = true; moveLearningPrompt.text = [ `${pokemon.name} wants to learn ${newMoveToLearn.name}.`, `But ${pokemon.name} already knows 4 moves.`, "Choose a move to forget, or don't learn the new move." ]; moveLearningPrompt.options = []; pokemon.moves.forEach((currentMove, index) => { moveLearningPrompt.options.push({ text: `Forget ${currentMove.name}`, action: 'forget_move', indexToForget: index, color: "#6c757d" }); }); moveLearningPrompt.options.push({ text: `Don't learn ${newMoveToLearn.name}`, action: 'skip_learn', color: "#d9534f" }); previousGameState = GAME_STATE; GAME_STATE = 'MOVE_LEARNING_PROMPT'; if (previousGameState === 'BATTLE' || previousGameState === 'BATTLE_STARTING') { battleScreen.style.display = 'none'; } afterMoveLearnCallback = async () => { if (pokemonLearningMove) { await checkAndEvolvePokemon(pokemonLearningMove); } pokemonLearningMove = null; newMoveToLearn = null; afterMoveLearnCallback = null; }; return 'prompt_shown'; } }
async function checkAndLearnMove(pokemon) { const baseData = POKEMON_DATA[pokemon.name]; if (!baseData || !baseData.learnset) return; const learnableMovesAtCurrentLevel = baseData.learnset.filter(entry => entry.level === pokemon.level); for (const moveEntry of learnableMovesAtCurrentLevel) { const result = await attemptToLearnMove(pokemon, moveEntry); if (result === 'prompt_shown') { return; } } if (GAME_STATE !== 'MOVE_LEARNING_PROMPT') { await checkAndEvolvePokemon(pokemon); } }
async function checkAndEvolvePokemon(pokemon) { if (GAME_STATE === 'MOVE_LEARNING_PROMPT') return; const baseData = POKEMON_DATA[pokemon.name]; if (!baseData || !baseData.evolution) return; const evolutionInfo = baseData.evolution; if (pokemon.level >= evolutionInfo.evolutionLevel) { const evolvedToName = evolutionInfo.evolvesTo; const newBaseData = POKEMON_DATA[evolvedToName]; if (!newBaseData) { console.error(`Evolution target ${evolvedToName} not found in POKEMON_DATA.`); return; } const oldName = pokemon.name; showGeneralMessage(`What? ${oldName} is evolving!`); if (GAME_STATE === 'BATTLE') addBattleLog(`What? ${oldName} is evolving!`); if (GAME_STATE !== 'BATTLE') await new Promise(resolve => setTimeout(resolve, 2000)); pokemon.name = newBaseData.name; pokemon.spriteChar = newBaseData.spriteChar; pokemon.color = newBaseData.color; const oldMaxHp = pokemon.maxHp; pokemon.maxHp = Math.floor(newBaseData.baseHp * (1 + pokemon.level/20) + pokemon.level * 2); pokemon.currentHp += (pokemon.maxHp - oldMaxHp); if (pokemon.currentHp > pokemon.maxHp) pokemon.currentHp = pokemon.maxHp; if (pokemon.currentHp <=0 && oldMaxHp > 0) pokemon.currentHp = 1; pokemon.attack = Math.floor(newBaseData.baseAtk * (1 + pokemon.level/25) + pokemon.level); showGeneralMessage(`Congratulations! Your ${oldName} evolved into ${pokemon.name}!`); if (GAME_STATE === 'BATTLE') addBattleLog(`Congratulations! Your ${oldName} evolved into ${pokemon.name}!`); updatePokemonXpBar(); updateTeamPokemonStatusBars(); if (currentBattle && currentBattle.playerPokemon.id === pokemon.id) { updateBattleUI(); } const evolvedPokemonBaseData = POKEMON_DATA[pokemon.name]; if (evolvedPokemonBaseData && evolvedPokemonBaseData.learnset) { const movesUponEvolution = evolvedPokemonBaseData.learnset.filter(entry => entry.level === 1 || entry.level === pokemon.level); for (const moveEntry of movesUponEvolution) { const result = await attemptToLearnMove(pokemon, moveEntry); if (result === 'prompt_shown') { return; } } } } }
function applyStatChangesFromMove(move, attacker, target, isPlayerAttacker) { if (!move.stat_changes || !Array.isArray(move.stat_changes) || move.stat_changes.length === 0) { return; } move.stat_changes.forEach(changeEffect => { if (Math.random() > changeEffect.chance) { return; } let affectedPokemon; let affectedPokemonName; if (changeEffect.target === "user") { affectedPokemon = attacker; affectedPokemonName = attacker.name; } else { affectedPokemon = target; affectedPokemonName = target.name; } if (affectedPokemon === currentBattle.enemyPokemon && changeEffect.target !== "user") { affectedPokemonName = `Wild ${currentBattle.enemyPokemon.name}`; } else if (affectedPokemon === currentBattle.enemyPokemon && changeEffect.target === "user" && attacker === currentBattle.enemyPokemon) { affectedPokemonName = `Wild ${currentBattle.enemyPokemon.name}`; } let statToChange = ""; let statStageProp = ""; switch (changeEffect.stat) { case "attack": statToChange = "Attack"; statStageProp = "attackStage"; break; case "defense": statToChange = "Defense"; statStageProp = "defenseStage"; break; case "special-attack": statToChange = "Special Attack"; statStageProp = "spAttackStage"; break; case "special-defense": statToChange = "Special Defense"; statStageProp = "spDefenseStage"; break; case "speed": statToChange = "Speed"; statStageProp = "speedStage"; break; default: console.warn("Unknown stat in stat_changes:", changeEffect.stat); return; } if (!affectedPokemon || typeof affectedPokemon[statStageProp] === 'undefined') { console.error("Error: affectedPokemon or its stat stage property is undefined.", affectedPokemon, statStageProp); return; } const oldStage = affectedPokemon[statStageProp]; affectedPokemon[statStageProp] = Math.max(-6, Math.min(6, oldStage + changeEffect.change)); let statChangedActually = affectedPokemon[statStageProp] !== oldStage; let logMessage = ""; if (affectedPokemon[statStageProp] === oldStage && oldStage === 6 && changeEffect.change > 0) { logMessage = `${affectedPokemonName}'s ${statToChange} won't go any higher!`; statChangedActually = false; } else if (affectedPokemon[statStageProp] === oldStage && oldStage === -6 && changeEffect.change < 0) { logMessage = `${affectedPokemonName}'s ${statToChange} won't go any lower!`; statChangedActually = false; } else if (changeEffect.change > 0) { let amountText = (changeEffect.change === 1) ? "rose!" : (changeEffect.change === 2) ? "sharply rose!" : `rose by ${changeEffect.change}!`; logMessage = `${affectedPokemonName}'s ${statToChange} ${amountText}`; } else if (changeEffect.change < 0) { let amountText = (changeEffect.change === -1) ? "fell!" : (changeEffect.change === -2) ? "harshly fell!" : `fell by ${-changeEffect.change}!`; logMessage = `${affectedPokemonName}'s ${statToChange} ${amountText}`; } if (logMessage) { addBattleLog(logMessage); } if (statChangedActually) { let targetSpriteId = ""; if (affectedPokemon === currentBattle.playerPokemon) { targetSpriteId = "playerPokemonSprite"; } else if (affectedPokemon === currentBattle.enemyPokemon) { targetSpriteId = "enemySprite"; } if (targetSpriteId) { playSpriteAnimation(targetSpriteId, 'pokemon-sprite-stat-change', 400); } } updateBattleStats(affectedPokemon); }); }
function updateBattleStats(pokemon) { pokemon.attack = getStatWithStage(pokemon.baseAttack, pokemon.attackStage); pokemon.defense = getStatWithStage(pokemon.baseDefense, pokemon.defenseStage); pokemon.spAttack = getStatWithStage(pokemon.baseSpAttack, pokemon.spAttackStage); pokemon.spDefense = getStatWithStage(pokemon.baseSpDefense, pokemon.speedStage); pokemon.speed = getStatWithStage(pokemon.baseSpeed, pokemon.speedStage); pokemon.attack = Math.max(1, pokemon.attack); pokemon.defense = Math.max(1, pokemon.defense); pokemon.spAttack = Math.max(1, pokemon.spAttack); pokemon.spDefense = Math.max(1, pokemon.spDefense); pokemon.speed = Math.max(1, pokemon.speed); }

// --- SPRITE LOADING HELPER ---
async function getOrLoadPokemonSprite(pokemonName, spriteType, spriteUrl) {
    if (!pokemonName || !spriteType) return null; // Basic safety check

    if (!preloadedPokemonSprites[pokemonName]) {
        preloadedPokemonSprites[pokemonName] = {
            static_default: null, animated_default: null,
            static_shiny: null, animated_shiny: null,
        };
    }

    // If sprite is already an Image object, return it
    if (preloadedPokemonSprites[pokemonName][spriteType] instanceof Image) {
        return preloadedPokemonSprites[pokemonName][spriteType];
    }

    // If it previously failed or has no URL, don't try (unless 'failed' then maybe retry)
    if (preloadedPokemonSprites[pokemonName][spriteType] === 'failed' || !spriteUrl) {
        return null;
    }

    // If it's null (meaning not yet attempted or URL just became known), then load
    if (preloadedPokemonSprites[pokemonName][spriteType] === null) {
        // console.log(`On-demand loading: ${pokemonName} - ${spriteType} from ${spriteUrl}`);
        const loadedAsset = await preloadPokemonSprite(pokemonName, spriteUrl, spriteType);
        return (loadedAsset instanceof Image) ? loadedAsset : null;
    }
    return null; // Should ideally not be reached if logic is correct
}