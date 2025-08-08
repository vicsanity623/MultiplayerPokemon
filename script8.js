// --- NPC INTERACTION & TASK SYSTEM ---
function isTaskCompletable(activePlayerTask, taskDefinition) { if (!activePlayerTask || !taskDefinition) return false; switch (taskDefinition.type) { case "DEFEAT_ANY": case "DEFEAT_SPECIFIC": case "LEVEL_UP_EVENTS": case "CAPTURE_POKEMON": console.log(`isTaskCompletable Check: Type: ${taskDefinition.type}, Player Progress: ${activePlayerTask.progress}, Target: ${taskDefinition.targetCount}`); return activePlayerTask.progress >= taskDefinition.targetCount; case "PLAY_TIME": const requiredPlayTime = (activePlayerTask.startTimeMs || 0) + taskDefinition.durationMs; return player.totalPlayTimeMs >= requiredPlayTime; default: return false; } }
function setupNpcInteractionPrompt() { npcPromptText = []; npcPromptOptions = []; const npc = currentInteractingNPC; if (!npc) { console.error("setupNpcInteractionPrompt called with no currentInteractingNPC"); return; } const requiredLevelForInteraction = NPC_INTERACTION_LEVEL_REQUIREMENTS[npc.taskChainName]; if (requiredLevelForInteraction !== undefined && player.level < requiredLevelForInteraction) { npcPromptText.push(`${npc.name}:`); npcPromptText.push("COME BACK WHEN YOU ARE STRONGER!!!"); npcPromptOptions.push({ text: "Okay", action: "close_prompt", color: "#f0ad4e" }); npcInteractionPromptActive = true; return; } console.log(`Setting up prompt for NPC: ${npc.name}, Current Task Index: ${npc.currentTaskChainIndex}, Tasks Completed This Cycle: ${npc.tasksCompletedThisCycle}`); if (npc.isAwaitingRespawn) { const respawnAngle = Math.random() * Math.PI * 2; const respawnDistUnits = NPC_RESPAWN_DISTANCE_M * TILE_SIZE; let newWorldX = npc.originalWorldX + Math.cos(respawnAngle) * respawnDistUnits; let newWorldY = npc.originalWorldY + Math.sin(respawnAngle) * respawnDistUnits; let newSpawnPos = findWalkableSpawn(newWorldX, newWorldY, 20); npc.worldX = newSpawnPos.x; npc.worldY = newSpawnPos.y; npc.originalWorldX = newSpawnPos.x; npc.originalWorldY = newSpawnPos.y; npc.currentTaskChainIndex = 0; npc.tasksCompletedThisCycle = 0; npc.isAwaitingRespawn = false; showGeneralMessage(`${npc.name} has moved to a new location!`); console.log(`${npc.name} respawned. Offering first task.`); } const taskChain = ALL_NPC_TASK_CHAINS[npc.taskChainName]; if (!taskChain) { npcPromptText.push(`${npc.name}: I seem to have misplaced my to-do list...`); npcPromptOptions.push({ text: "Okay", action: "close_prompt", color: "#5bc0de" }); npcInteractionPromptActive = true; console.error(`No task chain found for ${npc.name} using chain name: ${npc.taskChainName}`); return; } if (npc.tasksCompletedThisCycle >= taskChain.length) { 
    npcPromptText.push(`${npc.name}: You've helped me so much! Thanks! If you want more tasks, look for others like me around here! Bye, for now...`);
        npc.isAwaitingRespawn = true;
        npc.lastInteractionTime = Date.now();
        npcPromptOptions.push({ text: "See Ya!", action: "close_prompt_after_bye", color: "#5bc0de" });
        console.log(`${npc.name} has completed all tasks in this cycle. isAwaitingRespawn = true.`);
    } else {
        const currentTaskDefForNPC = taskChain[npc.currentTaskChainIndex];
        console.log(`${npc.name} is on task definition index ${npc.currentTaskChainIndex}:`, currentTaskDefForNPC ? currentTaskDefForNPC.objective : "UNDEFINED TASK DEF");

        if (!currentTaskDefForNPC) {
            npcPromptText.push(`${npc.name}: Looks like I'm all out of tasks for now! (Error: Undefined task def)`);
            npcPromptOptions.push({ text: "Okay", action: "close_prompt", color: "#5bc0de" });
            npc.isAwaitingRespawn = true;
            console.error(`Error: ${npc.name} has tasksCompletedThisCycle ${npc.tasksCompletedThisCycle} but currentTaskChainIndex ${npc.currentTaskChainIndex} is out of bounds for taskChain of length ${taskChain.length}`);
        } else {
            const playerActiveTaskForThisSpecificNPCTask = player.activeTasks.find(task =>
                task.npcId === npc.id &&
                task.taskDetails &&
                task.taskDetails.objective === currentTaskDefForNPC.objective
            );

            if (playerActiveTaskForThisSpecificNPCTask) {
                console.log(`Player has active task from ${npc.name}: "${playerActiveTaskForThisSpecificNPCTask.taskDetails.objective}", Progress: ${playerActiveTaskForThisSpecificNPCTask.progress}`);
                if (isTaskCompletable(playerActiveTaskForThisSpecificNPCTask, currentTaskDefForNPC)) {
                    console.log(`Task "${currentTaskDefForNPC.objective}" is completable.`);
                    npcPromptText.push(`${npc.name}: Amazing! You've completed the task:`);
                    npcPromptText.push(`...Anyway here you go.`);
                    npcPromptOptions.push({ text: "Complete Task", action: "complete_task", color: "#5cb85c" });
                } else {
                    console.log(`Task "${currentTaskDefForNPC.objective}" is NOT yet completable.`);
                    npcPromptText.push(`${npc.name}: How's that task coming along?`);
                    npcPromptText.push(`- Objective: ${currentTaskDefForNPC.objective}`);
                    let progressText = `Progress: ${playerActiveTaskForThisSpecificNPCTask.progress || 0}/${currentTaskDefForNPC.targetCount || 'N/A'}`;
                    if (currentTaskDefForNPC.type === "PLAY_TIME") {
                        const timeLeftMs = Math.max(0, (playerActiveTaskForThisSpecificNPCTask.startTimeMs + currentTaskDefForNPC.durationMs) - player.totalPlayTimeMs);
                        const minutesLeft = Math.floor(timeLeftMs / 60000);
                        const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);
                        progressText = `Time remaining: ~${minutesLeft}m ${secondsLeft}s`;
                    }
                    npcPromptText.push(progressText);
                    npcPromptOptions.push({ text: "Still Working", action: "close_prompt", color: "#f0ad4e" });
                }
            } else {
                if (currentTaskDefForNPC.minLevelRequirement && player.level < currentTaskDefForNPC.minLevelRequirement) {
                    npcPromptText.push(`${npc.name}:`);
                    npcPromptText.push("Hmm, this task might be a bit much for you right now.");
                    npcPromptText.push("Come back when you're around Level " + currentTaskDefForNPC.minLevelRequirement + ".");
                    npcPromptOptions.push({ text: "Okay", action: "close_prompt", color: "#f0ad4e" });
                } else {
                    console.log(`Player does NOT have task "${currentTaskDefForNPC.objective}" from ${npc.name}. Offering it.`);
                    npcPromptText.push(`${npc.name}: Hey trainer! I have a new task for you:`);
                    npcPromptText.push(`- ${currentTaskDefForNPC.objective}`);
                    let rewardString = "Rewards: " + currentTaskDefForNPC.rewards.xp + " XP";
                    if(currentTaskDefForNPC.rewards.pokeBalls > 0) rewardString += `, ${currentTaskDefForNPC.rewards.pokeBalls} PokeBall(s)`;
                    if(currentTaskDefForNPC.rewards.pokeCoins > 0) rewardString += `, ${currentTaskDefForNPC.rewards.pokeCoins} PokeCoin(s)`;
                    npcPromptText.push(rewardString + ".");
                    npcPromptOptions.push({ text: "Accept", action: "accept_task", color: "#5cb85c" });
                    updateGuidingArrowState();
                    npcPromptOptions.push({ text: "Not Now", action: "decline_task", color: "#d9534f" });
                }
            }
        }
    }
    npcInteractionPromptActive = true;
}
function handleNpcOptionClick(action) { const npc = currentInteractingNPC; let interactionCooldownMs = NPC_PROMPT_DELAY_AFTER_CLOSE_MS; if (!npc) { player.npcInteractionCooldownEnd = Date.now() + interactionCooldownMs; GAME_STATE = previousGameState; npcInteractionPromptActive = false; currentInteractingNPC = null; updateGuidingArrowState(); return; } const taskChain = ALL_NPC_TASK_CHAINS[npc.taskChainName]; const currentTaskDef = taskChain && npc.currentTaskChainIndex < taskChain.length ? taskChain[npc.currentTaskChainIndex] : null; if (action === "accept_task") { if (currentTaskDef && !player.activeTasks.find(t => t.npcId === npc.id && t.taskDetails && t.taskDetails.objective === currentTaskDef.objective)) { const newTaskForPlayer = { npcId: npc.id, npcName: npc.name, taskDetails: JSON.parse(JSON.stringify(currentTaskDef)), progress: 0, }; if (currentTaskDef.type === "PLAY_TIME") { newTaskForPlayer.startTimeMs = player.totalPlayTimeMs; } player.activeTasks.push(newTaskForPlayer); showGeneralMessage(`Task accepted from ${npc.name}!`); interactionCooldownMs = NPC_PROMPT_DELAY_AFTER_ACTION_MS; } else if (currentTaskDef && player.activeTasks.find(t => t.npcId === npc.id && t.taskDetails && t.taskDetails.objective === currentTaskDef.objective)) { showGeneralMessage(`You already have this task from ${npc.name}.`); } else { showGeneralMessage(`Could not accept task from ${npc.name}.`); } } else if (action === "complete_task") { if (!currentTaskDef) { showGeneralMessage("Error: No current task definition to complete."); } else { const taskIndex = player.activeTasks.findIndex(t => t.npcId === npc.id && t.taskDetails && t.taskDetails.objective === currentTaskDef.objective); if (taskIndex !== -1) { const completedTask = player.activeTasks[taskIndex]; if (isTaskCompletable(completedTask, currentTaskDef)) { const rewards = currentTaskDef.rewards; let rewardMsg = `Task completed for ${npc.name}! Rewards: `; if (rewards.xp > 0) { player.addXp(rewards.xp); rewardMsg += `${rewards.xp} XP`; } if (rewards.pokeBalls > 0) { player.inventory.PokeBall += rewards.pokeBalls; rewardMsg += `, ${rewards.pokeBalls} PokeBall(s)`; } if (rewards.pokeCoins > 0) { player.inventory.PokeCoin += rewards.pokeCoins; rewardMsg += `, ${rewards.pokeCoins} PokeCoin(s)`; } updatePokeCoinDisplay(); showGeneralMessage(rewardMsg + "!"); player.activeTasks.splice(taskIndex, 1); npc.tasksCompletedThisCycle++; npc.currentTaskChainIndex++; console.log(`NPC ${npc.name} task completed. New currentTaskChainIndex: ${npc.currentTaskChainIndex}`); interactionCooldownMs = NPC_PROMPT_DELAY_AFTER_ACTION_MS; } else { showGeneralMessage("Task not quite finished yet!"); } } else { showGeneralMessage("Error: Could not find this task to complete."); } } } else if (action === "close_prompt_after_bye"){ interactionCooldownMs = NPC_PROMPT_DELAY_AFTER_ACTION_MS; } updateGuidingArrowState(); player.npcInteractionCooldownEnd = Date.now() + interactionCooldownMs; GAME_STATE = previousGameState; npcInteractionPromptActive = false; currentInteractingNPC = null; if (GAME_STATE === 'ROAMING') { player.screenX = NATIVE_WIDTH/2; player.screenY = NATIVE_HEIGHT/2; camera.update(); player.mouseDown = false; } }

