// script6.js
// --- UI UPDATE FUNCTIONS ---
// --- POKEDEX FUNCTIONS ---

function openPokedex() {
    if (!pokedexPanel) return;

    // Store current game state to return to it later
    if (GAME_STATE !== 'POKEDEX_OPEN') { // Avoid overwriting if already open somehow
        previousGameState = GAME_STATE;
    }
    GAME_STATE = 'POKEDEX_OPEN';

    player.mouseDown = false; // Stop player movement
    player.joystickActive = false;
    player.isMoving = false;

    populatePokedexList();
    resetPokedexDetails(); // Clear details when opening
    pokedexPanel.style.display = 'flex'; // Use 'flex' as per CSS
}

function closePokedex() {
    if (!pokedexPanel) return;
    pokedexPanel.style.display = 'none';
    if (GAME_STATE === 'POKEDEX_OPEN') { // Only revert if we were in Pokedex state
        GAME_STATE = previousGameState;
    }
    // If previousGameState was something like MENU_OPEN, and that menu is also closed,
    // ensure it falls back to a playable state like ROAMING or IN_PLAYER_HOUSE.
    // This might need more robust state management if you have many layers of UI.
    if (GAME_STATE === 'MENU_OPEN' && gameMenu.style.display === 'none') {
        GAME_STATE = 'ROAMING'; // Or whatever the base state should be
    }
}

function resetPokedexDetails() {
    pokedexSpriteContainer.style.backgroundImage = 'none';
    pokedexSpriteContainer.textContent = '?';
    pokedexNameNumber.textContent = "Select a Pokémon";
    pokedexTypes.innerHTML = "Type(s): "; // Clear previous types
    pokedexStatHp.textContent = '-';
    pokedexStatAtk.textContent = '-';
    pokedexStatDef.textContent = '-';
    pokedexStatSpa.textContent = '-';
    pokedexStatSpd.textContent = '-';
    pokedexStatSpe.textContent = '-';
    pokedexDescription.textContent = "Select a Pokémon from the list to see its details.";

    // Remove 'selected-pokemon' class from any previously selected list item
    const currentlySelected = pokedexPokemonList.querySelector('.selected-pokemon');
    if (currentlySelected) {
        currentlySelected.classList.remove('selected-pokemon');
    }
}

function populatePokedexList() {
    if (!pokedexPokemonList) return;
    pokedexPokemonList.innerHTML = ''; // Clear existing list

    const caughtPokemonSet = new Set(); // To store unique Pokémon names encountered
    const allPlayerPokemon = [...player.team, ...player.storedPokemon];

    allPlayerPokemon.forEach(pkmn => {
        if (pkmn && !caughtPokemonSet.has(pkmn.name)) { // Check if we already listed this species
            caughtPokemonSet.add(pkmn.name); // Add its name to the set

            const baseData = POKEMON_DATA[pkmn.name];
            if (!baseData) return; // Skip if no base data (shouldn't happen for player's Pokemon)

            const listItem = document.createElement('li');
            listItem.textContent = `${baseData.name} (#${String(baseData.id).padStart(3, '0')})`;
            listItem.dataset.pokemonName = pkmn.name; // Store name for easy retrieval

            listItem.addEventListener('click', () => {
                // Find the first instance of this pokemon in the player's collection to display
                // (as stats might vary if they have multiple of the same species at different levels)
                // For simplicity, we'll just use the one that triggered this list item creation,
                // or the first one found if we want to be more specific.
                // Let's use the first encountered one for the Pokedex entry.
                const pokemonToDisplay = allPlayerPokemon.find(p => p.name === pkmn.name);
                if (pokemonToDisplay) {
                    displayPokedexEntry(pokemonToDisplay);

                    // Handle visual selection in the list
                    const currentlySelected = pokedexPokemonList.querySelector('.selected-pokemon');
                    if (currentlySelected) {
                        currentlySelected.classList.remove('selected-pokemon');
                    }
                    listItem.classList.add('selected-pokemon');
                }
            });
            pokedexPokemonList.appendChild(listItem);
        }
    });

    if (pokedexPokemonList.children.length === 0) {
        pokedexPokemonList.innerHTML = '<li>No Pokémon caught yet.</li>';
    }
}

