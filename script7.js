// --- BATTLE SYSTEM FUNCTIONS --- (Order: Start, UI, Options, Actions, End)
// (Implementations for startBattle, updateBattleUI, createBattleOptions, playerAttack, enemyAttack, catch, run, endBattle)
// ... (These are very long and will be kept in their original relative order within this larger section) ...
async function startBattle(wildPkmn) {            
    previousGameState = GAME_STATE;
    GAME_STATE = 'BATTLE_STARTING';
    await screenFlash();
    GAME_STATE = 'BATTLE';
    player.isMoving = false;
    player.joystickActive = false;
    let startingPokemon = player.team.find(p => p.currentHp > 0);
    if (!startingPokemon) {
        if (player.team.length > 0) { startingPokemon = player.team[0]; }
        else {
            showGeneralMessage("You have no Pokemon to battle with!");
            // No currentBattle to pass outcome to, just transition out
            battleScreen.style.opacity = '0';
            await new Promise(resolve => setTimeout(resolve, 500));
            battleScreen.style.display = 'none';
            battleScreen.style.opacity = '1';
            GAME_STATE = previousGameState;
            return;
        }
    }

    playerPokemonSpriteEl.classList.remove('pokemon-sprite-fainted');
    playerPokemonSpriteEl.style.opacity = '1';
    playerPokemonSpriteEl.style.transform = '';

    enemySpriteEl.classList.remove('pokemon-sprite-fainted');
    enemySpriteEl.style.opacity = '1';
    enemySpriteEl.style.transform = '';

    [startingPokemon, wildPkmn].forEach(p => {
        if (p) {
            p.attackStage = 0; p.defenseStage = 0; p.spAttackStage = 0;
            p.spDefenseStage = 0; p.speedStage = 0;
            updateBattleStats(p);
        }
    });

    currentBattle = {
        playerPokemon: startingPokemon,
        enemyPokemon: wildPkmn,
        turn: 'PLAYER',
        gameOver: false,
        forceSwitch: false,
        showSwitchList: false,
        isEnding: false,
        outcome: {},
        participants: new Set()
    };
    currentBattle.participants.add(startingPokemon.id);
    battleLogContainer.innerHTML = '';
    battleScreen.style.opacity = '1';
    battleScreen.style.display = 'flex';

    addBattleLog(`A wild ${wildPkmn.displayName} (Lvl ${wildPkmn.level}) appeared!`);
    if (currentBattle.playerPokemon.currentHp <= 0) {
         addBattleLog(`${currentBattle.playerPokemon.name} is unable to battle!`);
         currentBattle.forceSwitch = true;
    } else { addBattleLog(`Go, ${currentBattle.playerPokemon.name}!`); }
    updateBattleUI();
    createBattleOptions();
    updateTeamPokemonStatusBars();}