// --- HOUSE INTERACTION ---
function handleHouseAction(action) { 
    houseActionPrompt.active = false; 
    if (action === "save_from_bed") { 
        executeSaveGame(); 
        GAME_STATE = 'IN_PLAYER_HOUSE'; 
        previousGameState = 'IN_PLAYER_HOUSE'; 
    } 
    else if (action === "pause_from_bed") { 
        player.team.forEach(p => { 
            if (p) { 
                p.currentHp = p.maxHp; 
            } 
        }); 
        healFlashOverlay.style.opacity = '0.8'; 
        isHealingFlashActive = true; healingFlashTimer = 
HEALING_FLASH_DURATION; 
        showGeneralMessage("Your Pokémon are fully rested and healed!"); 
        updatePokemonXpBar(); 
        updateTeamPokemonStatusBars(); 
        GAME_STATE = 'IN_PLAYER_HOUSE'; 
        previousGameState = 'IN_PLAYER_HOUSE'; 
    } 
    else if (action === "exit_house") { 
        async function exit() { 
            await screenFlash(); 
            
            const PLAYER_EXIT_OFFSET_Y_TILES = 2.0; 
            const targetPlayerExitY = playerHouse.worldY + (playerHouse.collisionHeight / 2) + (TILE_SIZE * PLAYER_EXIT_OFFSET_Y_TILES);
            const targetPlayerExitX = playerHouse.worldX; 

            let playerExitPos = findWalkableSpawn(targetPlayerExitX, targetPlayerExitY, 5); 
            player.worldX = playerExitPos.x;
            player.worldY = playerExitPos.y;
            
            if (player.originWorldX === 0 && player.originWorldY === 0) { 
                player.originWorldX = player.worldX; 
                player.originWorldY = player.worldY; } 
                player.screenX = NATIVE_WIDTH / 2; 
                player.screenY = NATIVE_HEIGHT / 2; 
                GAME_STATE = 'ROAMING'; 
                previousGameState = 'ROAMING'; 
                camera.update(); 
                player.npcInteractionCooldownEnd = Date.now() + 500; 
                manageWorldPokeBalls(); 
                
                if (player.team.length > 0) {
                    const follower = player.team.find(p => p.currentHp > 0 && p.isFollowingPlayer);
                    if (follower) {
                        const FOLLOWER_OFFSET_BEHIND_PLAYER = TILE_SIZE * 0.8; 
                        
                        let targetFollowerExitX = player.worldX;
                        let targetFollowerExitY = player.worldY + FOLLOWER_OFFSET_BEHIND_PLAYER;

                        let followerExitPos = findWalkableSpawn(targetFollowerExitX, targetFollowerExitY, 2); 
                        
                        follower.worldX = followerExitPos.x;
                        follower.worldY = followerExitPos.y;

                        follower.followerTargetX = follower.worldX;
                        follower.followerTargetY = follower.worldY;
                        follower.followerPath = [{ x: player.worldX, y: player.worldY }]; 
                        follower.followerPathIndex = 0;
                        follower.followerSpeed = player.speed * 0.85;
                    }
                }
            }
            exit(); 
                
        } else { GAME_STATE = 'IN_PLAYER_HOUSE'; previousGameState = 'IN_PLAYER_HOUSE'; } }