async function displayPokedexEntry(pokemon) { // Added async
    if (!pokemon) {
        resetPokedexDetails();
        return;
    }

    const baseData = POKEMON_DATA[pokemon.name];
    if (!baseData) {
        console.error("No base data for Pokedex entry:", pokemon.name);
        resetPokedexDetails();
        return;
    }

    // Sprite/Character
    let spriteToUse = null;
    const defaultSpriteUrl = baseData.sprites.front_default; // Pokedex usually shows default static
    if (defaultSpriteUrl) {
        spriteToUse = await getOrLoadPokemonSprite(pokemon.name, 'static_default', defaultSpriteUrl);
    }

    if (spriteToUse instanceof Image) { // Check if it's actually an image
        pokedexSpriteContainer.style.backgroundImage = `url('${spriteToUse.src}')`;
        pokedexSpriteContainer.textContent = '';
        pokedexSpriteContainer.style.backgroundColor = 'transparent';
    } else {
        pokedexSpriteContainer.style.backgroundImage = 'none';
        pokedexSpriteContainer.textContent = baseData.spriteChar || '?';
        pokedexSpriteContainer.style.backgroundColor = baseData.color || '#CCC';
    }

    pokedexNameNumber.textContent = `${baseData.name} (#${String(baseData.id).padStart(3, '0')})`;

    pokedexTypes.innerHTML = "Type(s): ";
    baseData.types.forEach(type => {
        const typeSpan = document.createElement('span');
        typeSpan.classList.add('pokedex-type-span');
        typeSpan.textContent = type.charAt(0).toUpperCase() + type.slice(1);
        typeSpan.style.backgroundColor = TYPE_COLORS_MAP[type.toLowerCase()] || '#777';
        pokedexTypes.appendChild(typeSpan);
    });

    pokedexStatHp.textContent = baseData.baseHp;
    pokedexStatAtk.textContent = baseData.baseAtk;
    pokedexStatDef.textContent = baseData.baseDef;
    pokedexStatSpa.textContent = baseData.baseSpAtk;
    pokedexStatSpd.textContent = baseData.baseSpDef;
    pokedexStatSpe.textContent = baseData.baseSpeed;

    pokedexDescription.textContent = baseData.description || "No description available.";
}
function updatePlayerXpBar() { if (!playerStatusLabel || !playerHpBarFill || !playerHpBarValueText || !playerXpBarFill || !playerXpBarValueText) { return; } playerStatusLabel.textContent = `Player LVL ${player.level}`; playerHpBarFill.style.width = `100%`; playerHpBarValueText.textContent = `${player.maxXp}/${player.maxXp}`; playerXpBarFill.style.width = `${(player.xp / player.maxXp) * 100}%`; playerXpBarValueText.textContent = `${Math.floor(player.xp)}/${Math.floor(player.maxXp)}`; }
function updatePokemonXpBar() { if (!pokemonStatusLabel || !pokemonHpBarFill || !pokemonHpBarValueText || !pokemonXpBarFill || !pokemonXpBarValueText) { return; } if (player.team.length > 0) { const p = (currentBattle && currentBattle.playerPokemon) ? currentBattle.playerPokemon : player.team[0]; if (p) { pokemonStatusLabel.textContent = `${p.displayName} LVL ${p.level}`; pokemonHpBarFill.style.width = `${Math.max(0, (p.currentHp / p.maxHp) * 100)}%`; pokemonHpBarValueText.textContent = `${Math.max(0, p.currentHp)}/${p.maxHp}`; pokemonXpBarFill.style.width = `${Math.max(0, (p.xp / p.maxXp) * 100)}%`; pokemonXpBarValueText.textContent = `${Math.floor(p.xp)}/${Math.floor(p.maxXp)}`; } else { pokemonStatusLabel.textContent = "No Active Pokemon"; pokemonHpBarValueText.textContent = "-/-"; pokemonHpBarFill.style.width = `0%`; pokemonXpBarValueText.textContent = "-/-"; pokemonXpBarFill.style.width = `0%`; } } else { pokemonStatusLabel.textContent = "No Pokemon in Team"; pokemonHpBarValueText.textContent = "-/-"; pokemonHpBarFill.style.width = `0%`; pokemonXpBarValueText.textContent = "-/-"; pokemonXpBarFill.style.width = `0%`; } updateTeamPokemonStatusBars(); }
function updateTeamPokemonStatusBars() { if (!teamStatusBarsContainer) return; teamStatusBarsContainer.innerHTML = ''; player.team.forEach(pkmn => { if (!pkmn) return; const statusBarDiv = document.createElement('div'); statusBarDiv.className = 'team-member-xp-bar-container'; const indicatorDiv = document.createElement('div'); indicatorDiv.className = 'team-member-indicator'; indicatorDiv.style.backgroundColor = pkmn.color || '#888'; const xpFillDiv = document.createElement('div'); xpFillDiv.className = 'xp-bar-fill team-member-xp-bar-fill'; xpFillDiv.style.width = `${Math.max(0, (pkmn.xp / pkmn.maxXp) * 100)}%`; xpFillDiv.style.backgroundColor = pkmn.currentHp <= 0 ? '#e04040' : '#60d060'; const textDiv = document.createElement('div'); textDiv.className = 'xp-bar-text team-member-xp-bar-text'; textDiv.textContent = `${pkmn.name.substring(0,7)}${pkmn.name.length > 7 ? '..' : ''} L${pkmn.level} (${Math.floor(pkmn.xp)}/${Math.floor(pkmn.maxXp)}) HP:${Math.max(0, pkmn.currentHp)}/${pkmn.maxHp}`; if (pkmn.currentHp <= 0) { textDiv.style.color = '#FF8888'; } statusBarDiv.appendChild(indicatorDiv); statusBarDiv.appendChild(xpFillDiv); statusBarDiv.appendChild(textDiv); teamStatusBarsContainer.appendChild(statusBarDiv); }); }
function showGeneralMessage(text, duration = 3000) { generalMessageArea.textContent = text; generalMessageArea.style.display = 'block'; clearTimeout(messageTimer); messageTimer = setTimeout(() => { generalMessageArea.style.display = 'none'; }, duration); }
function updatePokeCoinDisplay() {
    if (!pokeCoinDisplayEl || !pokeCoinAmountEl) return;

    // --- New Positioning Logic ---
    const MINIMAP_ACTUAL_SIZE_PX = NATIVE_WIDTH * 0.15;
    const MAIN_STATUS_AREA_HEIGHT_ESTIMATE = 80;
    const GAP_BELOW_MINIMAP = 10;

    const minimapCenterY = NATIVE_HEIGHT - MINIMAP_MARGIN - (MINIMAP_ACTUAL_SIZE_PX / 2) - MAIN_STATUS_AREA_HEIGHT_ESTIMATE;
    const minimapBottomEdgeY = minimapCenterY + (MINIMAP_ACTUAL_SIZE_PX / 2);

    pokeCoinDisplayEl.style.left = `${MINIMAP_MARGIN}px`;
    pokeCoinDisplayEl.style.top = `${minimapBottomEdgeY + GAP_BELOW_MINIMAP}px`;
    pokeCoinDisplayEl.style.transform = 'none';


    // --- Existing Visibility and Content Logic ---
    if (player.inventory.PokeCoin > 0 || pokeCoinDisplayEl.dataset.hasBeenVisible === 'true') {
        pokeCoinDisplayEl.style.display = 'inline-flex';
        pokeCoinAmountEl.textContent = player.inventory.PokeCoin;
        if (player.inventory.PokeCoin > 0) {
            pokeCoinDisplayEl.dataset.hasBeenVisible = 'true';
        }
    } else {
        pokeCoinDisplayEl.style.display = 'none';
    }
}
function updateGuidingArrowState() { player.showGuidingArrow = false; player.guidingArrowTargetNPC = null; if (GAME_STATE !== 'ROAMING' && GAME_STATE !== 'MENU_OPEN') { return; } for (const activeTask of player.activeTasks) { if (activeTask.taskDetails) { const npcForThisTask = NPCS.find(npc => npc.id === activeTask.npcId); if (npcForThisTask && !npcForThisTask.isAwaitingRespawn) { const taskDefinition = ALL_NPC_TASK_CHAINS[npcForThisTask.taskChainName]?.[npcForThisTask.currentTaskChainIndex]; if (activeTask.taskDetails.objective === taskDefinition?.objective && isTaskCompletable(activeTask, taskDefinition)) { player.showGuidingArrow = true; player.guidingArrowTargetNPC = npcForThisTask; break; } } } } }
function updateHtmlGuidingArrow() { const guidingArrowEl = document.getElementById('guidingArrow'); if (!player.showGuidingArrow || !player.guidingArrowTargetNPC || !guidingArrowEl) { if (guidingArrowEl) { guidingArrowEl.style.display = 'none'; guidingArrowEl.classList.remove('pulsing'); } return; } guidingArrowEl.style.display = 'block'; if (!guidingArrowEl.classList.contains('pulsing')) { guidingArrowEl.classList.add('pulsing'); } const arrowScreenX = NATIVE_WIDTH / 2; const arrowScreenY = parseFloat(getComputedStyle(guidingArrowEl).top || '40px'); const npcScreenX = player.guidingArrowTargetNPC.worldX - camera.x; const npcScreenY = player.guidingArrowTargetNPC.worldY - camera.y; const deltaX = npcScreenX - arrowScreenX; const deltaY = npcScreenY - arrowScreenY; let angleRadians = Math.atan2(deltaY, deltaX); let angleDegrees = angleRadians * (180 / Math.PI); angleDegrees += 90; guidingArrowEl.style.setProperty('--arrow-rotation', `${angleDegrees}deg`); }