async function updateBattleUI() { // Added async
    if (!currentBattle || !POKEMON_DATA) return;
    const pp = currentBattle.playerPokemon;
    const ep = currentBattle.enemyPokemon;

    // --- Player Pokemon UI ---
    if (pp) {
        const ppData = POKEMON_DATA[pp.name];
        const ppIsShiny = pp.variant === 'shiny';
        let ppSpriteToUse = null;

        if (ppData && ppData.sprites) {
            const urls = ppData.sprites;
            if (ppIsShiny) {
                if (urls.animated_shiny) ppSpriteToUse = await getOrLoadPokemonSprite(pp.name, 'animated_shiny', urls.animated_shiny);
                if (!(ppSpriteToUse instanceof Image) && urls.static_shiny) ppSpriteToUse = await getOrLoadPokemonSprite(pp.name, 'static_shiny', urls.static_shiny);
            }
            if (!(ppSpriteToUse instanceof Image) && urls.animated_default) ppSpriteToUse = await getOrLoadPokemonSprite(pp.name, 'animated_default', urls.animated_default);
            if (!(ppSpriteToUse instanceof Image) && urls.front_default) ppSpriteToUse = await getOrLoadPokemonSprite(pp.name, 'static_default', urls.front_default);
        }

        if (ppSpriteToUse instanceof Image) {
            playerPokemonSpriteEl.style.backgroundImage = `url('${ppSpriteToUse.src}')`;
            playerPokemonSpriteEl.textContent = '';
            playerPokemonSpriteEl.style.backgroundColor = 'transparent';
            const defaultAnimated = preloadedPokemonSprites[pp.name]?.animated_default;
            const defaultStatic = preloadedPokemonSprites[pp.name]?.static_default;
            if (ppIsShiny && (ppSpriteToUse === defaultAnimated || ppSpriteToUse === defaultStatic)) {
                playerPokemonSpriteEl.style.filter = 'brightness(1.2) saturate(1.2) hue-rotate(15deg)';
            } else {
                playerPokemonSpriteEl.style.filter = 'none';
            }
        } else {
            playerPokemonSpriteEl.style.backgroundImage = 'none';
            playerPokemonSpriteEl.style.filter = 'none';
            playerPokemonSpriteEl.textContent = ppData ? (ppData.spriteChar || 'P') : 'P';
            playerPokemonSpriteEl.style.backgroundColor = ppData ? (ppData.color || 'blue') : 'blue';
        }
        playerPokemonNameEl.textContent = pp.displayName;
        playerPokemonLevelEl.textContent = `Lvl: ${pp.level}`;
        playerPokemonHPBarFillEl.style.width = `${Math.max(0, (pp.currentHp / pp.maxHp) * 100)}%`;
        playerPokemonHPTextEl.textContent = `HP: ${Math.max(0, pp.currentHp)}/${pp.maxHp}`;
        if (playerBattlePokemonXpFill && playerBattlePokemonXpText) {
            playerBattlePokemonXpFill.style.width = `${Math.max(0, (pp.xp / pp.maxXp) * 100)}%`;
            playerBattlePokemonXpText.textContent = `${Math.floor(pp.xp)}/${Math.floor(pp.maxXp)}`;
        }
    } else { /* Your existing else block for no player Pokemon */
        playerPokemonSpriteEl.style.backgroundImage = 'none'; playerPokemonSpriteEl.textContent = 'P'; playerPokemonSpriteEl.style.backgroundColor = 'blue';
        playerPokemonNameEl.textContent = "PlayerMon"; playerPokemonLevelEl.textContent = "Lvl: ?";
        if(playerPokemonHPBarFillEl) playerPokemonHPBarFillEl.style.width = '0%'; playerPokemonHPTextEl.textContent = "HP: ?/?";
        if(playerBattlePokemonXpFill) playerBattlePokemonXpFill.style.width = '0%'; if(playerBattlePokemonXpText) playerBattlePokemonXpText.textContent = '0/0';
    }

    // --- Enemy Pokemon UI ---
    if (ep) {
        const epData = POKEMON_DATA[ep.name];
        const epIsShiny = ep.variant === 'shiny';
        let epSpriteToUse = null;

        if (epData && epData.sprites) {
            const urls = epData.sprites;
            if (epIsShiny) {
                if (urls.animated_shiny) epSpriteToUse = await getOrLoadPokemonSprite(ep.name, 'animated_shiny', urls.animated_shiny);
                if (!(epSpriteToUse instanceof Image) && urls.static_shiny) epSpriteToUse = await getOrLoadPokemonSprite(ep.name, 'static_shiny', urls.static_shiny);
            }
            if (!(epSpriteToUse instanceof Image) && urls.animated_default) epSpriteToUse = await getOrLoadPokemonSprite(ep.name, 'animated_default', urls.animated_default);
            if (!(epSpriteToUse instanceof Image) && urls.front_default) epSpriteToUse = await getOrLoadPokemonSprite(ep.name, 'static_default', urls.front_default);
        }

        if (epSpriteToUse instanceof Image) {
            enemySpriteEl.style.backgroundImage = `url('${epSpriteToUse.src}')`;
            enemySpriteEl.textContent = '';
            enemySpriteEl.style.backgroundColor = 'transparent';
            const defaultAnimated = preloadedPokemonSprites[ep.name]?.animated_default;
            const defaultStatic = preloadedPokemonSprites[ep.name]?.static_default;
            if (epIsShiny && (epSpriteToUse === defaultAnimated || epSpriteToUse === defaultStatic)) {
                enemySpriteEl.style.filter = 'brightness(1.2) saturate(1.2) hue-rotate(15deg)';
            } else {
                enemySpriteEl.style.filter = 'none';
            }
        } else {
            enemySpriteEl.style.backgroundImage = 'none';
            enemySpriteEl.style.filter = 'none';
            enemySpriteEl.textContent = epData ? (epData.spriteChar || '?') : '?';
            enemySpriteEl.style.backgroundColor = epData ? (epData.color || 'grey') : 'grey';
        }
        enemyNameEl.textContent = ep.displayName;
        enemyLevelEl.textContent = `Lvl: ${ep.level}`;
        enemyHPBarFillEl.style.width = `${Math.max(0, (ep.currentHp / ep.maxHp) * 100)}%`;
        enemyHPTextEl.textContent = `HP: ${Math.max(0, ep.currentHp)}/${ep.maxHp}`;
        if (ep.variant === 'dark') {
            enemySpriteEl.style.borderColor = '#FF4136';
            enemySpriteEl.style.boxShadow = '0 0 0 2px white';
            enemyNameEl.style.color = '#A00000';
            enemyNameEl.style.textShadow = '-1px -1px 0 #FFF, 1px -1px 0 #FFF, -1px 1px 0 #FFF, 1px 1px 0 #FFF';
        } else {
            enemySpriteEl.style.borderColor = 'white';
            enemySpriteEl.style.boxShadow = 'none';
            enemyNameEl.style.color = '';
            enemyNameEl.style.textShadow = 'none';
        }
    } else { /* Your existing else block for no enemy Pokemon */
        enemySpriteEl.style.backgroundImage = 'none'; enemySpriteEl.textContent = '?'; enemySpriteEl.style.backgroundColor = 'grey';
        enemyNameEl.textContent = "WildMon"; enemyLevelEl.textContent = "Lvl: ?";
        if(enemyHPBarFillEl) enemyHPBarFillEl.style.width = '0%'; enemyHPTextEl.textContent = "HP: ?/?";
        enemySpriteEl.style.borderColor = 'white'; enemySpriteEl.style.boxShadow = 'none'; enemyNameEl.style.color = ''; enemyNameEl.style.textShadow = 'none';
    }

    if (playerBoostIndicatorEl) {
        if (player.hasDarkAttackBoost) {
            playerBoostIndicatorEl.textContent = "Dark Attack Boost!";
            playerBoostIndicatorEl.style.color = '#FF69B4';
        } else {
            playerBoostIndicatorEl.textContent = "";
        }
    }
    updateTeamPokemonStatusBars();
}
function createBattleOptions() {            battleOptionsContainer.innerHTML = '';
    if (!currentBattle || currentBattle.isEnding) return; 

    if (currentBattle.forceSwitch) {
        const switchPrompt = document.createElement('p');
        switchPrompt.textContent = `${currentBattle.playerPokemon.name} fainted! Choose your next Pokemon:`;
        battleOptionsContainer.appendChild(switchPrompt);
        displayPokemonSwitchList(true);
        return;
    }
    if (currentBattle.showSwitchList) {
        const switchPrompt = document.createElement('p');
        switchPrompt.textContent = `Switch Pokemon: (Choose or Cancel)`;
        battleOptionsContainer.appendChild(switchPrompt);
        displayPokemonSwitchList(false);
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = "Cancel Switch";
        cancelBtn.onclick = () => {
            if (!currentBattle || currentBattle.isEnding) return;
            currentBattle.showSwitchList = false;
            createBattleOptions();
        };
        battleOptionsContainer.appendChild(cancelBtn);
        return;
    }
    if (currentBattle.gameOver && !currentBattle.isEnding) {
         const waitingText = document.createElement('p');
         waitingText.textContent = "Battle ending...";
         battleOptionsContainer.appendChild(waitingText);
         return;
    }


    if (currentBattle.turn === 'PLAYER' && !currentBattle.gameOver) {
        currentBattle.playerPokemon.moves.forEach(move => {
            const btn = document.createElement('button');
            btn.textContent = move.name;
            btn.onclick = () => playerAttack(move);
            battleOptionsContainer.appendChild(btn);
        });
        const switchBtn = document.createElement('button');
        switchBtn.textContent = 'Switch';
        switchBtn.onclick = initiateSwitchPokemon;
        const availableToSwitch = player.team.filter(p => p !== currentBattle.playerPokemon && p.currentHp > 0);
        if (availableToSwitch.length === 0 || player.team.length <= 1) {
            switchBtn.disabled = true;
        }
        battleOptionsContainer.appendChild(switchBtn);
        if (player.inventory.PokeBall > 0) {
            const catchBtn = document.createElement('button');
            catchBtn.textContent = `Catch (${player.inventory.PokeBall})`;
            catchBtn.onclick = playerCatchAttempt;
            battleOptionsContainer.appendChild(catchBtn);
        }
        if (player.inventory.MasterBall > 0) {
            const masterBtn = document.createElement('button');
            masterBtn.textContent = `Use Master Ball (${player.inventory.MasterBall})`;
            masterBtn.onclick = playerMasterBallAttempt;
            battleOptionsContainer.appendChild(masterBtn);
        }
        const runBtn = document.createElement('button');
        runBtn.textContent = 'Run';
        runBtn.onclick = playerRunAttempt;
        battleOptionsContainer.appendChild(runBtn);
    } else if (!currentBattle.gameOver) {
        const waitingText = document.createElement('p');
        waitingText.textContent = `${currentBattle.enemyPokemon.name} is thinking...`;
        battleOptionsContainer.appendChild(waitingText);
    }
}
async function playerAttack(move) {            if (!currentBattle || currentBattle.turn !== 'PLAYER' || currentBattle.gameOver || currentBattle.forceSwitch || currentBattle.showSwitchList || currentBattle.isEnding) return;
    battleOptionsContainer.querySelectorAll('button').forEach(b => b.disabled = true);
    addBattleLog(`${currentBattle.playerPokemon.displayName} used ${move.name}!`);

    applyStatChangesFromMove(move, currentBattle.playerPokemon, currentBattle.enemyPokemon, true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const enemyPokemonData = POKEMON_DATA[currentBattle.enemyPokemon.name];
    const defenderTypes = enemyPokemonData ? enemyPokemonData.types : [];
    const effectiveness = calculateTypeEffectiveness(move.type, defenderTypes);

    if (effectiveness === 0) {
        addBattleLog("It had no effect...");
    } else if (effectiveness > 1) {
        addBattleLog("It's super effective!");
    } else if (effectiveness < 1 && effectiveness > 0) {
        addBattleLog("It's not very effective...");
    }

    let attackerStat, defenderStat;
    if (move.type.toLowerCase() === "fire" || move.type.toLowerCase() === "water" || move.type.toLowerCase() === "grass" ||
        move.type.toLowerCase() === "electric" || move.type.toLowerCase() === "ice" || move.type.toLowerCase() === "psychic" ||
        move.type.toLowerCase() === "dragon" || move.type.toLowerCase() === "dark" || move.type.toLowerCase() === "fairy") {
        attackerStat = currentBattle.playerPokemon.spAttack;
        defenderStat = currentBattle.enemyPokemon.spDefense;
    } else {
        attackerStat = currentBattle.playerPokemon.attack;
        defenderStat = currentBattle.enemyPokemon.defense;
    }
    let damageMultiplierFromBoost = 1.0;
    if (player.hasDarkAttackBoost) {
        damageMultiplierFromBoost = 2.2;
    }

    let damage = 0;
    if (move.power > 0) {
        let baseDamage = Math.floor(
            ( ( (2 * currentBattle.playerPokemon.level / 5 + 4) * move.power * (attackerStat / defenderStat) ) / 50 ) + 4
        );
        damage = Math.floor(baseDamage * effectiveness * damageMultiplierFromBoost * (Math.random() * (1.00 - 0.85) + 0.85) );
    }
    damage = Math.max(effectiveness === 0 ? 0 : 1, damage);
    if(move.power === 0) damage = 0;

    currentBattle.enemyPokemon.currentHp = Math.max(0, currentBattle.enemyPokemon.currentHp - damage);
    if (effectiveness > 0 && move.power > 0) {
        addBattleLog(`Wild ${currentBattle.enemyPokemon.displayName} took ${damage} damage.`);
    }
     if (move.power > 0) { // Only apply stat changes if the move has power
         applyStatChangesFromMove(move, currentBattle.playerPokemon, currentBattle.enemyPokemon, true);
     }
    if (damage > 0 && move.power > 0) {
        playSpriteAnimation('enemySprite', 'pokemon-sprite-hit', 400);
    }
    updateBattleUI();
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (currentBattle.enemyPokemon.currentHp <= 0) {
        playFaintAnimation(enemySpriteEl);
        await new Promise(resolve => setTimeout(resolve, 700));
        const defeatedEnemy = currentBattle.enemyPokemon;
        addBattleLog(`Wild ${currentBattle.enemyPokemon.displayName} fainted!`);

        // --- XP DISTRIBUTION ---
        const totalXpGainFromDefeat = (POKEMON_DATA[defeatedEnemy.name]?.xpYield || 50) + defeatedEnemy.level * 5;
        const roundedTotalXpGain = Math.floor(totalXpGainFromDefeat);

        // Player (trainer) still gets their XP
        player.addXp(roundedTotalXpGain);
        addBattleLog(`Player earned ${roundedTotalXpGain} XP!`);

        const participantsInThisFight = Array.from(currentBattle.participants);
        // const numParticipants = participantsInThisFight.length; // OLD WAY

        // ---- START REPLACEMENT ----
        // Identify SURVIVING participants
        const survivingParticipants = [];
        for (const participantId of participantsInThisFight) { // Iterate through IDs of all who ever participated
            const pkmn = player.team.find(p => p.id === participantId);
            if (pkmn && pkmn.currentHp > 0) { // Check if they are currently conscious
                survivingParticipants.push(pkmn);
            }
        }
        const numSurvivingParticipants = survivingParticipants.length; // This is the new divisor
        // ---- END REPLACEMENT ----


        if (numSurvivingParticipants > 0 && roundedTotalXpGain > 0) {
            const xpPerParticipant = Math.floor(roundedTotalXpGain / numSurvivingParticipants); // Divide by SURVIVORS
            if (xpPerParticipant > 0) {
                addBattleLog(`XP will be shared among ${numSurvivingParticipants} conscious participant(s).`);
                // Iterate through the already filtered list of survivors
                for (const participatingPokemon of survivingParticipants) {
                    // No need to check currentHp > 0 again, as they are already filtered
                    await participatingPokemon.addXp(xpPerParticipant, true);
                    addBattleLog(`${participatingPokemon.displayName} gained ${xpPerParticipant} XP!`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
        } else if (roundedTotalXpGain > 0) { // If trainer got XP but no Pokemon did
                addBattleLog("No conscious Pokémon participated to share battle XP.");
        }
        // --- END XP DISTRIBUTION ---

        // Task progress for DEFEAT tasks (as corrected before)
        player.activeTasks.forEach(task => {
            if (task.taskDetails) {
                if (task.taskDetails.type === "DEFEAT_ANY" && task.progress < task.taskDetails.targetCount) {
                    task.progress++;
                    console.log(`DEFEAT_ANY Task Progress INCREMENTED: NPC: ${task.npcName}, Objective: "${task.taskDetails.objective}", New Progress: ${task.progress}/${task.taskDetails.targetCount}, Defeated: ${defeatedEnemy.displayName}`);
                    showGeneralMessage(`Task Progress: Defeated Pokemon (${task.progress}/${task.taskDetails.targetCount})`);
                } else if (task.taskDetails.type === "DEFEAT_SPECIFIC" &&
                        task.progress < task.taskDetails.targetCount &&
                        defeatedEnemy.name.toLowerCase() === task.taskDetails.targetPokemonName.toLowerCase()) {
                    task.progress++;
                    console.log(`DEFEAT_SPECIFIC Task Progress INCREMENTED: NPC: ${task.npcName}, Objective: "${task.taskDetails.objective}", New Progress: ${task.progress}/${task.taskDetails.targetCount}, Defeated: ${defeatedEnemy.displayName}`);
                    showGeneralMessage(`Task Progress: Defeated ${defeatedEnemy.name} (${task.progress}/${task.taskDetails.targetCount})`);
                }
            }
        });
        updateGuidingArrowState();
        wildPokemon = wildPokemon.filter(p => p !== defeatedEnemy);

        currentBattle.gameOver = true;
        currentBattle.outcome = { playerWon: true };

        if (GAME_STATE !== 'MOVE_LEARNING_PROMPT' && currentBattle && !currentBattle.isEnding) {
            endBattle(currentBattle.outcome);
        }
        return;
    }

    currentBattle.turn = 'ENEMY';
    createBattleOptions();
    await new Promise(resolve => setTimeout(resolve, 1000));
    if (!currentBattle.gameOver && !currentBattle.isEnding) {
        enemyAttack();
    }
}
async function enemyAttack() {            if (!currentBattle || currentBattle.turn !== 'ENEMY' || currentBattle.gameOver || currentBattle.forceSwitch || currentBattle.showSwitchList || currentBattle.isEnding) return;
    const enemyMove = currentBattle.enemyPokemon.moves[Math.floor(Math.random() * currentBattle.enemyPokemon.moves.length)];
    addBattleLog(`${currentBattle.enemyPokemon.displayName} used ${enemyMove.name}!`);

    applyStatChangesFromMove(enemyMove, currentBattle.enemyPokemon, currentBattle.playerPokemon, false);
    await new Promise(resolve => setTimeout(resolve, 500));

    const defenderTypes = currentBattle.playerPokemon.types ? currentBattle.playerPokemon.types : [];
    const effectiveness = calculateTypeEffectiveness(enemyMove.type, defenderTypes);

    if (effectiveness === 0) addBattleLog("It had no effect...");
    else if (effectiveness > 1) addBattleLog("It's super effective!");
    else if (effectiveness < 1 && effectiveness > 0) addBattleLog("It's not very effective...");

    let attackerStat, defenderStat;
     if (enemyMove.type.toLowerCase() === "fire" || enemyMove.type.toLowerCase() === "water" || enemyMove.type.toLowerCase() === "grass" ||
        enemyMove.type.toLowerCase() === "electric" || enemyMove.type.toLowerCase() === "ice" || enemyMove.type.toLowerCase() === "psychic" ||
        enemyMove.type.toLowerCase() === "dragon" || enemyMove.type.toLowerCase() === "dark" || enemyMove.type.toLowerCase() === "fairy") {
        attackerStat = currentBattle.enemyPokemon.spAttack;
        defenderStat = currentBattle.playerPokemon.spDefense;
    } else {
        attackerStat = currentBattle.enemyPokemon.attack;
        defenderStat = currentBattle.playerPokemon.defense;
    }
    let damage = 0;
    if (enemyMove.power > 0) {
        let baseDamage = Math.floor( ( ( (2 * currentBattle.enemyPokemon.level / 5 + 2) * enemyMove.power * (attackerStat / defenderStat) ) / 50 ) + 2 );
        damage = Math.floor(baseDamage * effectiveness * (Math.random() * (1.00 - 0.85) + 0.85) );
    }
    damage = Math.max(effectiveness === 0 ? 0 : 1, damage);
    if(enemyMove.power === 0) damage = 0;

    currentBattle.playerPokemon.currentHp = Math.max(0, currentBattle.playerPokemon.currentHp - damage);
    if (effectiveness > 0 && enemyMove.power > 0) addBattleLog(`${currentBattle.playerPokemon.displayName} took ${damage} damage.`);
    if (enemyMove.power > 0) applyStatChangesFromMove(enemyMove, currentBattle.enemyPokemon, currentBattle.playerPokemon, false);
    if (damage > 0 && enemyMove.power > 0) playSpriteAnimation('playerPokemonSprite', 'pokemon-sprite-hit', 400);
    updateBattleUI();
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (currentBattle.playerPokemon.currentHp <= 0) {
        playFaintAnimation(playerPokemonSpriteEl);
        await new Promise(resolve => setTimeout(resolve, 700));
        addBattleLog(`${currentBattle.playerPokemon.displayName} fainted!`);
        updateTeamPokemonStatusBars();
        const oldDarkBoostStatus = player.hasDarkAttackBoost;
        player.hasDarkAttackBoost = player.team.some(p => p.variant === 'dark' && p.currentHp > 0);
        if (oldDarkBoostStatus && !player.hasDarkAttackBoost) showGeneralMessage("Dark Attack Boost lost!");

        const ablePokemon = player.team.filter(p => p.currentHp > 0 && p !== currentBattle.playerPokemon);
        if (ablePokemon.length > 0) {
            currentBattle.forceSwitch = true;
            createBattleOptions();
            return;
        } else {
            addBattleLog(`Player is out of usable Pokemon!`);
            currentBattle.gameOver = true;
            currentBattle.outcome = { playerWon: false };
            if (currentBattle && !currentBattle.isEnding) {
               endBattle(currentBattle.outcome);
            }
            return;
        }
    }
    currentBattle.turn = 'PLAYER';
    createBattleOptions();
}
async function playerCatchAttempt() {            if (!currentBattle || currentBattle.turn !== 'PLAYER' || currentBattle.gameOver || player.inventory.PokeBall <= 0 || currentBattle.forceSwitch || currentBattle.showSwitchList || currentBattle.isEnding) return;
    player.inventory.PokeBall--;
    addBattleLog(`${player.team[0].name} used a PokeBall! (Remaining: ${player.inventory.PokeBall})`);
    battleOptionsContainer.querySelectorAll('button').forEach(b => b.disabled = true);
    let catchRate = 0.10;
    const hpPercent = currentBattle.enemyPokemon.currentHp / currentBattle.enemyPokemon.maxHp;
    if (hpPercent <= 0.05) catchRate = 0.99;
    else if (hpPercent < 0.25) catchRate = 0.85;
    else if (hpPercent <= 0.50) catchRate = 0.65;
    await new Promise(resolve => setTimeout(resolve, 1500));

    if (Math.random() < catchRate) {
        addBattleLog(`Gotcha! ${currentBattle.enemyPokemon.displayName} was caught!`);
        const caughtPokemon = currentBattle.enemyPokemon;
        caughtPokemon.isRoaming = false;
        // --- XP FOR CATCHING ---
        const caughtPkmnBaseData = POKEMON_DATA[caughtPokemon.name];
        let xpFromCatch = Math.floor(
            (caughtPkmnBaseData?.xpYield || 30) / 2.5 + // Base XP from species (reduced share for catch)
            caughtPokemon.level * 2.5 +              // Bonus for level
            (caughtPokemon.maxHp / 12)                // Bonus for "bulk" / overall strength
        );
        xpFromCatch = Math.max(15, Math.floor(xpFromCatch)); // Minimum XP for a catch, ensure integer

        if (currentBattle.playerPokemon && currentBattle.playerPokemon.currentHp > 0) {
            addBattleLog(`${currentBattle.playerPokemon.displayName} gained ${xpFromCatch} XP for the successful catch!`);
            // The 'true' flag ensures battle UI animation if it's the active Pokémon
            await currentBattle.playerPokemon.addXp(xpFromCatch, true);
            await new Promise(resolve => setTimeout(resolve, 500)); // Delay for message
        } else {
            // If active Pokémon fainted, player (trainer) gets the XP
            player.addXp(xpFromCatch);
            addBattleLog(`Player gained an extra ${xpFromCatch} XP for the catch!`);
        }
        // --- END XP FOR CATCHING ---
        player.activeTasks.forEach(task => {
            if (task.taskDetails && task.taskDetails.type === "CAPTURE_POKEMON" &&
                task.progress < task.taskDetails.targetCount &&
                caughtPokemon.level >= (task.taskDetails.minLevelRequirement || 0) ) { // Added default for minLevelRequirement
                task.progress++;
                // DETAILED CONSOLE LOG
                console.log(`TASK PROGRESS (CAPTURE_POKEMON): NPC: ${task.npcName} (ID: ${task.npcId}), Objective: "${task.taskDetails.objective}", Caught: ${caughtPokemon.name} Lvl ${caughtPokemon.level}, Progress: ${task.progress}/${task.taskDetails.targetCount}`);
                showGeneralMessage(`Task Progress: Captured Lv.${caughtPokemon.level} ${caughtPokemon.name} (${task.progress}/${task.taskDetails.targetCount})`);
            }
        });
        updateGuidingArrowState();
        if (player.team.length < 6) player.team.push(caughtPokemon);
        else player.storedPokemon.push(caughtPokemon);
        if (player.team.includes(caughtPokemon) || player.storedPokemon.includes(caughtPokemon)) { /* ... boost logic ... */ }
        updateTeamPokemonStatusBars();
        wildPokemon = wildPokemon.filter(p => p !== caughtPokemon);
        currentBattle.gameOver = true;
        currentBattle.outcome = { caughtPokemon: true };
        if (currentBattle && !currentBattle.isEnding) {
            endBattle(currentBattle.outcome);
        }
        return;
    } else {
        addBattleLog("Oh no! The Pokemon broke free!");
        currentBattle.turn = 'ENEMY';
        // await new Promise(resolve => setTimeout(resolve, 1500)); // This delay is already part of the outer structure
        createBattleOptions();
        if(currentBattle.turn === 'ENEMY' && !currentBattle.gameOver && !currentBattle.isEnding) enemyAttack();
    }
}
async function playerMasterBallAttempt() {            if (!currentBattle || currentBattle.turn !== 'PLAYER' || currentBattle.gameOver || player.inventory.MasterBall <= 0 || currentBattle.forceSwitch || currentBattle.showSwitchList || currentBattle.isEnding) return;
    const mewtwoGameName = POKEMON_NAMES[149]; 
    if (currentBattle.enemyPokemon.name !== mewtwoGameName) {
        addBattleLog("There's still a Pokemon out there that I MUST use this on, I can't waste it here!");
        createBattleOptions();
        return;
    }
    player.inventory.MasterBall--;
    addBattleLog(`${player.team[0].name} used the Master Ball! (Remaining: ${player.inventory.MasterBall})`);
    battleOptionsContainer.querySelectorAll('button').forEach(b => b.disabled = true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    addBattleLog(`Gotcha! ${currentBattle.enemyPokemon.name} was caught with the Master Ball!`);
    const caughtPokemon = currentBattle.enemyPokemon; 
    caughtPokemon.isRoaming = false;
    player.activeTasks.forEach(task => {
        if (task.taskDetails && task.taskDetails.type === "CAPTURE_POKEMON" &&
            task.progress < task.taskDetails.targetCount &&
            caughtPokemon.level >= task.taskDetails.minLevelRequirement) {
            task.progress++;
             showGeneralMessage(`Task Progress: Captured Lv.${caughtPokemon.level} ${caughtPokemon.name} (${task.progress}/${task.taskDetails.targetCount})`);
        }
    });
    if (player.team.length < 6) player.team.push(caughtPokemon);
    else player.storedPokemon.push(caughtPokemon);
    if (player.team.includes(caughtPokemon)) { // Only apply boost if it's in the active team
            if (caughtPokemon.variant === 'shiny' && !player.hasShinySpeedBoost) {
                player.hasShinySpeedBoost = true;
                player.updateEffectiveSpeed(); // Recalculate player's speed
                showGeneralMessage("Your movement speed increased thanks to the Shiny Pokémon!");
            } else if (caughtPokemon.variant === 'dark' && !player.hasDarkAttackBoost) {
                player.hasDarkAttackBoost = true;
                showGeneralMessage("Your team's attacks feel stronger with the Dark Pokémon!");
            }
    }
    
    updateTeamPokemonStatusBars();
    wildPokemon = wildPokemon.filter(p => p !== caughtPokemon);
    currentBattle.gameOver = true;
    currentBattle.outcome = { caughtPokemon: true, usedMasterBall: true };
    if (currentBattle && !currentBattle.isEnding) {
       endBattle(currentBattle.outcome);
    }
    return;
}
async function playerRunAttempt() {            if (!currentBattle || currentBattle.turn !== 'PLAYER' || currentBattle.gameOver || currentBattle.forceSwitch || currentBattle.showSwitchList || currentBattle.isEnding) return;
    addBattleLog("Player attempts to run...");
    battleOptionsContainer.querySelectorAll('button').forEach(b => b.disabled = true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    addBattleLog("Got away safely!");
    if (currentBattle && currentBattle.enemyPokemon) {
         wildPokemon = wildPokemon.filter(p => p !== currentBattle.enemyPokemon);
    }
    currentBattle.gameOver = true; // Mark as over
    currentBattle.outcome = { ranAway: true }; // Set the outcome
    await new Promise(resolve => setTimeout(resolve, 1000)); // Keep this delay for message
    if (currentBattle && !currentBattle.isEnding) { // Check if already ending
        endBattle(currentBattle.outcome); // Call with the outcome
    }
}
function initiateSwitchPokemon() {            if (!currentBattle || currentBattle.turn !== 'PLAYER' || currentBattle.gameOver || currentBattle.isEnding) return;
    const availableToSwitch = player.team.filter(p => p !== currentBattle.playerPokemon && p.currentHp > 0);
    if (availableToSwitch.length === 0) {
        addBattleLog("No other Pokemon to switch to!");
        return;
    }
    currentBattle.showSwitchList = true;
    createBattleOptions();
}
async function executeSwitchPokemon(newPokemon, isForcedSwitch) {            
    if (!currentBattle || currentBattle.gameOver || !newPokemon || newPokemon.currentHp 
<= 0 || currentBattle.isEnding) return;
    
    newPokemon.attackStage = 0;
    newPokemon.defenseStage = 0;
    newPokemon.spAttackStage = 0;
    newPokemon.spDefenseStage = 0;
    newPokemon.speedStage = 0;
    updateBattleStats(newPokemon);

    const oldPokemon = currentBattle.playerPokemon;
    currentBattle.playerPokemon = newPokemon;

    if (currentBattle && !currentBattle.gameOver) { // Ensure battle is still active
        currentBattle.participants.add(newPokemon.id);
    }

    playerPokemonSpriteEl.classList.remove('pokemon-sprite-fainted');
    playerPokemonSpriteEl.style.opacity = '1';
    playerPokemonSpriteEl.style.transform = '';

    const oldDarkBoostStatus = player.hasDarkAttackBoost;
    player.hasDarkAttackBoost = player.team.some(p => p.variant === 'dark' && p.currentHp > 0);
    if (player.hasDarkAttackBoost && !oldDarkBoostStatus) {
        showGeneralMessage("Dark Attack Boost active!");
    } else if (!player.hasDarkAttackBoost && oldDarkBoostStatus) {
        showGeneralMessage("Dark Attack Boost lost!");
    }
    currentBattle.showSwitchList = false;
    currentBattle.forceSwitch = false;
    if (!isForcedSwitch) {
        addBattleLog(`Player withdrew ${oldPokemon.name}.`);
    }
    addBattleLog(`Go, ${newPokemon.name}!`);
    updateBattleUI();
    updatePokemonXpBar();
    if (!isForcedSwitch) {
        currentBattle.turn = 'ENEMY';
        createBattleOptions();
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (!currentBattle.gameOver && !currentBattle.isEnding) {
            enemyAttack();
        }
    } else {
        currentBattle.turn = 'PLAYER';
        createBattleOptions();
    }
}
function displayPokemonSwitchList(isForcedSwitch) {            const availablePokemon = player.team.filter(p => p.currentHp > 0 && (isForcedSwitch || p !== currentBattle.playerPokemon));
    if (availablePokemon.length === 0 && isForcedSwitch) {
        addBattleLog("No other Pokemon can fight!");
        currentBattle.gameOver = true;
        currentBattle.forceSwitch = false;
        currentBattle.outcome = { playerWon: false };
        if (currentBattle && !currentBattle.isEnding) {
            endBattle(currentBattle.outcome);
        }
        return;
    }
    availablePokemon.forEach(pkmn => {
        const btn = document.createElement('button');
        btn.textContent = `${pkmn.name} (Lvl ${pkmn.level}, HP: ${pkmn.currentHp}/${pkmn.maxHp})`;
        btn.onclick = () => executeSwitchPokemon(pkmn, isForcedSwitch);
        battleOptionsContainer.appendChild(btn);
    });
}
async function endBattle(outcomeDetails = {}) {            const BATTLE_END_FADE_DURATION_MS = 500;
    const BATTLE_END_POST_FADE_DELAY_MS = 1500;

    if (!currentBattle || currentBattle.isEnding) return;
    currentBattle.isEnding = true;
    currentBattle.gameOver = true;
    battleOptionsContainer.innerHTML = '';

    battleScreen.style.opacity = '0';
    await new Promise(resolve => setTimeout(resolve, BATTLE_END_FADE_DURATION_MS));

    if (outcomeDetails.ranAway) {
        showGeneralMessage("Escaped Safely!");
    } else if (outcomeDetails.caughtPokemon) {
        // Catch messages handled by catch functions
    } else if (outcomeDetails.playerWon) {
        showGeneralMessage("You won the battle!");
    } else if (outcomeDetails.playerWon === false) {
        showGeneralMessage("You were defeated...");
    }

    await new Promise(resolve => setTimeout(resolve, Math.max(0, BATTLE_END_POST_FADE_DELAY_MS - BATTLE_END_FADE_DURATION_MS)));

    if (GAME_STATE === 'MOVE_LEARNING_PROMPT') {
        console.log("Battle end sequence PAUSED for move learning (from endBattle).");
        currentBattle.isEnding = false;
        return;
    }

    battleScreen.style.display = 'none';
    battleScreen.style.opacity = '1';
    const originalTransition = battleScreen.style.transition;
    battleScreen.style.transition = 'none';
    requestAnimationFrame(() => {
        battleScreen.style.transition = originalTransition || 'opacity 0.5s ease-out';
    });

    let finalGameState = previousGameState;
    if (outcomeDetails.playerWon === false && !outcomeDetails.ranAway && !outcomeDetails.caughtPokemon) {
        await screenFlash();
        player.team.forEach(p => { if (p) p.currentHp = p.maxHp; });
        player.worldX = playerHouse.worldX;
        player.worldY = playerHouse.worldY + playerHouse.collisionHeight / 2 + TILE_SIZE * 0.5;
        let safeSpawn = findWalkableSpawn(player.worldX, player.worldY, 5);
        player.worldX = safeSpawn.x;
        player.worldY = safeSpawn.y;
        finalGameState = 'ROAMING';
        previousGameState = 'ROAMING';
        camera.update();
        showGeneralMessage("You scurried back to safety...");
        const activeFollower = player.team.find(p => p.isFollowingPlayer && p.currentHp > 0);
        if (activeFollower) {
            const angleBehindPlayer = (player.lastAngle || -Math.PI / 2) + Math.PI;
            activeFollower.worldX = player.worldX + Math.cos(angleBehindPlayer) * TILE_SIZE * 0.75;
            activeFollower.worldY = player.worldY + Math.sin(angleBehindPlayer) * TILE_SIZE * 0.75;
            activeFollower.followerPath = [{ x: player.worldX, y: player.worldY }];
        }
    }
    
    GAME_STATE = finalGameState;

    playerPokemonSpriteEl.classList.remove('pokemon-sprite-fainted');
    playerPokemonSpriteEl.style.transform = '';
    enemySpriteEl.classList.remove('pokemon-sprite-fainted');
    enemySpriteEl.style.transform = '';

    currentBattle = null;
    updatePokemonXpBar();
    updatePlayerXpBar();
    updateTeamPokemonStatusBars();
    player.npcInteractionCooldownEnd = Date.now() + 500;
    updateGuidingArrowState();
    manageWorldPokeBalls();
}
function addBattleLog(message) { if (GAME_STATE === 'BATTLE' || GAME_STATE === 'BATTLE_STARTING') { const logEntry = document.createElement('div'); logEntry.textContent = message; battleLogContainer.appendChild(logEntry); battleLogContainer.scrollTop = battleLogContainer.scrollHeight;} else { console.log("BLog (Not in Battle):", message);}}
function playSpriteAnimation(spriteElementId, animationClass, duration = 400) { const spriteEl = document.getElementById(spriteElementId); if (spriteEl) { const originalTransform = spriteEl.style.transform; if (animationClass.includes('shake')) { let currentTranslateY = ""; if (spriteElementId === 'enemySprite' && currentBattle && currentBattle.enemyPokemon) { /* CSS var logic */ } } spriteEl.classList.remove('pokemon-sprite-hit', 'pokemon-sprite-stat-change'); void spriteEl.offsetWidth; spriteEl.classList.add(animationClass); setTimeout(() => { spriteEl.classList.remove(animationClass); }, duration); } }
function playFaintAnimation(spriteElement) { if (spriteElement) { spriteElement.classList.remove('pokemon-sprite-hit', 'pokemon-sprite-stat-change', 'pokemon-sprite-fainted'); void spriteElement.offsetWidth; spriteElement.classList.add('pokemon-sprite-fainted'); } }