function setupItemChestInteractionPrompt(chestGameObject, chestName, items, chestTypeIdentifier) { itemChestPrompt.text = [`${chestName}:`]; itemChestPrompt.options = []; itemChestPrompt.chestType = chestTypeIdentifier; itemChestPrompt.targetChest = chestGameObject; if (chestTypeIdentifier.startsWith("masterball_chest")) { if (!chestGameObject.isOpen) { itemChestPrompt.text.push(`Contains ${items[0].qty} ${items[0].item}(s).`); itemChestPrompt.options.push({ text: `Take ${items[0].item}`, action: `take_masterball`, color: "#5cb85c" }); } else { itemChestPrompt.text.push(`It's empty.`); } } else if (chestTypeIdentifier === "house_item_chest") { if (houseItemChest.currentPokeBalls > 0) { itemChestPrompt.text.push(`Contains ${houseItemChest.currentPokeBalls} PokeBall(s).`); itemChestPrompt.options.push({ text: "Take PokeBall", action: "take_house_pokeball", color: "#5cb85c" }); } else { itemChestPrompt.text.push("NO MORE PokeBalls."); } } itemChestPrompt.options.push({ text: "Close Chest", action: "close_item_chest", color: "#6c757d" }); itemChestPrompt.active = true; }
function handleItemChestAction(action) { if (action === "take_masterball") { const currentChest = itemChestPrompt.targetChest; if (currentChest && !currentChest.isOpen) { player.inventory.MasterBall = (player.inventory.MasterBall || 0) + 1; currentChest.isOpen = true; showGeneralMessage("You found a Master Ball!"); } itemChestPrompt.active = false; GAME_STATE = 'ROAMING'; previousGameState = 'ROAMING'; } else if (action === "take_house_pokeball") { if (houseItemChest.currentPokeBalls > 0) { houseItemChest.currentPokeBalls--; player.inventory.PokeBall++; showGeneralMessage(`Took a PokeBall! You have ${player.inventory.PokeBall}.`); setupItemChestInteractionPrompt(null, "Item Storage", [], "house_item_chest"); } } else if (action === "close_item_chest") { itemChestPrompt.active = false; if (itemChestPrompt.chestType === "house_item_chest") { GAME_STATE = 'IN_PLAYER_HOUSE'; previousGameState = 'IN_PLAYER_HOUSE'; } else { GAME_STATE = 'ROAMING'; previousGameState = 'ROAMING'; } } itemChestPrompt.targetChest = null; }

// --- STORAGE UI & MOVE LEARNING PROMPT HANDLING ---
function handlePokemonStorageUIClick(clickX, clickY) { for (const button of pokemonStorageUI.buttons) { if (isPointInRect(clickX, clickY, button.rect)) { switch (button.action) { case 'store_team': if (player.team.length > 1) { const pkmnToStore = player.team.splice(button.pokemonIndex, 1)[0]; player.storedPokemon.push(pkmnToStore); needsBoostCheck = true; updatePokemonXpBar(); } else { showGeneralMessage("Cannot store your last Pokémon!"); } break; case 'add_stored': if (player.team.length < 6) { const pkmnToTeam = player.storedPokemon.splice(button.pokemonIndex, 1)[0]; player.team.push(pkmnToTeam); needsBoostCheck = true; updatePokemonXpBar(); } else { showGeneralMessage("Your team is full!"); } break; case 'close_storage': GAME_STATE = previousGameState; updatePokemonXpBar(); break; case 'scroll_team_up': pokemonStorageUI.teamListArea.scrollY = Math.max(0, pokemonStorageUI.teamListArea.scrollY - pokemonStorageUI.teamListArea.itemHeight); break; case 'scroll_team_down': const maxTeamScroll = Math.max(0, (player.team.length * pokemonStorageUI.teamListArea.itemHeight) - pokemonStorageUI.teamListArea.h); pokemonStorageUI.teamListArea.scrollY = Math.min(maxTeamScroll, pokemonStorageUI.teamListArea.scrollY + pokemonStorageUI.teamListArea.itemHeight); break; case 'scroll_stored_up': pokemonStorageUI.storedListArea.scrollY = Math.max(0, pokemonStorageUI.storedListArea.scrollY - pokemonStorageUI.storedListArea.itemHeight); break; case 'scroll_stored_down': const maxStoredScroll = Math.max(0, (player.storedPokemon.length * pokemonStorageUI.storedListArea.itemHeight) - pokemonStorageUI.storedListArea.h); pokemonStorageUI.storedListArea.scrollY = Math.min(maxStoredScroll, pokemonStorageUI.storedListArea.scrollY + pokemonStorageUI.storedListArea.itemHeight); break; } if (needsBoostCheck) { player.hasShinySpeedBoost = player.team.some(p => p.variant === 'shiny' && p.currentHp > 0); player.hasDarkAttackBoost = player.team.some(p => p.variant === 'dark' && p.currentHp > 0); player.updateEffectiveSpeed(); updatePokemonXpBar(); } return; } } }
async function handleMoveLearningPromptClick(clickX, clickY) { if (!moveLearningPrompt.active || !pokemonLearningMove || !newMoveToLearn) return; let actionTaken = false; for (const opt of moveLearningPrompt.options) { if (isPointInRect(clickX, clickY, opt.rect)) { actionTaken = true; if (opt.action === 'forget_move') { const forgottenMove = pokemonLearningMove.moves[opt.indexToForget]; pokemonLearningMove.moves[opt.indexToForget] = newMoveToLearn; showGeneralMessage(`${pokemonLearningMove.name} forgot ${forgottenMove.name} and learned ${newMoveToLearn.name}!`); if (previousGameState === 'BATTLE' || previousGameState === 'BATTLE_STARTING') addBattleLog(`${pokemonLearningMove.name} forgot ${forgottenMove.name} and learned ${newMoveToLearn.name}!`); } else if (opt.action === 'skip_learn') { showGeneralMessage(`${pokemonLearningMove.name} did not learn ${newMoveToLearn.name}.`); if (previousGameState === 'BATTLE' || previousGameState === 'BATTLE_STARTING') addBattleLog(`${pokemonLearningMove.name} did not learn ${newMoveToLearn.name}.`); } break; } } if (actionTaken) { const promptOriginState = previousGameState; moveLearningPrompt.active = false; if (promptOriginState === 'BATTLE' || promptOriginState === 'BATTLE_STARTING') { if (currentBattle && !currentBattle.gameOver) { GAME_STATE = promptOriginState; battleScreen.style.display = 'flex'; } else { battleScreen.style.display = 'none'; if (!currentBattle) { /* Do Nothing */ } else { GAME_STATE = 'ROAMING'; } } } else { GAME_STATE = promptOriginState; } if (player.team[0] && pokemonLearningMove && player.team[0].id === pokemonLearningMove.id) { updatePokemonXpBar(); } if (currentBattle && currentBattle.playerPokemon && pokemonLearningMove && currentBattle.playerPokemon.id === pokemonLearningMove.id) { updateBattleUI(); if (GAME_STATE === 'BATTLE') createBattleOptions(); } updateTeamPokemonStatusBars(); if (afterMoveLearnCallback) { await afterMoveLearnCallback(); } else { if(pokemonLearningMove) await checkAndEvolvePokemon(pokemonLearningMove); } pokemonLearningMove = null; newMoveToLearn = null; afterMoveLearnCallback = null; } }

// --- EVENT LISTENERS & INPUT HANDLING ---
menuToggleBtn.onclick = () => {
    if (GAME_STATE === 'POKEDEX_OPEN') return;

    const allowedStatesToOpenMenu = ['ROAMING', 'IN_PLAYER_HOUSE', 'HOSPITAL_INTERIOR'];
    if (allowedStatesToOpenMenu.includes(GAME_STATE)) {
        gameMenu.style.display = 'flex';
        previousGameState = GAME_STATE; 
        GAME_STATE = 'MENU_OPEN';
        player.mouseDown = false;
        player.joystickActive = false;
        player.isMoving = false;
    } else if (GAME_STATE === 'MENU_OPEN') {
        gameMenu.style.display = 'none';
        GAME_STATE = previousGameState; 
    }
};

if (pokedexBtn) {
    pokedexBtn.onclick = () => {
        if (GAME_STATE === 'MENU_OPEN') return;
        if (GAME_STATE !== 'POKEDEX_OPEN') {
            openPokedex();
        } else {
            closePokedex();
        }
    };
}

if (pokedexCloseBtn) {
    pokedexCloseBtn.onclick = () => {
        closePokedex();
    };
}