// --- INITIALIZATION FUNCTIONS ---
function initializeMasterBallChests() { console.log("%%%% initializeMasterBallChests CALLED %%%%"); masterBallChests = []; MASTER_BALL_CHEST_DEFINITIONS.forEach(def => { let attempts = 0; let foundSpot = false; let chestWorldX = 0; let chestWorldY = 0; while (!foundSpot && attempts < 100) { const angle = Math.random() * Math.PI * 2; const radiusUnits = (def.baseRadiusMeters + (Math.random() * def.randomOffsetMeters)) * DISTANCE_UNIT_PER_METER; const potentialX = playerHouse.worldX + Math.cos(angle) * radiusUnits; const potentialY = playerHouse.worldY + Math.sin(angle) * radiusUnits; let spawnPos = findWalkableSpawn(potentialX, potentialY, 5); if (isWalkable(spawnPos.x, spawnPos.y)) { let collision = false; for (const existingChest of masterBallChests) { const distSq = distanceSq(spawnPos.x, spawnPos.y, existingChest.worldX, existingChest.worldY); if (distSq < (MASTER_BALL_CHEST_SIZE * 2)**2) { collision = true; break; } } if (!collision) { chestWorldX = spawnPos.x; chestWorldY = spawnPos.y; foundSpot = true; } } attempts++; } if (!foundSpot) { console.warn(`Could not find ideal spot for Master Ball Chest ${def.id}. Placing at default offset.`); const angle = Math.random() * Math.PI * 2; const radiusUnits = def.baseRadiusMeters * DISTANCE_UNIT_PER_METER; chestWorldX = playerHouse.worldX + Math.cos(angle) * radiusUnits; chestWorldY = playerHouse.worldY + Math.sin(angle) * radiusUnits; } masterBallChests.push({ id: def.id, worldX: chestWorldX, worldY: chestWorldY, size: MASTER_BALL_CHEST_SIZE, isOpen: false, spriteChar: MASTER_BALL_CHEST_SPRITE_CHAR }); console.log(`Initialized Master Ball Chest ${def.id} at (${Math.floor(chestWorldX/TILE_SIZE)}, ${Math.floor(chestWorldY/TILE_SIZE)})`); }); }
function initializeNPCs() { const npcBaseDataArray = [ {id: "TrainerJoe", name: "Trainer Joe", spriteChar: "J", color: "#4682B4", taskChain: "npc_tier_1"}, {id: "RangerSue", name: "Ranger Sue", spriteChar: "S", color: "#2E8B57", taskChain: "npc_tier_2"}, {id: "FishermanPete", name: "Fisherman Pete", spriteChar: "F", color: "#B0C4DE", taskChain: "npc_tier_3"}, {id: "HikerMike", name: "Hiker Mike", spriteChar: "M", color: "#8B4513", taskChain: "default"}, {id: "CollectorKim", name: "Collector Kim", spriteChar: "K", color: "#DA70D6", taskChain: "default"}, ]; NPCS = []; let npc1SpawnX = 0, npc1SpawnY = 0; if (npcBaseDataArray.length > 0) { const npcData0 = npcBaseDataArray[0]; const distanceFromHouseMeters = 10; const distanceFromHouseUnits = distanceFromHouseMeters * TILE_SIZE; const angleFromHouse = 0; let initialTargetX0 = playerHouse.worldX + Math.cos(angleFromHouse) * distanceFromHouseUnits; let initialTargetY0 = playerHouse.worldY + Math.sin(angleFromHouse) * distanceFromHouseUnits; let spawnPos0 = findWalkableSpawn(initialTargetX0, initialTargetY0, 15); npc1SpawnX = spawnPos0.x; npc1SpawnY = spawnPos0.y; NPCS.push({ id: npcData0.id, name: npcData0.name, spriteChar: npcData0.spriteChar, color: npcData0.color, worldX: npc1SpawnX, worldY: npc1SpawnY, taskChainName: npcData0.taskChain || 'default', currentTaskChainIndex: 0, tasksCompletedThisCycle: 0, isAwaitingRespawn: false, originalWorldX: npc1SpawnX, originalWorldY: npc1SpawnY, lastInteractionTime: 0 }); } else { console.error("npcBaseDataArray is empty, cannot spawn NPCs."); return; } const numOtherNPCs = npcBaseDataArray.length - 1; if (numOtherNPCs > 0) { const angleIncrement = (2 * Math.PI) / numOtherNPCs; for (let i = 1; i < npcBaseDataArray.length; i++) { const npcData = npcBaseDataArray[i]; const distanceFromPrevMeters = 50 + i * 50; const distanceFromPrevUnits = distanceFromPrevMeters * TILE_SIZE; const angleAroundPrev = (i - 1) * angleIncrement + Math.PI / 4; let initialTargetX = npc1SpawnX + Math.cos(angleAroundPrev) * distanceFromPrevUnits; let initialTargetY = npc1SpawnY + Math.sin(angleAroundPrev) * distanceFromPrevUnits; let spawnPos = findWalkableSpawn(initialTargetX, initialTargetY, 20); NPCS.push({ id: npcData.id, name: npcData.name, spriteChar: npcData.spriteChar, color: npcData.color, worldX: spawnPos.x, worldY: spawnPos.y, taskChainName: npcData.taskChain || 'default', currentTaskChainIndex: 0, tasksCompletedThisCycle: 0, isAwaitingRespawn: false, originalWorldX: spawnPos.x, originalWorldY: spawnPos.y, lastInteractionTime: 0 }); } } }
function initializePokemonStorageUI() { pokemonStorageUI.buttons = []; pokemonStorageUI.teamListArea.scrollY = 0; pokemonStorageUI.storedListArea.scrollY = 0; }
function scaleGameAndUI() { const viewportWidth = window.innerWidth; const viewportHeight = window.innerHeight; const scaleX = viewportWidth / NATIVE_WIDTH; const scaleY = viewportHeight / NATIVE_HEIGHT; currentCanvasScale = Math.min(scaleX, scaleY); const gameWrapper = document.getElementById('game-wrapper'); if (!gameWrapper) { console.error("#game-wrapper element not found! Cannot scale UI."); return; } const scaledGameWidth = NATIVE_WIDTH * currentCanvasScale; const scaledGameHeight = NATIVE_HEIGHT * currentCanvasScale; gameWrapper.style.width = `${NATIVE_WIDTH}px`; gameWrapper.style.height = `${NATIVE_HEIGHT}px`; gameWrapper.style.transform = `scale(${currentCanvasScale})`; gameWrapper.style.transformOrigin = 'top left'; gameWrapper.style.marginLeft = `${(viewportWidth - scaledGameWidth) / 2}px`; gameWrapper.style.marginTop = `${(viewportHeight - scaledGameHeight) / 2}px`; gameWrapper.style.marginRight = 'auto'; gameWrapper.style.marginBottom = 'auto'; if (GAME_STATE !== 'ROAMING' && GAME_STATE !== 'MENU_OPEN' && GAME_STATE !== 'LOADING_ASSETS') { player.screenX = player.screenX || NATIVE_WIDTH / 2; player.screenY = player.screenY || NATIVE_HEIGHT * 0.65; player.targetX = player.screenX; player.targetY = player.screenY; } else if (GAME_STATE === 'ROAMING' || GAME_STATE === 'MENU_OPEN') { player.screenX = NATIVE_WIDTH / 2; player.screenY = NATIVE_HEIGHT / 2; player.targetX = player.screenX; player.targetY = player.screenY; } if (joystickContainer.style.display === 'block') { setTimeout(() => { if(joystickBase && joystickNub) { joystickBaseRect = joystickBase.getBoundingClientRect(); joystickNubCenterX = joystickNub.offsetLeft + joystickNub.offsetWidth / 2; joystickNubCenterY = joystickNub.offsetTop + joystickNub.offsetHeight / 2; } }, 0); } }
function initMobileControls() { if (isMobileDevice()) { joystickContainer.style.display = 'block'; joystickBaseRect = joystickBase.getBoundingClientRect(); joystickNubCenterX = joystickNub.offsetLeft + joystickNub.offsetWidth / 2; joystickNubCenterY = joystickNub.offsetTop + joystickNub.offsetHeight / 2; joystickNub.addEventListener('touchstart', handleJoystickStart, { passive: false }); document.addEventListener('touchmove', handleJoystickMove, { passive: false }); document.addEventListener('touchend', handleJoystickEnd, { passive: false }); document.addEventListener('touchcancel', handleJoystickEnd, { passive: false }); joystickContainer.addEventListener('touchmove', e => e.preventDefault(), { passive: false }); } }
function updateLoadingProgress(message, percentage) { if (loadingMessage) loadingMessage.textContent = message; if (loadingProgressBar) loadingProgressBar.style.width = `${Math.max(0, Math.min(100, percentage * 100))}%`; }