saveGameBtn.onclick = () => {
    executeSaveGame();
    gameMenu.style.display = 'none';
    if (GAME_STATE === 'MENU_OPEN') {
        GAME_STATE = previousGameState;
    }
    npcInteractionPromptActive = false;
    itemChestPrompt.active = false;
    moveLearningPrompt.active = false;
    if (pokedexPanel) pokedexPanel.style.display = 'none';
};

loadGameBtn.onclick = () => {
    const savedJSON = localStorage.getItem('pokemonHunterSave');
    if (savedJSON) {
        const saveData = JSON.parse(savedJSON);
        player.worldX = saveData.player.worldX; player.worldY = saveData.player.worldY; player.originWorldX = saveData.player.originWorldX !== undefined ? saveData.player.originWorldX : 0; player.originWorldY = saveData.player.originWorldY !== undefined ? saveData.player.originWorldY : 0; player.preHospitalWorldX = saveData.player.preHospitalWorldX || 0; player.preHospitalWorldY = saveData.player.preHospitalWorldY || 0; player.level = saveData.player.level; player.xp = saveData.player.xp; player.maxXp = saveData.player.maxXp; player.speed = saveData.player.speed; player.activeTasks = saveData.player.activeTasks || []; player.inventory = saveData.player.inventory || { PokeBall: 0, MasterBall: 0, PokeCoin: 0 }; if (typeof player.inventory.PokeCoin === 'undefined') player.inventory.PokeCoin = 0; player.totalPlayTimeMs = saveData.player.totalPlayTimeMs || 0; player.hasShinySpeedBoost = saveData.player.hasShinySpeedBoost || false; player.hasDarkAttackBoost = saveData.player.hasDarkAttackBoost || false; player.updateEffectiveSpeed(); player.distanceTraveledSinceLastLegendaryAttempt = saveData.player.distanceTraveledSinceLastLegendaryAttempt || 0; player.lastLegendarySpawnCoordinates = saveData.player.lastLegendarySpawnCoordinates || {x:0, y:0};
        player.storedPokemon = (saveData.player.storedPokemon || []).map(pData => { let pkmn = createPokemon(pData.name, pData.level, pData.variant); if (!pkmn) return null; pkmn.xp = pData.xp; pkmn.maxXp = pData.maxXp; pkmn.currentHp = pData.currentHp; pkmn.maxHp = pData.maxHp; pkmn.attack = pData.attack; pkmn.id = pData.id || Date.now() + Math.random().toString(36).substr(2, 9); pkmn.moves = pData.moves ? pData.moves.map(moveName => getMoveByName(moveName)) : (POKEMON_DATA[pData.name]?.learnset?.filter(ls => ls.level === 1).map(ls => getMoveByName(ls.moveName)).slice(0,2) || [getMoveByName("Tackle")]); pkmn.types = pData.types || (POKEMON_DATA[pData.name] ? POKEMON_DATA[pData.name].types : []); const baseData = POKEMON_DATA[pkmn.name]; pkmn.baseAttack = pData.baseAttack || (baseData ? Math.floor(((2 * baseData.baseAtk + 31 + (84 / 4)) * pkmn.level) / 100 + 5) : 10); pkmn.baseDefense = pData.baseDefense || (baseData ? Math.floor(((2 * baseData.baseDef + 31 + (84 / 4)) * pkmn.level) / 100 + 5) : 10); pkmn.baseSpAttack = pData.baseSpAttack || (baseData ? Math.floor(((2 * baseData.baseSpAtk + 31 + (84 / 4)) * pkmn.level) / 100 + 5) : 10); pkmn.baseSpDefense = pData.baseSpDefense || (baseData ? Math.floor(((2 * baseData.baseSpDef + 31 + (84 / 4)) * pkmn.level) / 100 + 5) : 10); pkmn.baseSpeed = pData.baseSpeed || (baseData ? Math.floor(((2 * baseData.baseSpeed + 31 + (84 / 4)) * pkmn.level) / 100 + 5) : 10); pkmn.variant = pData.variant || null; pkmn.roamSpeed = pData.roamSpeed || (TILE_SIZE * 4.4); pkmn.attackStage = pData.attackStage || 0; pkmn.defenseStage = pData.defenseStage || 0; pkmn.spAttackStage = 0; pkmn.spDefenseStage = 0; pkmn.speedStage = 0; pkmn.applyVariantMods(); updateBattleStats(pkmn); return pkmn; }).filter(p => p !== null);
        player.team = (saveData.team || []).map(pData => { let pkmn = createPokemon(pData.name, pData.level, pData.variant); if (!pkmn) return null; pkmn.xp = pData.xp; pkmn.maxXp = pData.maxXp; pkmn.currentHp = pData.currentHp; pkmn.maxHp = pData.maxHp; pkmn.attack = pData.attack; pkmn.id = pData.id || Date.now() + Math.random().toString(36).substr(2, 9); pkmn.moves = pData.moves ? pData.moves.map(moveName => getMoveByName(moveName)) : (POKEMON_DATA[pData.name]?.learnset?.filter(ls => ls.level === 1).map(ls => getMoveByName(ls.moveName)).slice(0,2) || [getMoveByName("Tackle")]); pkmn.types = pData.types || (POKEMON_DATA[pData.name] ? POKEMON_DATA[pData.name].types : []); const baseData = POKEMON_DATA[pkmn.name]; pkmn.baseAttack = pData.baseAttack || (baseData ? Math.floor(((2 * baseData.baseAtk + 31 + (84 / 4)) * pkmn.level) / 100 + 5) : 10); pkmn.baseDefense = pData.baseDefense || (baseData ? Math.floor(((2 * baseData.baseDef + 31 + (84 / 4)) * pkmn.level) / 100 + 5) : 10); pkmn.baseSpAttack = pData.baseSpAttack || (baseData ? Math.floor(((2 * baseData.baseSpAtk + 31 + (84 / 4)) * pkmn.level) / 100 + 5) : 10); pkmn.baseSpDefense = pData.baseSpDefense || (baseData ? Math.floor(((2 * baseData.baseSpDef + 31 + (84 / 4)) * pkmn.level) / 100 + 5) : 10); pkmn.baseSpeed = pData.baseSpeed || (baseData ? Math.floor(((2 * baseData.baseSpeed + 31 + (84 / 4)) * pkmn.level) / 100 + 5) : 10); pkmn.variant = pData.variant || null; pkmn.roamSpeed = pData.roamSpeed || (TILE_SIZE * 4.4); pkmn.attackStage = pData.attackStage || 0; pkmn.defenseStage = pData.defenseStage || 0; pkmn.spAttackStage = 0; pkmn.spDefenseStage = 0; pkmn.speedStage = 0; pkmn.applyVariantMods(); updateBattleStats(pkmn); return pkmn; }).filter(p => p !== null);
        let worldSeedWasRegenerated = false; if (saveData.worldSeed) { worldSeed = saveData.worldSeed; } else { worldSeed = Date.now(); worldSeedWasRegenerated = true; console.warn("World seed not found in save. Regenerating terrain. Chest positions may be re-initialized."); }
        gameTime = saveData.gameTime; weather = saveData.weather; worldSeed = saveData.worldSeed || Date.now(); lastMewtwoSpawnTime = saveData.lastMewtwoSpawnTime || 0; mewtwoOnCooldown = saveData.mewtwoOnCooldown || false; discoveredHospitals = saveData.discoveredHospitals || []; playerHouse = saveData.playerHouse ? {...saveData.playerHouse} : playerHouse; worldPokeBalls = saveData.worldPokeBalls || []; houseItemChest = saveData.houseItemChest ? {...saveData.houseItemChest} : { currentPokeBalls: 25, maxPokeBalls: 25, pokeBallSpriteChar: "●", color: "#FF0000" };
        if (worldSeedWasRegenerated || !saveData.masterBallChests || saveData.masterBallChests.length !== MASTER_BALL_CHEST_DEFINITIONS.length) { console.log("Re-initializing Master Ball Chests due to new world seed or save data mismatch."); initializeMasterBallChests(); if (saveData.masterBallChests && !worldSeedWasRegenerated) { masterBallChests.forEach(newChest => { const savedChest = saveData.masterBallChests.find(sc => sc.id === newChest.id); if (savedChest) { newChest.isOpen = savedChest.isOpen; } }); } } else { masterBallChests = MASTER_BALL_CHEST_DEFINITIONS.map(def => { const savedChestData = saveData.masterBallChests.find(sc => sc.id === def.id); return { id: def.id, worldX: savedChestData ? savedChestData.worldX : 0, worldY: savedChestData ? savedChestData.worldY : 0, size: MASTER_BALL_CHEST_SIZE, isOpen: savedChestData ? savedChestData.isOpen : false, spriteChar: MASTER_BALL_CHEST_SPRITE_CHAR }; }); }
        worldPokeBalls = saveData.worldPokeBalls || [];
        if (saveData.npcs) { NPCS = saveData.npcs.map(nData => { let currentPos = findWalkableSpawn(nData.worldX, nData.worldY, 3); return { ...nData, worldX: currentPos.x, worldY: currentPos.y, taskChainName: nData.taskChainName || 'default', currentTaskChainIndex: nData.currentTaskChainIndex || 0, tasksCompletedThisCycle: nData.tasksCompletedThisCycle || 0, isAwaitingRespawn: nData.isAwaitingRespawn || false, originalWorldX: nData.originalWorldX || currentPos.x, originalWorldY: nData.originalWorldY || currentPos.y, lastInteractionTime: nData.lastInteractionTime || 0 }; }); } else { initializeNPCs(); }
        GAME_STATE = saveData.gameState || 'ROAMING'; previousGameState = saveData.previousGameState || GAME_STATE; if (GAME_STATE === 'PAUSED') { GAME_STATE = previousGameState; if (GAME_STATE === 'PAUSED') GAME_STATE = 'IN_PLAYER_HOUSE'; }
        player.mouseDown = false; player.joystickActive = false; player.isMoving = false;
        if (GAME_STATE === 'IN_PLAYER_HOUSE' || GAME_STATE === 'HOUSE_ACTION_PROMPT' || GAME_STATE === 'POKEMON_STORAGE_UI' || GAME_STATE === 'ITEM_CHEST_PROMPT' && previousGameState === 'IN_PLAYER_HOUSE') { player.screenX = saveData.player.screenX !== undefined ? saveData.player.screenX : NATIVE_WIDTH / 2; player.screenY = saveData.player.screenY !== undefined ? saveData.player.screenY : NATIVE_HEIGHT * 0.65; player.targetX = player.screenX; player.targetY = player.screenY; if (saveData.player.originWorldX === 0 && saveData.player.originWorldY === 0) { player.originWorldX = 0; player.originWorldY = 0; } } else if (GAME_STATE === 'ROAMING' || GAME_STATE === 'MENU_OPEN') { const loadedSpawnPoint = findWalkableSpawn(player.worldX, player.worldY, 5); player.worldX = loadedSpawnPoint.x; player.worldY = loadedSpawnPoint.y; player.screenX = NATIVE_WIDTH / 2; player.screenY = NATIVE_HEIGHT / 2; player.targetX = player.screenX; player.targetY = player.screenY; camera.update(); manageWorldPokeBalls(); if (player.originWorldX === 0 && player.originWorldY === 0) { player.originWorldX = player.worldX; player.originWorldY = player.worldY; } } else if (GAME_STATE === 'HOSPITAL_INTERIOR' || GAME_STATE === 'HOSPITAL_HEAL_PROMPT') { player.screenX = saveData.player.screenX !== undefined ? saveData.player.screenX : NATIVE_WIDTH / 2; player.screenY = saveData.player.screenY !== undefined ? saveData.player.screenY : NATIVE_HEIGHT * 0.75; player.targetX = player.screenX; player.targetY = player.screenY; }
        if (player.team.length > 0) { const firstHealthyPokemon = player.team.find(p => p.currentHp > 0); player.team.forEach(p => p.isFollowingPlayer = false); if (firstHealthyPokemon) { firstHealthyPokemon.isFollowingPlayer = true; const follower = firstHealthyPokemon; if (GAME_STATE === 'IN_PLAYER_HOUSE') { follower.worldX = player.worldX; follower.worldY = player.worldY; } else if (GAME_STATE === 'ROAMING' || GAME_STATE === 'MENU_OPEN') { const angleBehindPlayer = (player.lastAngle || -Math.PI / 2) + Math.PI; follower.worldX = player.worldX + Math.cos(angleBehindPlayer) * TILE_SIZE * 0.75; follower.worldY = player.worldY + Math.sin(angleBehindPlayer) * TILE_SIZE * 0.75; } else { follower.worldX = player.worldX - TILE_SIZE * 0.75; follower.worldY = player.worldY; } follower.followerTargetX = follower.worldX; follower.followerTargetY = follower.worldY; follower.followerPath = [{ x: player.worldX, y: player.worldY }]; follower.followerPathIndex = 0; follower.followerSpeed = player.speed * 0.85; } }
        if (GAME_STATE !== 'ROAMING' && GAME_STATE !== 'MENU_OPEN') { wildPokemon = []; }
        updatePlayerXpBar(); updatePokemonXpBar(); updateTeamPokemonStatusBars(); updatePokeCoinDisplay();
        showGeneralMessage('Game Loaded!');
    } else { showGeneralMessage('No save data found.'); }
    gameMenu.style.display = 'none';
    if (GAME_STATE === 'MENU_OPEN') {
        GAME_STATE = previousGameState;
    }
    healPromptActive = false;
    npcInteractionPromptActive = false;
    houseActionPrompt.active = false;
    itemChestPrompt.active = false;
    moveLearningPrompt.active = false;
    if (pokedexPanel) pokedexPanel.style.display = 'none'; 
};

quitGameBtn.onclick = () => { if (confirm("Are you sure you want to quit?")) { document.body.innerHTML = "<div style='color:white; text-align:center; padding-top: 50px; font-size: 24px;'>Thanks for playing!<br>You can close this tab.</div>";}};
function toggleFullscreen() { const elem = document.documentElement; if (!document.fullscreenElement && !document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) { if (elem.requestFullscreen) { elem.requestFullscreen(); } else if (elem.mozRequestFullScreen) { elem.mozRequestFullScreen(); } else if (elem.webkitRequestFullscreen) { elem.webkitRequestFullscreen(); } else if (elem.msRequestFullscreen) { elem.msRequestFullscreen(); } } else { if (document.exitFullscreen) { document.exitFullscreen(); } else if (document.mozCancelFullScreen) { document.mozCancelFullScreen(); } else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); } else if (document.msExitFullscreen) { document.msExitFullscreen(); } } }
fullscreenBtn.onclick = toggleFullscreen;

function handleCanvasInputStart(e) {
    if (GAME_STATE === 'POKEDEX_OPEN') {
        return;
    }

    e.preventDefault();
    const coords = getEventCoordinates(e);
    const clickX = coords.x;
    const clickY = coords.y;
    if (typeof gameAudio !== 'undefined' && gameAudio && !gameAudio.hasPlayed && typeof playMusic === 'function') { playMusic(); }
    if (GAME_STATE === 'PAUSED') {
        GAME_STATE = previousGameState || 'IN_PLAYER_HOUSE';
        houseActionPrompt.active = false;
        itemChestPrompt.active = false;
        return;
    }
    if (GAME_STATE === 'ROAMING') { for (const chest of masterBallChests) { if (!chest.isOpen && isPointInRect(clickX, clickY, { x: chest.worldX - camera.x - chest.size / 2, y: chest.worldY - camera.y - chest.size / 2, w: chest.size, h: chest.size })) { previousGameState = GAME_STATE; GAME_STATE = 'ITEM_CHEST_PROMPT'; setupItemChestInteractionPrompt(chest, "Master Ball Chest", [{item: "MasterBall", qty: 1}], `masterball_chest_${chest.id}`); player.mouseDown = false; player.joystickActive = false; return; } } if (playerHouse && preloadedHouseImage && playerHouse.collisionWidth !== undefined && playerHouse.collisionHeight !== undefined) { const houseClickableRect = { x: playerHouse.worldX - camera.x - playerHouse.collisionWidth / 2, y: playerHouse.worldY - camera.y - playerHouse.collisionHeight / 2, w: playerHouse.collisionWidth, h: playerHouse.collisionHeight }; if (isPointInRect(clickX, clickY, houseClickableRect) && Date.now() > (player.npcInteractionCooldownEnd || 0)) { player.mouseDown = false; player.joystickActive = false; player.isMoving = false; previousGameState = GAME_STATE; GAME_STATE = 'IN_PLAYER_HOUSE'; player.screenX = NATIVE_WIDTH / 2; player.screenY = NATIVE_HEIGHT * 0.65; player.targetX = player.screenX; player.targetY = player.screenY; houseActionPrompt.active = false; player.npcInteractionCooldownEnd = Date.now() + 500; return; } } for (const hospital of discoveredHospitals.filter(h => h.worldX !== -Infinity && h.width && h.height)) { const hospitalClickableRect = { x: hospital.worldX - camera.x - hospital.width / 2, y: hospital.worldY - camera.y - hospital.height / 2, w: hospital.width, h: hospital.height }; if (isPointInRect(clickX, clickY, hospitalClickableRect) && Date.now() > (player.npcInteractionCooldownEnd || 0)) { player.mouseDown = false; player.joystickActive = false; player.isMoving = false; let exitSpot = findWalkableSpawn(hospital.worldX, hospital.worldY + hospital.collisionHeight / 2 + TILE_SIZE, 3); player.preHospitalWorldX = exitSpot.x; player.preHospitalWorldY = exitSpot.y; previousGameState = GAME_STATE; GAME_STATE = 'HOSPITAL_INTERIOR'; player.screenX = NATIVE_WIDTH / 2; player.screenY = NATIVE_HEIGHT * 0.75; nurseScreenPos = { x: NATIVE_WIDTH / 2, y: NATIVE_HEIGHT * 0.35 }; healPromptActive = false; player.npcInteractionCooldownEnd = Date.now() + 500; return; } } if (!player.joystickActive && (e.type === 'mousedown' ? e.button === 0 : true)) { player.mouseDown = true; player.targetX = clickX; player.targetY = clickY; } return; } else if (GAME_STATE === 'IN_PLAYER_HOUSE') { if (isPointInRect(clickX, clickY, houseBedRect)) { houseActionPrompt = { active: true, text: ["Bed:"], options: [ {text: "Save Game", action: "save_from_bed", color: "#5bc0de"}, {text: "Rest", action: "pause_from_bed", color: "#f0ad4e"}, {text: "Cancel", action: "cancel_house_action", color: "#6c757d"} ]}; previousGameState = GAME_STATE; GAME_STATE = 'HOUSE_ACTION_PROMPT'; } else if (isPointInRect(clickX, clickY, houseDoorRect)) { houseActionPrompt = { active: true, text: ["Exit House?"], options: [ {text: "YES", action: "exit_house", color: "#5cb85c"}, {text: "NO", action: "cancel_house_action", color: "#d9534f"} ]}; previousGameState = GAME_STATE; GAME_STATE = 'HOUSE_ACTION_PROMPT'; } else if (isPointInRect(clickX, clickY, housePokemonChestRect)) { previousGameState = GAME_STATE; GAME_STATE = 'POKEMON_STORAGE_UI'; initializePokemonStorageUI(); } else if (isPointInRect(clickX, clickY, houseItemChestRect)) { previousGameState = GAME_STATE; GAME_STATE = 'ITEM_CHEST_PROMPT'; setupItemChestInteractionPrompt(null, "Item Storage", [], "house_item_chest"); } else { player.mouseDown = true; player.targetX = clickX; player.targetY = clickY; } if (GAME_STATE === 'HOUSE_ACTION_PROMPT' || GAME_STATE === 'POKEMON_STORAGE_UI' || GAME_STATE === 'ITEM_CHEST_PROMPT') { player.mouseDown = false; } } else if (GAME_STATE === 'HOSPITAL_INTERIOR') { const distToNurse = Math.sqrt((clickX - nurseScreenPos.x)**2 + (clickY - nurseScreenPos.y)**2); if (distToNurse < PLAYER_SIZE * 0.8 + 10) { healPromptActive = true; previousGameState = GAME_STATE; GAME_STATE = 'HOSPITAL_HEAL_PROMPT'; } else if (isPointInRect(clickX, clickY, hospitalPokemonChestRect)) { previousGameState = GAME_STATE; GAME_STATE = 'POKEMON_STORAGE_UI'; initializePokemonStorageUI(); } else if (isPointInRect(clickX, clickY, hospitalExitRect)) { GAME_STATE = 'ROAMING'; previousGameState = 'ROAMING'; player.worldX = player.preHospitalWorldX; player.worldY = player.preHospitalWorldY + TILE_SIZE * 1.5; let finalExitPos = findWalkableSpawn(player.worldX, player.worldY, 2); player.worldX = finalExitPos.x; player.worldY = finalExitPos.y; player.screenX = NATIVE_WIDTH / 2; player.screenY = NATIVE_HEIGHT / 2; camera.update(); player.npcInteractionCooldownEnd = Date.now() + 1000; manageWorldPokeBalls(); if (player.team.length > 0) { const follower = player.team.find(p => p.currentHp > 0 && p.isFollowingPlayer); if (follower) { const exitAngle = (player.lastAngle || -Math.PI / 2) + Math.PI; follower.worldX = player.worldX + Math.cos(exitAngle) * TILE_SIZE; follower.worldY = player.worldY + Math.sin(exitAngle) * TILE_SIZE; follower.followerTargetX = follower.worldX; follower.followerTargetY = follower.worldY; follower.followerPath = [{ x: player.worldX, y: player.worldY }]; follower.followerPathIndex = 0; follower.followerSpeed = player.speed * 0.85; } } } player.mouseDown = false; } else if (GAME_STATE === 'HOSPITAL_HEAL_PROMPT') { if (isPointInRect(clickX, clickY, healPromptYesRect)) { player.team.forEach(p => p.currentHp = p.maxHp); healFlashOverlay.style.opacity = '0.8'; isHealingFlashActive = true; healingFlashTimer = HEALING_FLASH_DURATION; showGeneralMessage("All your Pokemon are fully healed!"); updatePokemonXpBar(); updateTeamPokemonStatusBars(); healPromptActive = false; GAME_STATE = 'HOSPITAL_INTERIOR'; previousGameState = 'HOSPITAL_INTERIOR'; } else if (isPointInRect(clickX, clickY, healPromptNoRect)) { healPromptActive = false; GAME_STATE = 'HOSPITAL_INTERIOR'; previousGameState = 'HOSPITAL_INTERIOR'; } player.mouseDown = false; } else if (GAME_STATE === 'NPC_INTERACTION') { npcPromptOptions.forEach(opt => { if (isPointInRect(clickX, clickY, opt.rect)) { handleNpcOptionClick(opt.action); } }); player.mouseDown = false; } else if (GAME_STATE === 'HOUSE_ACTION_PROMPT') { houseActionPrompt.options.forEach(opt => { if (isPointInRect(clickX, clickY, opt.rect)) { handleHouseAction(opt.action); } }); player.mouseDown = false; } else if (GAME_STATE === 'ITEM_CHEST_PROMPT') { itemChestPrompt.options.forEach(opt => { if (isPointInRect(clickX, clickY, opt.rect)) { handleItemChestAction(opt.action); } }); player.mouseDown = false; } else if (GAME_STATE === 'POKEMON_STORAGE_UI') { handlePokemonStorageUIClick(clickX, clickY); player.mouseDown = false; } else if (GAME_STATE === 'MOVE_LEARNING_PROMPT') { handleMoveLearningPromptClick(clickX, clickY); player.mouseDown = false; }
}