// --- GAME LOOP & UPDATE ---
let lastPlayerUpdateSentTime = 0; // Timer for sending player updates
const PLAYER_UPDATE_INTERVAL = 100; // Send updates every 100ms (10 times per second)

function update(deltaTime) {
    try {
        if (GAME_STATE === 'LOADING_ASSETS' || GAME_STATE === 'ERROR_LOADING') return;
        const dts = deltaTime / 1000;

        // Multiplayer: Send player update periodically
        if (GAME_STATE === 'ROAMING' || GAME_STATE === 'IN_PLAYER_HOUSE') { // Only send updates if player is in a "world" state
            lastPlayerUpdateSentTime += deltaTime;
            if (lastPlayerUpdateSentTime >= PLAYER_UPDATE_INTERVAL) {
                sendPlayerUpdate();
                lastPlayerUpdateSentTime = 0;
            }
        }

        if (GAME_STATE === 'ROAMING') {
            updateOverworldParticles(dts);
            player.isMoving = false;
            let intendedPlayerMoveX = 0;
            let intendedPlayerMoveY = 0;
            if (player.joystickActive && player.joystickMagnitude > 0) {
                player.isMoving = true;
                intendedPlayerMoveX = Math.cos(player.joystickAngle) * player.speed * player.joystickMagnitude * dts;
                intendedPlayerMoveY = Math.sin(player.joystickAngle) * player.speed * player.joystickMagnitude * dts;
                player.lastAngle = player.joystickAngle;
            } else if (player.mouseDown) {
                const dxToTarget = player.targetX - (NATIVE_WIDTH / 2);
                const dyToTarget = player.targetY - (NATIVE_HEIGHT / 2);
                const distToTarget = Math.sqrt(dxToTarget * dxToTarget + dyToTarget * dyToTarget);
                if (distToTarget > PLAYER_SIZE / 4) {
                    player.isMoving = true;
                    const moveAngle = Math.atan2(dyToTarget, dxToTarget);
                    intendedPlayerMoveX = Math.cos(moveAngle) * player.speed * dts;
                    intendedPlayerMoveY = Math.sin(moveAngle) * player.speed * dts;
                    player.lastAngle = moveAngle;
                } else {
                    player.isMoving = false;
                }
            }
            if (player.isMoving) {
                 player.animationTimer += player.animationSpeed * (deltaTime / (1000/60)); // Scale animation speed with deltaTime
                if (player.animationTimer >= 1) {
                    player.animationFrame = (player.animationFrame + 1) % 2;
                    player.animationTimer = 0;
                }
                let potentialNextPlayerX = player.worldX + intendedPlayerMoveX;
                let potentialNextPlayerY = player.worldY + intendedPlayerMoveY;
                let collidingWithAnyHospitalX = false;
                let collidingWithAnyHospitalY = false;
                for (const hospital of discoveredHospitals.filter(h => h.worldX !== -Infinity)) {
                    if (isCollidingWithHospital(potentialNextPlayerX, player.worldY, PLAYER_SIZE, hospital)) {
                        collidingWithAnyHospitalX = true; break;
                    }
                }
                for (const hospital of discoveredHospitals.filter(h => h.worldX !== -Infinity)) {
                    if (isCollidingWithHospital(player.worldX, potentialNextPlayerY, PLAYER_SIZE, hospital)) {
                        collidingWithAnyHospitalY = true; break;
                    }
                }
                let collidingWithAnyTreeX = false;
                let collidingWithAnyTreeY = false;
                for (const tree of worldTrees) {
                    if (isCollidingWithTree(potentialNextPlayerX, player.worldY, PLAYER_SIZE, PLAYER_SIZE, tree)) {
                        collidingWithAnyTreeX = true; break;
                    }
                }
                for (const tree of worldTrees) {
                    if (isCollidingWithTree(player.worldX, potentialNextPlayerY, PLAYER_SIZE, PLAYER_SIZE, tree)) {
                        collidingWithAnyTreeY = true; break;
                    }
                }
                if (isWalkable(potentialNextPlayerX, player.worldY) && !isCollidingWithHouse(potentialNextPlayerX, player.worldY, PLAYER_SIZE) && !collidingWithAnyHospitalX && !collidingWithAnyTreeX) {
                    player.worldX = potentialNextPlayerX;
                }
                if (isWalkable(player.worldX, potentialNextPlayerY) && !isCollidingWithHouse(player.worldX, potentialNextPlayerY, PLAYER_SIZE) && !collidingWithAnyHospitalY && !collidingWithAnyTreeY) {
                    player.worldY = potentialNextPlayerY;
                }
            } else {
                player.animationFrame = 0;
            }
            const activeFollower = player.team.find(p => p.isFollowingPlayer && p.currentHp > 0);
            if (activeFollower && POKEMON_DATA[activeFollower.name]) {
                activeFollower.followerSpeed = player.speed * 0.85;
                const distSinceLastPathPointSq = activeFollower.followerPath.length > 0 ? distanceSq(player.worldX, player.worldY, activeFollower.followerPath[0].x, activeFollower.followerPath[0].y) : (TILE_SIZE * TILE_SIZE);
                if (distSinceLastPathPointSq > (TILE_SIZE * 0.2) ** 2 || activeFollower.followerPath.length === 0) {
                    activeFollower.followerPath.unshift({ x: player.worldX, y: player.worldY });
                    if (activeFollower.followerPath.length > activeFollower.followerMaxPathLength) {
                        activeFollower.followerPath.pop();
                    }
                }
                if (activeFollower.followerPath.length > 0) {
                    let targetIndex = 0;
                    let cumulativeDistance = 0;
                    for (let i = 0; i < activeFollower.followerPath.length - 1; i++) {
                        cumulativeDistance += Math.sqrt(distanceSq( activeFollower.followerPath[i].x, activeFollower.followerPath[i].y, activeFollower.followerPath[i+1].x, activeFollower.followerPath[i+1].y ));
                        if (cumulativeDistance >= activeFollower.followerFollowDistanceThreshold) {
                            targetIndex = i + 1; break;
                        }
                        targetIndex = i + 1;
                    }
                    targetIndex = Math.min(targetIndex, activeFollower.followerPath.length - 1);
                    activeFollower.followerTargetX = activeFollower.followerPath[targetIndex].x;
                    activeFollower.followerTargetY = activeFollower.followerPath[targetIndex].y;
                    if (activeFollower.followerPath.length > 1) {
                        const oldestPoint = activeFollower.followerPath[activeFollower.followerPath.length - 1];
                        if (distanceSq(activeFollower.worldX, activeFollower.worldY, oldestPoint.x, oldestPoint.y) < (TILE_SIZE * 0.3) ** 2) {
                            activeFollower.followerPath.pop();
                        }
                    }
                } else {
                    const angleBehind = (player.lastAngle || 0) + Math.PI;
                    activeFollower.followerTargetX = player.worldX + Math.cos(angleBehind) * TILE_SIZE;
                    activeFollower.followerTargetY = player.worldY + Math.sin(angleBehind) * TILE_SIZE;
                }
                const dxToFollowerTarget = activeFollower.followerTargetX - activeFollower.worldX;
                const dyToFollowerTarget = activeFollower.followerTargetY - activeFollower.worldY;
                let distToFollowerTarget = Math.sqrt(dxToFollowerTarget * dxToFollowerTarget + dyToFollowerTarget * dyToFollowerTarget);
                let currentFollowerSpeed = activeFollower.followerSpeed;
                const overallDistToPlayer = Math.sqrt(distanceSq(activeFollower.worldX, activeFollower.worldY, player.worldX, player.worldY));
                if (overallDistToPlayer > activeFollower.followerWarpDistance) {
                    const angleBehindPlayer = (player.lastAngle || -Math.PI / 2) + Math.PI;
                    activeFollower.worldX = player.worldX + Math.cos(angleBehindPlayer) * TILE_SIZE * 0.5;
                    activeFollower.worldY = player.worldY + Math.sin(angleBehindPlayer) * TILE_SIZE * 0.5;
                    activeFollower.followerPath = [{ x: player.worldX, y: player.worldY }];
                    distToFollowerTarget = 0;
                } else if (overallDistToPlayer > activeFollower.followerCatchUpDistance) {
                    currentFollowerSpeed = player.speed * 1.15;
                } else if (overallDistToPlayer < activeFollower.followerFollowDistanceThreshold * 0.7 && distToFollowerTarget < TILE_SIZE * 0.3) {
                    distToFollowerTarget = 0;
                }
                if (distToFollowerTarget > TILE_SIZE * 0.1) {
                    const moveAngleToTarget = Math.atan2(dyToFollowerTarget, dxToFollowerTarget);
                    let intendedFollowerMoveX = Math.cos(moveAngleToTarget) * currentFollowerSpeed * dts;
                    let intendedFollowerMoveY = Math.sin(moveAngleToTarget) * currentFollowerSpeed * dts;
                    let potentialFollowerNextX = activeFollower.worldX + intendedFollowerMoveX;
                    let potentialFollowerNextY = activeFollower.worldY + intendedFollowerMoveY;
                    const followerCollisionSize = POKEMON_SPRITE_SIZE * 0.6;
                    let followerCollidingWithAnyHospitalX = false;
                    let followerCollidingWithAnyHospitalY = false;
                    for (const hospital of discoveredHospitals.filter(h => h.worldX !== -Infinity)) {
                        if (isCollidingWithHospital(potentialFollowerNextX, activeFollower.worldY, followerCollisionSize, hospital)) {
                            followerCollidingWithAnyHospitalX = true; break;
                        }
                    }
                    for (const hospital of discoveredHospitals.filter(h => h.worldX !== -Infinity)) {
                        if (isCollidingWithHospital(activeFollower.worldX, potentialFollowerNextY, followerCollisionSize, hospital)) {
                            followerCollidingWithAnyHospitalY = true; break;
                        }
                    }
                    let followerCollidingWithAnyTreeX = false;
                    let followerCollidingWithAnyTreeY = false;
                    for (const tree of worldTrees) {
                        if (isCollidingWithTree(potentialFollowerNextX, activeFollower.worldY, followerCollisionSize, followerCollisionSize, tree)) {
                            followerCollidingWithAnyTreeX = true; break;
                        }
                    }
                    for (const tree of worldTrees) {
                        if (isCollidingWithTree(activeFollower.worldX, potentialFollowerNextY, followerCollisionSize, followerCollisionSize, tree)) {
                            followerCollidingWithAnyTreeY = true; break;
                        }
                    }
                    if (isWalkable(potentialFollowerNextX, activeFollower.worldY) && !isCollidingWithHouse(potentialFollowerNextX, activeFollower.worldY, followerCollisionSize) && !followerCollidingWithAnyHospitalX && !followerCollidingWithAnyTreeX) {
                        activeFollower.worldX = potentialFollowerNextX;
                    }
                    if (isWalkable(activeFollower.worldX, potentialFollowerNextY) && !isCollidingWithHouse(activeFollower.worldX, potentialFollowerNextY, followerCollisionSize) && !followerCollidingWithAnyHospitalY && !followerCollidingWithAnyTreeY) {
                        activeFollower.worldY = potentialFollowerNextY;
                    }
                }
            }
            camera.update();
            discoverAndSpawnHospitals();
            spawnWildPokemon();
            spawnWorldTrees();
            despawnFarPokemon();
            wildPokemon.forEach(pkmn => { if (!pkmn.isFollowingPlayer) updateWildPokemonRoaming(pkmn, dts); });
            if (GAME_STATE === 'ROAMING' && !currentBattle) {
                wildPokemon.forEach(wp => {
                    if (currentBattle) return;
                    const distSq = (wp.worldX - player.worldX)**2 + (wp.worldY - player.worldY)**2;
                    const collisionThresholdSq = (TILE_SIZE * 1.3)**2;
                    if (distSq < collisionThresholdSq) {
                        if (player.team.some(p => p.currentHp > 0)) {
                            player.mouseDown = false; player.joystickActive = false; player.isMoving = false;
                            startBattle(wp);
                        }
                    }
                });
            }
            if (GAME_STATE === 'ROAMING' && !currentBattle) {
                NPCS.forEach(npc => {
                    if (!npc.isAwaitingRespawn) {
                        const distSq = (npc.worldX - player.worldX)**2 + (npc.worldY - player.worldY)**2;
                        if (distSq < (NPC_SPRITE_SIZE * 1.5)**2 && Date.now() > (player.npcInteractionCooldownEnd || 0)) {
                            player.mouseDown = false; player.joystickActive = false; player.isMoving = false;
                            currentInteractingNPC = npc; previousGameState = GAME_STATE; GAME_STATE = 'NPC_INTERACTION';
                            setupNpcInteractionPrompt();
                        }
                    }
                });
                discoveredHospitals.forEach(h => {
                    if (h.worldX !== -Infinity && Math.abs(player.worldX - h.worldX) < h.size / 1.5 && Math.abs(player.worldY - h.worldY) < h.size / 1.5 && Date.now() > (player.npcInteractionCooldownEnd || 0)) {
                        player.mouseDown = false; player.joystickActive = false; player.isMoving = false;
                        let exitSpot = findWalkableSpawn(h.worldX, h.worldY + h.size * 0.75, 3);
                        player.preHospitalWorldX = exitSpot.x; player.preHospitalWorldY = exitSpot.y;
                        previousGameState = GAME_STATE; GAME_STATE = 'HOSPITAL_INTERIOR';
                        player.screenX = NATIVE_WIDTH / 2; player.screenY = NATIVE_HEIGHT * 0.75;
                        nurseScreenPos = { x: NATIVE_WIDTH / 2, y: NATIVE_HEIGHT * 0.35 };
                        healPromptActive = false;
                        player.npcInteractionCooldownEnd = Date.now() + 500;
                    }
                });
            }
            manageWorldPokeBalls();
            for (let i = worldPokeBalls.length - 1; i >= 0; i--) {
                const ball = worldPokeBalls[i];
                const distSqToBall = (ball.worldX - player.worldX)**2 + (ball.worldY - player.worldY)**2;
                if (distSqToBall < POKEBALL_PICKUP_RADIUS_SQ) {
                    player.inventory.PokeBall++;
                    showGeneralMessage(`Picked up a PokeBall! You have ${player.inventory.PokeBall}.`);
                    worldPokeBalls.splice(i, 1);
                    break;
                }
            }
        } else if (GAME_STATE === 'IN_PLAYER_HOUSE') {
            player.isMoving = false;
            // let intendedPlayerScreenMoveX = 0; // Not strictly needed if worldX/Y are primary
            // let intendedPlayerScreenMoveY = 0;

            if (player.mouseDown || player.joystickActive) {
                let moveAngle;
                let moveMagnitude = 1.0; // Default magnitude

                if (player.joystickActive && player.joystickMagnitude > 0) {
                    moveAngle = player.joystickAngle;
                    moveMagnitude = player.joystickMagnitude;
                    player.isMoving = true; // Set moving if joystick is active with magnitude
                } else if (player.mouseDown) {
                    // Use player.screenX/Y for target calculation as it's the house view
                    const dxToTarget = player.targetX - player.screenX;
                    const dyToTarget = player.targetY - player.screenY;
                    const distToTarget = Math.sqrt(dxToTarget * dxToTarget + dyToTarget * dyToTarget);

                    if (distToTarget > PLAYER_SIZE / 4) { // Threshold to start moving
                        moveAngle = Math.atan2(dyToTarget, dxToTarget);
                        player.isMoving = true;
                    } else {
                        player.isMoving = false;
                        player.mouseDown = false; // Stop mouse-based movement if target reached
                    }
                }

                if (player.isMoving && typeof moveAngle !== 'undefined') {
                    const moveSpeedInHouse = player.speed * 0.7; // Can adjust speed for in-house
                    
                    const worldMoveX = Math.cos(moveAngle) * moveSpeedInHouse * moveMagnitude * dts;
                    const worldMoveY = Math.sin(moveAngle) * moveSpeedInHouse * moveMagnitude * dts;

                    // Update worldX and worldY - this is sent to other players
                    player.worldX += worldMoveX;
                    player.worldY += worldMoveY;

                    // Update screenX and screenY for local display, constrained to house boundaries
                    let nextScreenX = player.screenX + worldMoveX; // Move screen by the same delta
                    let nextScreenY = player.screenY + worldMoveY;
                    
                    const houseBoundaryPadding = PLAYER_SIZE / 2 + 5;
                    player.screenX = Math.max(houseBoundaryPadding, Math.min(nextScreenX, NATIVE_WIDTH - houseBoundaryPadding));
                    player.screenY = Math.max(houseBoundaryPadding, Math.min(nextScreenY, NATIVE_HEIGHT - houseBoundaryPadding));
                    
                    player.lastAngle = moveAngle;
                }
            }

            if (player.isMoving) {
                player.animationTimer += player.animationSpeed * (deltaTime / (1000/60));
                if (player.animationTimer >= 1) {
                    player.animationFrame = (player.animationFrame + 1) % 2;
                    player.animationTimer = 0;
                }
            } else {
                player.animationFrame = 0;
            }
            const followerInHouse = player.team.find(p => p.isFollowingPlayer && p.currentHp > 0);
            if (followerInHouse) {
                // Follower in house should follow the player's screen position, visually
                // Its worldX/Y will be tied to player's worldX/Y for consistency if needed elsewhere
                followerInHouse.worldX = player.worldX; 
                followerInHouse.worldY = player.worldY;
                // For drawing in house, its screen position is relative to player's screen pos
                // This is handled in player.draw() method if it draws the follower there.
            }
        }
        if (GAME_STATE !== 'PAUSED' && GAME_STATE !== 'MENU_OPEN' && GAME_STATE !== 'BATTLE' && GAME_STATE !== 'BATTLE_STARTING' && GAME_STATE !== 'POKEMON_STORAGE_UI' && GAME_STATE !== 'ITEM_CHEST_PROMPT' && GAME_STATE !== 'MOVE_LEARNING_PROMPT' && GAME_STATE !== 'NPC_INTERACTION' && GAME_STATE !== 'HOUSE_ACTION_PROMPT') {
            updateEnvironmentAndTimers(deltaTime);
        }
    } catch (err) {
        console.error("ERROR IN UPDATE FUNCTION:", err);
        GAME_STATE = 'ERROR_LOADING';
        if (ctx) {
            ctx.fillStyle = 'red'; ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);
            ctx.fillStyle = 'white'; ctx.font = '20px Courier New'; ctx.textAlign = 'center';
            ctx.fillText("An error occurred in Update(). Check console.", NATIVE_WIDTH / 2, NATIVE_HEIGHT / 2 - 20);
            ctx.fillText("GAME_STATE set to ERROR_LOADING.", NATIVE_WIDTH / 2, NATIVE_HEIGHT / 2 + 20);
        }
    }
}
function gameLoop(timestamp) {
    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;
    if (GAME_STATE === 'LOADING_ASSETS') { /* Still loading, render handled by HTML/CSS */ }
    else {
        update(deltaTime);
        if (GAME_STATE === 'PAUSED') { renderPausedScreen(); }
        else if (GAME_STATE === 'ROAMING' || GAME_STATE === 'MENU_OPEN') { renderOverworld(); }
        else if (['IN_PLAYER_HOUSE', 'HOSPITAL_INTERIOR', 'HOSPITAL_HEAL_PROMPT', 'NPC_INTERACTION', 'HOUSE_ACTION_PROMPT', 'ITEM_CHEST_PROMPT', 'POKEMON_STORAGE_UI', 'MOVE_LEARNING_PROMPT'].includes(GAME_STATE) ) { renderSpecialState(); }
        else if (GAME_STATE === 'BATTLE' || GAME_STATE === 'BATTLE_STARTING') { /* Battle screen handled by HTML/CSS */ }
    }
    requestAnimationFrame(gameLoop);
}