function handleCanvasInputMove(e) {
    if (GAME_STATE === 'POKEDEX_OPEN') return;
    e.preventDefault();
    if (player.mouseDown && GAME_STATE === 'ROAMING' && !player.joystickActive) {
        const coords = getEventCoordinates(e);
        player.targetX = coords.x;
        player.targetY = coords.y;
    }
}

function handleCanvasInputEnd(e) {
    if (GAME_STATE === 'POKEDEX_OPEN') return;
    e.preventDefault();
    if (player.mouseDown) {
        player.mouseDown = false;
    }
}

canvas.addEventListener('mousedown', handleCanvasInputStart);
canvas.addEventListener('touchstart', handleCanvasInputStart, { passive: false });
canvas.addEventListener('mousemove', handleCanvasInputMove);
canvas.addEventListener('touchmove', handleCanvasInputMove, { passive: false });
canvas.addEventListener('mouseup', handleCanvasInputEnd);
canvas.addEventListener('touchend', handleCanvasInputEnd, { passive: false });
canvas.addEventListener('touchcancel', handleCanvasInputEnd, { passive: false });
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('wheel', (e) => {
    if (GAME_STATE === 'POKEDEX_OPEN') {
        if (pokedexPanel && pokedexPanel.contains(e.target)) {
            return;
        }
        e.preventDefault(); 
        return;
    }

    const coords = getEventCoordinates(e);
    const mouseX = coords.x;
    const mouseY = coords.y;
    if (GAME_STATE === 'POKEMON_STORAGE_UI') {
        e.preventDefault(); if (isPointInRect(mouseX, mouseY, pokemonStorageUI.teamListArea)) { const scrollAmount = e.deltaY > 0 ? pokemonStorageUI.teamListArea.itemHeight : -pokemonStorageUI.teamListArea.itemHeight; pokemonStorageUI.teamListArea.scrollY += scrollAmount; const maxTeamScroll = Math.max(0, (player.team.length * pokemonStorageUI.teamListArea.itemHeight) - pokemonStorageUI.teamListArea.h); pokemonStorageUI.teamListArea.scrollY = Math.max(0, Math.min(pokemonStorageUI.teamListArea.scrollY, maxTeamScroll)); } else if (isPointInRect(mouseX, mouseY, pokemonStorageUI.storedListArea)) { const scrollAmount = e.deltaY > 0 ? pokemonStorageUI.storedListArea.itemHeight : -pokemonStorageUI.storedListArea.itemHeight; pokemonStorageUI.storedListArea.scrollY += scrollAmount; const maxStoredScroll = Math.max(0, (player.storedPokemon.length * pokemonStorageUI.storedListArea.itemHeight) - pokemonStorageUI.storedListArea.h); pokemonStorageUI.storedListArea.scrollY = Math.max(0, Math.min(pokemonStorageUI.storedListArea.scrollY, maxStoredScroll)); }
    } else if (player.activeTasks.length > 0 && GAME_STATE !== 'BATTLE' && GAME_STATE !== 'BATTLE_STARTING') {
        if (mouseX >= taskListBoxRect.x && mouseX <= taskListBoxRect.x + taskListBoxRect.w && mouseY >= taskListBoxRect.y && mouseY <= taskListBoxRect.y + taskListBoxRect.h) { e.preventDefault(); taskListScrollOffset += e.deltaY * 0.2; const maxScroll = Math.max(0, taskListContentHeight - (taskListBoxRect.h - 2 * 6 )); taskListScrollOffset = Math.max(0, Math.min(taskListScrollOffset, maxScroll)); }
    }
});

function handleJoystickStart(e) {
    if (GAME_STATE === 'POKEDEX_OPEN') return;
    e.preventDefault();
    if (joystickTouchId === null && e.targetTouches.length > 0 && (GAME_STATE === 'ROAMING' || GAME_STATE === 'MENU_OPEN')) {
        const touch = e.targetTouches[0];
        joystickTouchId = touch.identifier;
        joystickInitialX = touch.clientX;
        joystickInitialY = touch.clientY;
        player.joystickActive = true;
        player.mouseDown = false;
    }
}

function handleJoystickMove(e) {
    if (GAME_STATE === 'POKEDEX_OPEN') return;
    if (joystickTouchId !== null && player.joystickActive) {
        for (let i = 0; i < e.changedTouches.length; i++) { const touch = e.changedTouches[i]; if (touch.identifier === joystickTouchId) { e.preventDefault(); const deltaX = touch.clientX - joystickInitialX; const deltaY = touch.clientY - joystickInitialY; const baseRadius = joystickBase.offsetWidth / 2; const nubRadius = joystickNub.offsetWidth / 2; const maxDist = baseRadius - nubRadius; const distFromCenter = Math.sqrt(deltaX * deltaX + deltaY * deltaY); player.joystickAngle = Math.atan2(deltaY, deltaX); player.joystickMagnitude = Math.min(1, distFromCenter / maxDist); let newNubX, newNubY; if (distFromCenter > maxDist) { newNubX = joystickNubCenterX + Math.cos(player.joystickAngle) * maxDist; newNubY = joystickNubCenterY + Math.sin(player.joystickAngle) * maxDist; } else { newNubX = joystickNubCenterX + deltaX; newNubY = joystickNubCenterY + deltaY; } joystickNub.style.left = `${newNubX - nubRadius}px`; joystickNub.style.top = `${newNubY - nubRadius}px`; break; } }
    }
}

function handleJoystickEnd(e) {
    if (joystickTouchId !== null) {
        for (let i = 0; i < e.changedTouches.length; i++) { const touch = e.changedTouches[i]; if (touch.identifier === joystickTouchId) { e.preventDefault(); joystickTouchId = null; joystickNub.style.left = '50%'; joystickNub.style.top = '50%'; joystickNub.style.transform = 'translate(-50%, -50%)'; player.joystickActive = false; player.joystickMagnitude = 0; player.isMoving = false; break; } }
    }
}