// --- SUB-UPDATE LOGIC ---
function updateEnvironmentAndTimers(deltaTime) { gameTime = (gameTime + DAY_NIGHT_CYCLE_SPEED * (deltaTime / (1000/60))) % 2400; player.totalPlayTimeMs += deltaTime; const hour = Math.floor(gameTime / 100); if (hour >= 20 || hour < 5) currentLightOverlay = 'rgba(0,0,50,0.4)'; else if (hour === 5 || hour === 19) currentLightOverlay = 'rgba(255,140,0,0.2)'; else if (hour === 6 || hour === 18) currentLightOverlay = 'rgba(255,165,0,0.1)'; else currentLightOverlay = 'rgba(0,0,0,0)'; weatherTimer += deltaTime; if (weatherTimer > WEATHER_DURATION) { weatherTimer = 0; const rand = Math.random(); if (rand < 0.7) weather = "sunny"; else weather = "rainy"; rainParticles = []; if (weather === "rainy") { for(let i=0; i<100; i++) rainParticles.push({x: Math.random()*NATIVE_WIDTH, y: Math.random()*NATIVE_HEIGHT, l: Math.random()*10+5, s: Math.random()*2+1}); } } if (weather === "rainy") { rainParticles.forEach(p => { p.y += p.s; if (p.y > NATIVE_HEIGHT) { p.y = 0; p.x = Math.random()*NATIVE_WIDTH; } }); } if (mewtwoOnCooldown && (Date.now() - lastMewtwoSpawnTime > MEWTWO_COOLDOWN_DURATION_MS)) { mewtwoOnCooldown = false; } if (isHealingFlashActive) { healingFlashTimer -= deltaTime / 1000; if (healingFlashTimer <= 0) { isHealingFlashActive = false; healFlashOverlay.style.opacity = '0'; } else { healFlashOverlay.style.opacity = (healingFlashTimer / HEALING_FLASH_DURATION) * 0.8; } } const distFromOriginUnits = player.originWorldX === 0 && player.originWorldY === 0 ? 0 : Math.sqrt((player.worldX - player.originWorldX)**2 + (player.worldY - player.originWorldY)**2); const distFromOriginMeters = distFromOriginUnits / DISTANCE_UNIT_PER_METER; let darknessOpacity = 0; if (distFromOriginMeters > DARKNESS_FADE_START_DISTANCE_M) { const fadeRange = DARKNESS_FULL_DISTANCE_M - DARKNESS_FADE_START_DISTANCE_M; if (fadeRange > 0) { const progressInRange = Math.min(1, (distFromOriginMeters - DARKNESS_FADE_START_DISTANCE_M) / fadeRange); darknessOpacity = progressInRange * MAX_DARKNESS_OPACITY; } else if (distFromOriginMeters >= DARKNESS_FULL_DISTANCE_M) { darknessOpacity = MAX_DARKNESS_OPACITY; } } darknessOpacity = Math.min(MAX_DARKNESS_OPACITY, Math.max(0, darknessOpacity)); currentWorldDarknessOverlay = `rgba(0,0,0,${darknessOpacity.toFixed(3)})`; }
function updateWildPokemonRoaming(pkmn, dts) { if (!pkmn.isRoaming) return; if (pkmn.variant === 'shiny') { const distToPlayerSq = distanceSq(pkmn.worldX, pkmn.worldY, player.worldX, player.worldY); const fleeRadiusSq = (TILE_SIZE * 10) ** 2; if (distToPlayerSq < fleeRadiusSq) { const angleToPlayer = Math.atan2(player.worldY - pkmn.worldY, player.worldX - pkmn.worldX); const fleeAngle = angleToPlayer + Math.PI; const fleeDist = TILE_SIZE * 15; pkmn.roamTargetWorldX = pkmn.worldX + Math.cos(fleeAngle) * fleeDist; pkmn.roamTargetWorldY = pkmn.worldY + Math.sin(fleeAngle) * fleeDist; pkmn.roamStepsTaken = 0; pkmn.roamStepTimer = 0.1; } } else if (pkmn.variant === 'dark') { const distToPlayerSq = distanceSq(pkmn.worldX, pkmn.worldY, player.worldX, player.worldY); const chaseRadiusSq = (TILE_SIZE * 22) ** 2; if (distToPlayerSq < chaseRadiusSq) { console.log(`DARK ${pkmn.displayName} IS CHASING!`); pkmn.roamTargetWorldX = player.worldX; pkmn.roamTargetWorldY = player.worldY; pkmn.roamStepsTaken = 0; pkmn.roamStepTimer = 0.15; } } pkmn.roamStepTimer -= dts; if (pkmn.roamStepTimer <= 0) { pkmn.roamStepTimer = 0.66 + Math.random() * 0.3; if (pkmn.variant === 'shiny') pkmn.roamStepTimer *= 0.5; else if (pkmn.variant === 'dark') pkmn.roamStepTimer *= 1.5; if (pkmn.roamStepsTaken < pkmn.roamMaxSteps) { const dx = pkmn.roamTargetWorldX - pkmn.worldX; const dy = pkmn.roamTargetWorldY - pkmn.worldY; const dist = Math.sqrt(dx * dx + dy * dy); if (dist > pkmn.roamSpeed * dts * 0.25) { const moveXUnit = dist === 0 ? 0 : dx / dist; const moveYUnit = dist === 0 ? 0 : dy / dist; const actualMoveX = moveXUnit * pkmn.roamSpeed * dts; const actualMoveY = moveYUnit * pkmn.roamSpeed * dts; let nextPkmnWorldX = pkmn.worldX + actualMoveX; let nextPkmnWorldY = pkmn.worldY + actualMoveY; const pkmnCollisionWidth = (pkmn.width || POKEMON_SPRITE_SIZE) * WILD_POKEMON_COLLISION_SCALE; const pkmnCollisionHeight = (pkmn.height || POKEMON_SPRITE_SIZE) * WILD_POKEMON_COLLISION_SCALE; let canMoveX = true; let canMoveY = true; if (isCollidingWithHouse(nextPkmnWorldX, pkmn.worldY, pkmnCollisionWidth, playerHouse) || discoveredHospitals.filter(h => h.worldX !== -Infinity).some(h => isCollidingWithHospital(nextPkmnWorldX, pkmn.worldY, pkmnCollisionWidth, h)) || worldTrees.some(t => isCollidingWithTree(nextPkmnWorldX, pkmn.worldY, pkmnCollisionWidth, pkmnCollisionHeight, t))) { canMoveX = false; } if (canMoveX) { for (const npc of NPCS) { if (checkAABBCollision( { x: nextPkmnWorldX, y: pkmn.worldY, width: pkmnCollisionWidth, height: pkmnCollisionHeight }, { x: npc.worldX, y: npc.worldY, width: NPC_SPRITE_SIZE * NPC_COLLISION_SCALE, height: NPC_SPRITE_SIZE * NPC_COLLISION_SCALE } )) { canMoveX = false; break; } } } if (canMoveX) { for (const otherPkmn of wildPokemon) { if (otherPkmn.id === pkmn.id) continue; const otherPkmnCollWidth = (otherPkmn.width || POKEMON_SPRITE_SIZE) * WILD_POKEMON_COLLISION_SCALE; const otherPkmnCollHeight = (otherPkmn.height || POKEMON_SPRITE_SIZE) * WILD_POKEMON_COLLISION_SCALE; if (checkAABBCollision( { x: nextPkmnWorldX, y: pkmn.worldY, width: pkmnCollisionWidth, height: pkmnCollisionHeight }, { x: otherPkmn.worldX, y: otherPkmn.worldY, width: otherPkmnCollWidth, height: otherPkmnCollHeight } )) { canMoveX = false; break; } } } if (isCollidingWithHouse(pkmn.worldX, nextPkmnWorldY, pkmnCollisionWidth, playerHouse) || discoveredHospitals.filter(h => h.worldX !== -Infinity).some(h => isCollidingWithHospital(pkmn.worldX, nextPkmnWorldY, pkmnCollisionWidth, h)) || worldTrees.some(t => isCollidingWithTree(pkmn.worldX, nextPkmnWorldY, pkmnCollisionWidth, pkmnCollisionHeight, t))) { canMoveY = false; } if (canMoveY) { for (const npc of NPCS) { if (checkAABBCollision( { x: pkmn.worldX, y: nextPkmnWorldY, width: pkmnCollisionWidth, height: pkmnCollisionHeight }, { x: npc.worldX, y: npc.worldY, width: NPC_SPRITE_SIZE * NPC_COLLISION_SCALE, height: NPC_SPRITE_SIZE * NPC_COLLISION_SCALE } )) { canMoveY = false; break; } } } if (canMoveY) { for (const otherPkmn of wildPokemon) { if (otherPkmn.id === pkmn.id) continue; const otherPkmnCollWidth = (otherPkmn.width || POKEMON_SPRITE_SIZE) * WILD_POKEMON_COLLISION_SCALE; const otherPkmnCollHeight = (otherPkmn.height || POKEMON_SPRITE_SIZE) * WILD_POKEMON_COLLISION_SCALE; if (checkAABBCollision( { x: pkmn.worldX, y: nextPkmnWorldY, width: pkmnCollisionWidth, height: pkmnCollisionHeight }, { x: otherPkmn.worldX, y: otherPkmn.worldY, width: otherPkmnCollWidth, height: otherPkmnCollHeight } )) { canMoveY = false; break; } } } let movedThisStep = false; if (canMoveX && isWalkable(nextPkmnWorldX, pkmn.worldY)) { pkmn.worldX = nextPkmnWorldX; movedThisStep = true; } else if (!canMoveX) { pkmn.roamStepsTaken = pkmn.roamMaxSteps; } if (canMoveY && isWalkable(pkmn.worldX, nextPkmnWorldY)) { pkmn.worldY = nextPkmnWorldY; movedThisStep = true; } else if (!canMoveY) { pkmn.roamStepsTaken = pkmn.roamMaxSteps; } if (!movedThisStep && (!canMoveX || !canMoveY)) { pkmn.roamStepsTaken = pkmn.roamMaxSteps; } } else { pkmn.worldX = pkmn.roamTargetWorldX; pkmn.worldY = pkmn.roamTargetWorldY; pkmn.roamStepsTaken = pkmn.roamMaxSteps; } if (pkmn.variant !== 'dark' || dist > TILE_SIZE * 0.5) { if (pkmn.roamStepsTaken < pkmn.roamMaxSteps) pkmn.roamStepsTaken++; } } else { const angle = Math.random() * Math.PI * 2; const roamDist = TILE_SIZE * (9 + Math.random() * 12); let newTargetX = pkmn.worldX + Math.cos(angle) * roamDist; let newTargetY = pkmn.worldY + Math.sin(angle) * roamDist; let targetPos = findWalkableSpawn(newTargetX, newTargetY, 2); pkmn.roamTargetWorldX = targetPos.x; pkmn.roamTargetWorldY = targetPos.y; pkmn.roamStepsTaken = 0; pkmn.roamMaxSteps = 2 + Math.floor(Math.random() * 3); } } }
// function updateOverworldParticles(dts) { // This function is defined earlier in script5.js if that's still included
//    // ... implementation ...
// }

// Pokemon addXp (implementation for Pokemon objects) - This is already in script3.js
// If Pokemon.prototype.addXp is needed here, it means it was moved or duplicated.
// Ensure it's defined once, typically with the Pokemon class definition.
// For now, assuming it's correctly in script3.js.