// --- GAME INITIALIZATION & START ---
async function onPokedexDataLoaded(fullPokedexDataFromAPI) {
    console.log("onPokedexDataLoaded - START");
    if (!fullPokedexDataFromAPI || !fullPokedexDataFromAPI.pokemonDetails || fullPokedexDataFromAPI.pokemonDetails.length < 151) {
        console.error("Pokedex data loading failed or incomplete. Expected around 151 Pokémon, got:", fullPokedexDataFromAPI?.pokemonDetails?.length);
        updateLoadingProgress("Error: Failed to load critical Pokémon data. Please refresh.", 1);
        GAME_STATE = 'ERROR_LOADING';
        console.log("onPokedexDataLoaded - ERROR loading data");
        return;
    }
    updateLoadingProgress("Processing Pokémon data...", 0.95);

    if (fullPokedexDataFromAPI.typeDamageRelations) {
        TYPE_EFFECTIVENESS_DATA = fullPokedexDataFromAPI.typeDamageRelations;
        console.log("Type effectiveness data stored.");
    } else {
        console.error("Type damage relations not found in Pokedex API data!");
    }

    console.log("onPokedexDataLoaded - Calling transformAndPopulateGamePokemonData");
    await transformAndPopulateGamePokemonData(fullPokedexDataFromAPI); 

    // --- Connect to WebSocket Server ---
    console.log("Attempting to connect to WebSocket server...");
    connectToServer(); // Call this after POKEMON_DATA is populated

    const starterName = "Pikachu"; 
    if (POKEMON_DATA[starterName] && POKEMON_DATA[starterName].sprites) {
        console.log(`Preloading sprites for default starter: ${starterName}`);
        const urls = POKEMON_DATA[starterName].sprites; 
        const preloadPromises = [];
        if (urls.animated_default) {
            preloadPromises.push(preloadPokemonSprite(starterName, urls.animated_default, 'animated_default'));
        } else if (urls.front_default) {
            preloadPromises.push(preloadPokemonSprite(starterName, urls.front_default, 'static_default'));
        }
        if (urls.animated_shiny) {
             preloadPromises.push(preloadPokemonSprite(starterName, urls.animated_shiny, 'animated_shiny'));
        } else if (urls.front_shiny) {
            preloadPromises.push(preloadPokemonSprite(starterName, urls.front_shiny, 'static_shiny'));
        }
        if (preloadPromises.length > 0) {
            await Promise.all(preloadPromises.map(p => p.catch(e => {
                console.warn(`A sprite preload for ${starterName} failed:`, e.message || e);
                return null; 
            })));
            console.log(`Default starter Pokemon (${starterName}) sprites preloading completed/attempted.`);
        } else {
            console.warn(`No valid sprite URLs found in POKEMON_DATA for starter: ${starterName}`);
        }
    } else {
        console.warn(`POKEMON_DATA or sprite URLs not found for starter: ${starterName}`);
    }

    try { await preloadHouseSprite('house.png'); } catch (error) { console.error("Error loading house sprite, game will continue without it or with a fallback."); }
    try { await preloadBedSprite('bed.png'); } catch (error) { console.error("Error loading bed sprite, game will use a fallback rectangle."); }
    try { await preloadHospitalSprite('hospital.png'); } catch (error) { console.error("Error loading hospital sprite, game will use a fallback rectangle."); }
    try { await preloadTreeSprite('tree1.png'); } catch (error) { console.error("Error loading tree sprite. Trees will not be rendered."); }

    console.log("onPokedexDataLoaded - Calling initializeMainGame");
    initializeMainGame(); 
    console.log("onPokedexDataLoaded - END");
}
function initializeMainGame() { loadingScreen.style.display = 'none'; canvas.style.display = 'block'; document.getElementById('ui-container').style.display = 'block'; GAME_STATE = 'IN_PLAYER_HOUSE'; previousGameState = 'IN_PLAYER_HOUSE'; if (typeof initializeMusic === 'function') { initializeMusic('./game_music.mp3'); } const muteBtn = document.getElementById('muteButton'); if (muteBtn && typeof toggleMute === 'function') { muteBtn.onclick = toggleMute; } initMobileControls(); initializePokemonStorageUI(); scaleGameAndUI(); window.addEventListener('resize', scaleGameAndUI); const houseAreaPos = findWalkableArea(TILE_SIZE * 3, TILE_SIZE * 3, Math.floor(playerHouse.width/TILE_SIZE), Math.floor(playerHouse.height/TILE_SIZE), 35); playerHouse.worldX = houseAreaPos.x; playerHouse.worldY = houseAreaPos.y; initializeMasterBallChests(); initializeNPCs(); player.screenX = NATIVE_WIDTH / 2; player.screenY = NATIVE_HEIGHT * 0.65; player.targetX = player.screenX; player.targetY = player.screenY; player.initTeam(); updatePlayerXpBar(); updatePokemonXpBar(); updateTeamPokemonStatusBars(); updatePokeCoinDisplay(); camera.update(); requestAnimationFrame(gameLoop); }
window.onload = () => { console.log("window.onload - START"); canvas.width = NATIVE_WIDTH; canvas.height = NATIVE_HEIGHT; if (typeof PokedexDataLoader !== 'undefined' && PokedexDataLoader.loadAllKantoData) { console.log("window.onload - Calling PokedexDataLoader.loadAllKantoData"); PokedexDataLoader.loadAllKantoData(onPokedexDataLoaded, updateLoadingProgress); } else { console.error("PokedexDataLoader is not available. Game cannot start."); updateLoadingProgress("Critical Error: PokedexDataLoader not found. Please check console.", 1); GAME_STATE = 'ERROR_LOADING'; } if (GAME_STATE === 'LOADING_ASSETS') { console.log("window.onload - Requesting first gameLoop frame while in LOADING_ASSETS"); requestAnimationFrame(gameLoop); } console.log("window.onload - END"); };

function executeSaveGame() {            
    const saveData = {
        player: {
            worldX: player.worldX, worldY: player.worldY,
            screenX: player.screenX, screenY: player.screenY,
            originWorldX: player.originWorldX, originWorldY: player.originWorldY,
            preHospitalWorldX: player.preHospitalWorldX, preHospitalWorldY: player.preHospitalWorldY,
            level: player.level, xp: player.xp, maxXp: player.maxXp, speed: player.speed,
            activeTasks: player.activeTasks,
            inventory: player.inventory,
            totalPlayTimeMs: player.totalPlayTimeMs,
            hasShinySpeedBoost: player.hasShinySpeedBoost,
            hasDarkAttackBoost: player.hasDarkAttackBoost,
            storedPokemon: player.storedPokemon.map(p => ({
                name: p.name, level: p.level, xp: p.xp, maxXp: p.maxXp,
                currentHp: p.currentHp, maxHp: p.maxHp, attack: p.attack,
                moves: p.moves.map(m => m.name), id: p.id, types: p.types,
                attackStage: p.attackStage, defenseStage: p.defenseStage, variant: p.variant,
                roamSpeed: p.roamSpeed,
                baseAttack: p.baseAttack, baseDefense: p.baseDefense,
                baseSpAttack: p.baseSpAttack, baseSpDefense: p.baseSpDefense,
                baseSpeed: p.baseSpeed
            }))
        },
        team: player.team.map(p => ({
            name: p.name, level: p.level, xp: p.xp, maxXp: p.maxXp,
            currentHp: p.currentHp, maxHp: p.maxHp, attack: p.attack,
            moves: p.moves.map(m => m.name), id: p.id, types: p.types,
            attackStage: p.attackStage, defenseStage: p.defenseStage,
            variant: p.variant,
            baseAttack: p.baseAttack,
            baseDefense: p.baseDefense,
            baseSpAttack: p.baseSpAttack,
            baseSpDefense: p.baseSpDefense,
            baseSpeed: p.baseSpeed,
            roamSpeed: p.roamSpeed
        })),
        gameTime: gameTime, weather: weather, worldSeed: worldSeed,
        lastMewtwoSpawnTime: lastMewtwoSpawnTime, mewtwoOnCooldown: mewtwoOnCooldown,
        discoveredHospitals: discoveredHospitals,
        npcs: NPCS.map(n => ({
            id: n.id, name: n.name, spriteChar: n.spriteChar, color: n.color,
            worldX: n.worldX, worldY: n.worldY,
            taskChainName: n.taskChainName,
            currentTaskChainIndex: n.currentTaskChainIndex,
            tasksCompletedThisCycle: n.tasksCompletedThisCycle,
            isAwaitingRespawn: n.isAwaitingRespawn,
            originalWorldX: n.originalWorldX,
            originalWorldY: n.originalWorldY,
            lastInteractionTime: n.lastInteractionTime
        })),
        playerHouse: {...playerHouse},
        masterBallChests: masterBallChests.map(chest => ({
            id: chest.id,
            worldX: chest.worldX,
            worldY: chest.worldY,
            isOpen: chest.isOpen
        })),
        houseItemChest: {...houseItemChest},
        worldPokeBalls: worldPokeBalls,
        gameState: (GAME_STATE === 'MENU_OPEN' || GAME_STATE === 'HOUSE_ACTION_PROMPT' || GAME_STATE === 'ITEM_CHEST_PROMPT' || GAME_STATE === 'POKEMON_STORAGE_UI' || GAME_STATE === 'NPC_INTERACTION' || GAME_STATE === 'MOVE_LEARNING_PROMPT' || GAME_STATE === 'HOSPITAL_HEAL_PROMPT') ? previousGameState : GAME_STATE,
        previousGameState: previousGameState 
    };
    localStorage.setItem('pokemonHunterSave', JSON.stringify(saveData));
    showGeneralMessage('Game Saved!');
}