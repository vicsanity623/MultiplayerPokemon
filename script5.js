// script5.js
// --- WORLD GENERATION & MANAGEMENT ---
function getTileColor(noiseVal) { if (noiseVal < 0.20) return '#4682B4'; if (noiseVal < 0.30) return '#DEB887'; return '#228B22'; }
function isWalkable(worldX, worldY) { const tileX = Math.floor(worldX / TILE_SIZE); const tileY = Math.floor(worldY / TILE_SIZE); const noiseCheckX = tileX + 0.5; const noiseCheckY = tileY + 0.5; const noiseVal = fbm_noise(noiseCheckX / 20, noiseCheckY / 20, worldSeed); return noiseVal >= 0.20; }
function isRectWalkable(worldX, worldY, width, height) { const halfW = width/2; const halfH = height/2; if (!isWalkable(worldX - halfW, worldY - halfH)) return false; if (!isWalkable(worldX + halfW, worldY - halfH)) return false; if (!isWalkable(worldX - halfW, worldY + halfH)) return false; if (!isWalkable(worldX + halfW, worldY + halfH)) return false; return true; }
function findWalkableSpawn(initialWorldX, initialWorldY, maxSearchRadiusTiles) { if (isWalkable(initialWorldX, initialWorldY)) return { x: initialWorldX, y: initialWorldY }; const initialTileX = Math.floor(initialWorldX / TILE_SIZE); const initialTileY = Math.floor(initialWorldY / TILE_SIZE); for (let radius = 1; radius <= maxSearchRadiusTiles; radius++) { for (let dx = -radius; dx <= radius; dx++) { for (let dy = -radius; dy <= radius; dy++) { if (radius > 0 && Math.abs(dx) !== radius && Math.abs(dy) !== radius) { continue; } let candidateTileX = initialTileX + dx; let candidateTileY = initialTileY + dy; let candidateWorldX = candidateTileX * TILE_SIZE + TILE_SIZE / 2; let candidateWorldY = candidateTileY * TILE_SIZE + TILE_SIZE / 2; if (isWalkable(candidateWorldX, candidateWorldY)) return { x: candidateWorldX, y: candidateWorldY }; } } } return { x: initialWorldX, y: initialWorldY }; }
function findWalkableArea(targetWorldX, targetWorldY, areaWidthTiles, areaHeightTiles, maxSearchRadiusTiles) { for (let r = 0; r <= maxSearchRadiusTiles; r++) { for (let dx = -r; dx <= r; dx++) { for (let dy = -r; dy <= r; dy++) { if (Math.abs(dx) !== r && Math.abs(dy) !== r && r > 0) continue; const currentTileX = Math.floor(targetWorldX / TILE_SIZE) + dx; const currentTileY = Math.floor(targetWorldY / TILE_SIZE) + dy; const areaCenterX = currentTileX * TILE_SIZE + (areaWidthTiles * TILE_SIZE / 2); const areaCenterY = currentTileY * TILE_SIZE + (areaHeightTiles * TILE_SIZE / 2); let allClear = true; for (let ax = 0; ax < areaWidthTiles; ax++) { for (let ay = 0; ay < areaHeightTiles; ay++) { const checkWorldX = (currentTileX + ax) * TILE_SIZE + TILE_SIZE/2; const checkWorldY = (currentTileY + ay) * TILE_SIZE + TILE_SIZE/2; const noiseVal = fbm_noise((currentTileX + ax + 0.5)/20, (currentTileY+ay + 0.5)/20, worldSeed); if (!isWalkable(checkWorldX, checkWorldY) || getTileColor(noiseVal) === '#228B22' || getTileColor(noiseVal) === '#4682B4' ) { allClear = false; break; }} if (!allClear) break;} if (allClear) return { x: areaCenterX - (areaWidthTiles % 2 === 0 ? TILE_SIZE/2 : 0) , y: areaCenterY - (areaHeightTiles % 2 === 0 ? TILE_SIZE/2 : 0) }; }}} return findWalkableSpawn(TILE_SIZE * 10, TILE_SIZE * 10, 30); }
function discoverAndSpawnHospitals() { const playerChunkGx = Math.floor(player.worldX / (HOSPITAL_CHUNK_SIZE_TILES * TILE_SIZE)); const playerChunkGy = Math.floor(player.worldY / (HOSPITAL_CHUNK_SIZE_TILES * TILE_SIZE)); for (let gxOffset = -1; gxOffset <= 1; gxOffset++) { for (let gyOffset = -1; gyOffset <= 1; gyOffset++) { const checkGx = playerChunkGx + gxOffset; const checkGy = playerChunkGy + gyOffset; const hospitalId = `${checkGx}_${checkGy}`; if (discoveredHospitals.find(h => h.id === hospitalId)) continue; const spawnChanceSeed = checkGx * 73856093 + checkGy * 19349663 + worldSeed + 314159; if (seededRandom(spawnChanceSeed) < HOSPITAL_SPAWN_CHANCE_PER_CHUNK) { const chunkTopLeftWorldX = checkGx * HOSPITAL_CHUNK_SIZE_TILES * TILE_SIZE; const chunkTopLeftWorldY = checkGy * HOSPITAL_CHUNK_SIZE_TILES * TILE_SIZE; const randomTileOffsetXSeed = checkGx * 123456 + checkGy * 789012 + worldSeed + 42; const randomTileOffsetYSeed = checkGx * 654321 + checkGy * 210987 + worldSeed + 84; const randomTileOffsetX = Math.floor(seededRandom(randomTileOffsetXSeed) * HOSPITAL_CHUNK_SIZE_TILES); const randomTileOffsetY = Math.floor(seededRandom(randomTileOffsetYSeed) * HOSPITAL_CHUNK_SIZE_TILES); const randomTargetWorldX = chunkTopLeftWorldX + (randomTileOffsetX * TILE_SIZE) + (TILE_SIZE / 2); const randomTargetWorldY = chunkTopLeftWorldY + (randomTileOffsetY * TILE_SIZE) + (TILE_SIZE / 2); if (Math.sqrt((randomTargetWorldX - playerHouse.worldX)**2 + (randomTargetWorldY - playerHouse.worldY)**2) < PLAYER_HOUSE_SAFE_ZONE_RADIUS) { discoveredHospitals.push({id: hospitalId, worldX: -Infinity, worldY: -Infinity, width:0, height:0, collisionWidth:0, collisionHeight:0 }); continue; } let hospitalPos = findWalkableSpawn(randomTargetWorldX, randomTargetWorldY, 7); const hospitalImageWidth = TILE_SIZE * 5; const hospitalImageHeight = TILE_SIZE * 4; const hospitalCollisionWidth = TILE_SIZE * 4; const hospitalCollisionHeight = TILE_SIZE * 2.5; if (isRectWalkable(hospitalPos.x, hospitalPos.y, hospitalCollisionWidth, hospitalCollisionHeight)) { let tooCloseToExistingHospital = false; const minHospitalSpacingSq = (HOSPITAL_CHUNK_SIZE_TILES * 0.75 * TILE_SIZE) ** 2; for (const existingHospital of discoveredHospitals.filter(h => h.worldX !== -Infinity)) { if (distanceSq(hospitalPos.x, hospitalPos.y, existingHospital.worldX, existingHospital.worldY) < minHospitalSpacingSq) { tooCloseToExistingHospital = true; break; } } if (!tooCloseToExistingHospital) { discoveredHospitals.push({ id: hospitalId, worldX: hospitalPos.x, worldY: hospitalPos.y, width: hospitalImageWidth, height: hospitalImageHeight, collisionWidth: hospitalCollisionWidth, collisionHeight: hospitalCollisionHeight }); } else { discoveredHospitals.push({id: hospitalId, worldX: -Infinity, worldY: -Infinity, width:0, height:0, collisionWidth:0, collisionHeight:0 }); } } else { discoveredHospitals.push({id: hospitalId, worldX: -Infinity, worldY: -Infinity, width:0, height:0, collisionWidth:0, collisionHeight:0 }); } } else { discoveredHospitals.push({id: hospitalId, worldX: -Infinity, worldY: -Infinity, width:0, height:0, collisionWidth:0, collisionHeight:0 }); } } } discoveredHospitals = discoveredHospitals.filter(h => { if (h.worldX === -Infinity) { const hGx = parseInt(h.id.split('_')[0]); const hGy = parseInt(h.id.split('_')[1]); return Math.abs(hGx - playerChunkGx) <= 2 && Math.abs(hGy - playerChunkGy) <= 2; } return true; }); }
function spawnWorldTrees() { if (!preloadedTreeImage) return; const playerChunkGx = Math.floor(player.worldX / (TREE_CHUNK_SIZE_TILES * TILE_SIZE)); const playerChunkGy = Math.floor(player.worldY / (TREE_CHUNK_SIZE_TILES * TILE_SIZE)); for (let gxOffset = -1; gxOffset <= 1; gxOffset++) { for (let gyOffset = -1; gyOffset <= 1; gyOffset++) { const checkGx = playerChunkGx + gxOffset; const checkGy = playerChunkGy + gyOffset; const chunkId = `${checkGx}_${checkGy}`; if (treeProcessedChunks.has(chunkId)) { continue; } for (let tileXOffset = 0; tileXOffset < TREE_CHUNK_SIZE_TILES; tileXOffset++) { for (let tileYOffset = 0; tileYOffset < TREE_CHUNK_SIZE_TILES; tileYOffset++) { const c = checkGx * TREE_CHUNK_SIZE_TILES + tileXOffset; const r = checkGy * TREE_CHUNK_SIZE_TILES + tileYOffset; const noiseVal = fbm_noise(c / 20, r / 20, worldSeed); const tileColor = getTileColor(noiseVal); if (tileColor === '#228B22' && noiseVal >= 0.35) { if (Math.random() < TREE_SPAWN_CHANCE_PER_GRASS_TILE) { const treeWorldX = c * TILE_SIZE + TILE_SIZE / 2; const treeWorldY = r * TILE_SIZE + TILE_SIZE / 2; const imageScaledWidth = preloadedTreeImage.naturalWidth * TREE_IMAGE_SCALE; const imageScaledHeight = preloadedTreeImage.naturalHeight * TREE_IMAGE_SCALE; const collisionW = imageScaledWidth * TREE_COLLISION_WIDTH_RATIO; const collisionH = imageScaledHeight * TREE_COLLISION_HEIGHT_RATIO; let tooCloseToStructure = false; if (isCollidingWithHouse(treeWorldX, treeWorldY, collisionW, playerHouse)) { tooCloseToStructure = true; } if (!tooCloseToStructure) { for (const hospital of discoveredHospitals.filter(h => h.worldX !== -Infinity)) { if (isCollidingWithHospital(treeWorldX, treeWorldY, collisionW, hospital)) { tooCloseToStructure = true; break; } } } if (!tooCloseToStructure) { for (const existingTree of worldTrees) { if (distanceSq(treeWorldX, treeWorldY, existingTree.worldX, existingTree.worldY) < MIN_SPACING_BETWEEN_TREES_SQ) { tooCloseToStructure = true; break; } } } if (!tooCloseToStructure) { worldTrees.push({ id: Date.now() + Math.random().toString(16).slice(2), worldX: treeWorldX, worldY: treeWorldY + imageScaledHeight / 2 - collisionH / 2, image: preloadedTreeImage, width: imageScaledWidth, height: imageScaledHeight, collisionWidth: collisionW, collisionHeight: collisionH }); } } } } } treeProcessedChunks.add(chunkId); } } }
function getEvolutionStage(pokemonName, pokemonData) { if (!pokemonData || !POKEMON_DATA[pokemonName]) { return 'unknown'; } const baseData = POKEMON_DATA[pokemonName]; const evolvesTo = baseData.evolution; let evolvesFrom = null; for (const otherName in POKEMON_DATA) { if (POKEMON_DATA[otherName].evolution && POKEMON_DATA[otherName].evolution.evolvesTo === pokemonName) { evolvesFrom = otherName; break; } } if (LEGENDARY_POKEMON_NAMES.includes(pokemonName)) { return 'legendary'; } if (!evolvesFrom && evolvesTo) { return 'basic'; } else if (evolvesFrom && evolvesTo) { return 'middle'; } else if (evolvesFrom && !evolvesTo) { return 'final'; } else if (!evolvesFrom && !evolvesTo) { return 'single_stage_non_legendary'; } return 'unknown'; }
function spawnWildPokemon() {
    if (wildPokemon.length >= MAX_WILD_POKEMON) return;
    if (Math.random() > 0.01) { // Spawn chance
        return;
    }
    if (Object.keys(POKEMON_DATA).length === 0) return;

    const playerWorldXForDistance = player.worldX;
    const playerWorldYForDistance = player.worldY;

    const distFromHouseUnits = Math.sqrt((playerWorldXForDistance - playerHouse.worldX)**2 + (playerWorldYForDistance - playerHouse.worldY)**2);
    const distFromHouseMeters = distFromHouseUnits / DISTANCE_UNIT_PER_METER;

    const distFromOriginUnits = player.originWorldX === 0 && player.originWorldY === 0 ?
        Math.sqrt(playerWorldXForDistance**2 + playerWorldYForDistance**2) :
        Math.sqrt((playerWorldXForDistance - player.originWorldX)**2 + (playerWorldYForDistance - player.originWorldY)**2);
    const distFromOriginMeters = distFromOriginUnits / DISTANCE_UNIT_PER_METER;

    let eligiblePokemonNames = [];
    let minLevel, maxLevel;
    let specificPokemonNameToSpawn = null;
    let forcedVariant = null;

    const HOUSE_SAFE_ZONE_END_METERS = 100;
    const HOUSE_MID_TIER_START_METERS = HOUSE_SAFE_ZONE_END_METERS;
    const HOUSE_MID_TIER_END_METERS = 2500;
    const HOUSE_HIGH_TIER_START_METERS = HOUSE_MID_TIER_END_METERS;
    const HOUSE_HIGH_TIER_END_METERS = 5000;

    const LEGENDARY_THRESHOLD_MIN_METERS_ORIGIN = 7000;
    const LEGENDARY_SPAWN_TRAVEL_INTERVAL_METERS_ORIGIN = 2000;
    const MEWTWO_THRESHOLD_MIN_METERS_ORIGIN = 10000;
    const mewtwoGameName = POKEMON_NAMES[149];

    if (distFromOriginMeters >= MEWTWO_THRESHOLD_MIN_METERS_ORIGIN &&
        POKEMON_DATA[mewtwoGameName] &&
        !mewtwoOnCooldown &&
        !wildPokemon.some(p => p.name === mewtwoGameName)) {
        if (Math.random() < 0.35) {
            specificPokemonNameToSpawn = mewtwoGameName;
            minLevel = 100;
            maxLevel = 100;
            forcedVariant = null;
            console.log(">>> MEWTWO SPAWN ATTEMPT (Origin Distance) <<<");
        }
    }

    if (!specificPokemonNameToSpawn && distFromOriginMeters >= LEGENDARY_THRESHOLD_MIN_METERS_ORIGIN) {
        if (player.distanceTraveledSinceLastLegendaryAttempt >= (LEGENDARY_SPAWN_TRAVEL_INTERVAL_METERS_ORIGIN * DISTANCE_UNIT_PER_METER)) {
            const nonMewtwoLegendariesInWorld = wildPokemon.some(p => LEGENDARY_POKEMON_NAMES.includes(p.name) && p.name !== mewtwoGameName);
            if (!nonMewtwoLegendariesInWorld) {
                const potentialLegendaries = LEGENDARY_POKEMON_NAMES.filter(name =>
                    POKEMON_DATA[name] && name !== mewtwoGameName && !wildPokemon.some(wp => wp.name === name)
                );
                if (potentialLegendaries.length > 0) {
                    if (Math.random() < 0.20) {
                        specificPokemonNameToSpawn = potentialLegendaries[Math.floor(Math.random() * potentialLegendaries.length)];
                        minLevel = 60 + Math.floor(Math.random() * 21);
                        maxLevel = minLevel;
                        forcedVariant = null;
                        console.log(`>>> LEGENDARY SPAWN ATTEMPT (Origin Distance): ${specificPokemonNameToSpawn} <<<`);
                        player.distanceTraveledSinceLastLegendaryAttempt = 0;
                        player.lastLegendarySpawnCoordinates = { x: playerWorldXForDistance, y: playerWorldYForDistance };
                    }
                }
            }
        }
        if (distanceSq(playerWorldXForDistance, playerWorldYForDistance, player.lastLegendarySpawnCoordinates.x, player.lastLegendarySpawnCoordinates.y) > (TILE_SIZE * 150)**2) {
            player.distanceTraveledSinceLastLegendaryAttempt = 0;
        }
    }

    if (!specificPokemonNameToSpawn) {
        const DARK_SPAWN_CHANCE = 0.004;
        let effectiveDarkChance = DARK_SPAWN_CHANCE;
        if (distFromHouseMeters > 500) effectiveDarkChance *= 2;
        if (distFromHouseMeters > 1500) effectiveDarkChance *= 2;

        if (player.level > 10 && distFromHouseMeters > (HOUSE_SAFE_ZONE_END_METERS + 100) && Math.random() < effectiveDarkChance) {
            const potentialDarkPokemon = ELIGIBLE_FOR_DARK_VARIANT.filter(name =>
                POKEMON_DATA[name] && !LEGENDARY_POKEMON_NAMES.includes(name) && name !== mewtwoGameName
            );
            if (potentialDarkPokemon.length > 0) {
                specificPokemonNameToSpawn = potentialDarkPokemon[Math.floor(Math.random() * potentialDarkPokemon.length)];
                forcedVariant = 'dark';
                minLevel = Math.min(99, Math.floor(player.level * 0.8 + distFromHouseMeters / 50) + 5);
                maxLevel = Math.min(100, Math.floor(player.level * 1.1 + distFromHouseMeters / 40) + 10);
                console.log(`>>> DARK VARIANT SPAWN ATTEMPT (House Distance): ${specificPokemonNameToSpawn} <<<`);
            }
        }
    }

    if (!specificPokemonNameToSpawn) {
        const allGamePokemonNames = Object.keys(POKEMON_DATA).filter(name =>
            POKEMON_DATA[name] && !LEGENDARY_POKEMON_NAMES.includes(name) && name !== mewtwoGameName
        );

        if (distFromHouseMeters <= HOUSE_SAFE_ZONE_END_METERS) {
            eligiblePokemonNames = STARTER_ZONE_POKEMON_NAMES.filter(name => POKEMON_DATA[name]);
            if (eligiblePokemonNames.length === 0) eligiblePokemonNames = allGamePokemonNames.filter(n => getEvolutionStage(n, POKEMON_DATA[n]) === 'basic').slice(0,7);
            minLevel = 1 + Math.floor(distFromHouseMeters / 20);
            maxLevel = 3 + Math.floor(distFromHouseMeters / 15);
        } else if (distFromHouseMeters <= HOUSE_MID_TIER_END_METERS) {
            const progressFactor = (distFromHouseMeters - HOUSE_MID_TIER_START_METERS) / (HOUSE_MID_TIER_END_METERS - HOUSE_MID_TIER_START_METERS);
            minLevel = 5 + Math.floor(progressFactor * 40 + player.level * 0.3);
            maxLevel = 10 + Math.floor(progressFactor * 50 + player.level * 0.5);
            eligiblePokemonNames = allGamePokemonNames.filter(name => {
                const stage = getEvolutionStage(name, POKEMON_DATA[name]);
                if (stage === 'final') return Math.random() < (0.1 + progressFactor * 0.4);
                if (stage === 'middle') return Math.random() < (0.3 + progressFactor * 0.3);
                return Math.random() < (0.9 - progressFactor * 0.5);
            });
            if (eligiblePokemonNames.length < 5 && allGamePokemonNames.length > 0) {
                eligiblePokemonNames.push(...allGamePokemonNames.slice(0, 5 - eligiblePokemonNames.length));
            }
        } else if (distFromHouseMeters <= HOUSE_HIGH_TIER_END_METERS) {
            eligiblePokemonNames = [...allGamePokemonNames];
            const progressFactor = (distFromHouseMeters - HOUSE_HIGH_TIER_START_METERS) / (HOUSE_HIGH_TIER_END_METERS - HOUSE_HIGH_TIER_START_METERS);
            minLevel = 40 + Math.floor(progressFactor * 40 + player.level * 0.2);
            maxLevel = 50 + Math.floor(progressFactor * 45 + player.level * 0.3);
        } else {
            eligiblePokemonNames = [...allGamePokemonNames];
            minLevel = 60 + Math.floor(player.level * 0.2 + (distFromHouseMeters - HOUSE_HIGH_TIER_END_METERS) / 100);
            maxLevel = 70 + Math.floor(player.level * 0.3 + (distFromHouseMeters - HOUSE_HIGH_TIER_END_METERS) / 80);
        }

        if (eligiblePokemonNames.length > 0) {
            specificPokemonNameToSpawn = eligiblePokemonNames[Math.floor(Math.random() * eligiblePokemonNames.length)];
        } else if (allGamePokemonNames.length > 0) {
            specificPokemonNameToSpawn = allGamePokemonNames[Math.floor(Math.random() * allGamePokemonNames.length)];
            if (!minLevel) minLevel = Math.max(1, player.level - 3);
            if (!maxLevel) maxLevel = player.level + 7;
        }
    }

    let finalPokemonNameToSpawn = specificPokemonNameToSpawn;
    if (!finalPokemonNameToSpawn || !POKEMON_DATA[finalPokemonNameToSpawn]) {
        console.warn("No final Pokemon name determined or data missing, skipping spawn.");
        return;
    }

    if (finalPokemonNameToSpawn !== mewtwoGameName) {
        minLevel = Math.max(1, Math.min(minLevel || 1, 99));
        maxLevel = Math.max(minLevel, Math.min(maxLevel || 5, 99));
    } else {
        minLevel = 100; maxLevel = 100;
    }

    const angle = Math.random() * Math.PI * 2;
    const spawnRadiusMin = NATIVE_WIDTH * 0.4;
    const spawnRadiusMax = NATIVE_WIDTH * 1.2;
    const radius = spawnRadiusMin + Math.random() * (spawnRadiusMax - spawnRadiusMin);
    let spawnWorldX = player.worldX + Math.cos(angle) * radius;
    let spawnWorldY = player.worldY + Math.sin(angle) * radius;

    if (forcedVariant === 'dark' && distFromHouseMeters < (HOUSE_SAFE_ZONE_END_METERS + 150) && (minLevel > 15) ) {
        const pushOutFactor = (HOUSE_SAFE_ZONE_END_METERS + 150 + Math.random() * 50) * DISTANCE_UNIT_PER_METER;
        spawnWorldX = player.worldX + Math.cos(angle) * pushOutFactor;
        spawnWorldY = player.worldY + Math.sin(angle) * pushOutFactor;
        console.log("Pushed Dark Pokemon spawn further from house safe zone.");
    }

    let spawnPos = findWalkableSpawn(spawnWorldX, spawnWorldY, 10);
    if (isWalkable(spawnPos.x, spawnPos.y)) {
        const pkmnLevel = getRandomLevel(minLevel, maxLevel);
        const pkmn = createPokemon(finalPokemonNameToSpawn, pkmnLevel, forcedVariant);
        if (pkmn) {
            pkmn.worldX = spawnPos.x;
            pkmn.worldY = spawnPos.y;
            pkmn.roamTargetWorldX = pkmn.worldX;
            pkmn.roamTargetWorldY = pkmn.worldY;
            wildPokemon.push(pkmn);

            if (finalPokemonNameToSpawn === mewtwoGameName && !forcedVariant) {
                lastMewtwoSpawnTime = Date.now();
                mewtwoOnCooldown = true;
            }
            if (pkmn.variant || LEGENDARY_POKEMON_NAMES.includes(pkmn.name)) {
                showGeneralMessage(`A ${pkmn.displayName} appeared in the distance!`);
            }
        }
    }
}

function createOverworldParticle(x, y, type, targetPokemon) {
    const initialLife = type === 'sparkle' ? Math.random() * 0.4 + 0.2 : Math.random() * 0.8 + 0.5;
    let particle = {
        x: x + (Math.random() - 0.5) * POKEMON_SPRITE_SIZE * 0.3,
        y: y + (Math.random() - 0.5) * POKEMON_SPRITE_SIZE * 0.3,
        type: type,
        size: type === 'sparkle' ? Math.random() * 2 + 1.5 : Math.random() * 6 + 4,
        opacity: 1.0,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30 - (type === 'dark_smoke' ? 10 : (type === 'sparkle' ? 5 : 0) ),
        life: initialLife,
        initialLife: initialLife,
        target: targetPokemon,
        color: type === 'sparkle' ? `hsl(${Math.random() * 60 + 200}, 100%, 75%)` : 'rgba(50,30,30,0.5)'
    };
    if (type === 'dark_smoke') {
        particle.color = Math.random() > 0.5 ? 'rgba(100,20,20,0.4)' : 'rgba(30,30,30,0.6)';
    }
    overworldParticles.push(particle);
}

function updateOverworldParticles(dts) {
    if (isNaN(dts) || dts <= 0) {
        dts = 1/60;
    }
    for (let i = overworldParticles.length - 1; i >= 0; i--) {
        let p = overworldParticles[i];
        p.x += p.vx * dts;
        p.y += p.vy * dts;

        p.life -= dts;
        if (p.initialLife > 0) {
            p.opacity = Math.max(0, p.life / p.initialLife);
        } else {
            p.opacity = 0;
        }

        if (p.life <= 0) {
            overworldParticles.splice(i, 1);
        }
    }
}
function drawOverworldParticles(ctx, camera) {
         overworldParticles.forEach(p => {
             const screenX = p.x - camera.x;
             const screenY = p.y - camera.y;
             ctx.globalAlpha = p.opacity;
             ctx.fillStyle = p.color;
             if (p.type === 'sparkle') {
                 ctx.beginPath();
                 for (let i = 0; i < 5; i++) {
                     ctx.lineTo(screenX + p.size * Math.cos( (18 + i * 72) * Math.PI / 180 ),
                             screenY + p.size * Math.sin( (18 + i * 72) * Math.PI / 180 ));
                     ctx.lineTo(screenX + (p.size/2) * Math.cos( (54 + i * 72) * Math.PI / 180 ),
                             screenY + (p.size/2) * Math.sin( (54 + i * 72) * Math.PI / 180 ));
                 }
                 ctx.closePath();
                 ctx.fill();
             } else if (p.type === 'dark_smoke') {
                 ctx.beginPath();
                 ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
                 ctx.fill();
             }
             ctx.globalAlpha = 1.0;
         });
     }

function despawnFarPokemon() {
    wildPokemon = wildPokemon.filter(p => {
        const distSq = (p.worldX - player.worldX)**2 + (p.worldY - player.worldY)**2;
        const despawnRadius = (Math.sqrt(NATIVE_WIDTH**2 + NATIVE_HEIGHT**2)) * 2.5;
        return distSq < despawnRadius**2;
    });
}
function manageWorldPokeBalls() { if (GAME_STATE !== 'ROAMING') return; worldPokeBalls = worldPokeBalls.filter(ball => { const distSqToPlayer = distanceSq(player.worldX, player.worldY, ball.worldX, ball.worldY); return distSqToPlayer <= POKEBALL_DESPAWN_IF_FARTHER_THAN_SQ; }); const playerMovedSq = distanceSq(player.worldX, player.worldY, lastPlayerPosForPokeBallCheck.x, lastPlayerPosForPokeBallCheck.y); if (playerMovedSq < PLAYER_MOVE_THRESHOLD_FOR_POKEBALL_CHECK_SQ && worldPokeBalls.length > 0) { return; } lastPlayerPosForPokeBallCheck.x = player.worldX; lastPlayerPosForPokeBallCheck.y = player.worldY; let ballIsVisible = false; for (const ball of worldPokeBalls) { if (distanceSq(player.worldX, player.worldY, ball.worldX, ball.worldY) < PLAYER_VISIBILITY_RADIUS_FOR_POKEBALL_SQ) { ballIsVisible = true; break; } } if (!ballIsVisible && worldPokeBalls.length < MAX_ACTIVE_POKEBALLS_IN_WORLD) { let spawned = false; for (let attempt = 0; attempt < 10; attempt++) { const angle = Math.random() * Math.PI * 2; const targetSpawnX = player.worldX + Math.cos(angle) * POKEBALL_SPAWN_TARGET_DISTANCE_FROM_PLAYER; const targetSpawnY = player.worldY + Math.sin(angle) * POKEBALL_SPAWN_TARGET_DISTANCE_FROM_PLAYER; const spawnPos = findWalkableSpawn(targetSpawnX, targetSpawnY, 5); if (isWalkable(spawnPos.x, spawnPos.y)) { let tooCloseToOtherBall = false; for (const existingBall of worldPokeBalls) { if (distanceSq(spawnPos.x, spawnPos.y, existingBall.worldX, existingBall.worldY) < MIN_SPACING_BETWEEN_POKEBALLS_SQ) { tooCloseToOtherBall = true; break; } } if (!tooCloseToOtherBall) { worldPokeBalls.push({ id: Date.now() + Math.random().toString(16).slice(2), worldX: spawnPos.x, worldY: spawnPos.y }); spawned = true; break; } } } } }

// --- COLLISION CHECKS ---
function isCollidingWithHouse(playerCheckX, playerCheckY, playerSize) { if (!playerHouse || !preloadedHouseImage || playerHouse.collisionWidth === undefined || playerHouse.collisionHeight === undefined) { return false; } const playerLeft = playerCheckX - playerSize / 2; const playerRight = playerCheckX + playerSize / 2; const playerTop = playerCheckY - playerSize / 2; const playerBottom = playerCheckY + playerSize / 2; const houseCollisionLeft = playerHouse.worldX - playerHouse.collisionWidth / 2; const houseCollisionRight = playerHouse.worldX + playerHouse.collisionWidth / 2; const houseCollisionTop = playerHouse.worldY - playerHouse.collisionHeight / 2; const houseCollisionBottom = playerHouse.worldY + playerHouse.collisionHeight / 2; if (playerLeft < houseCollisionRight && playerRight > houseCollisionLeft && playerTop < houseCollisionBottom && playerBottom > houseCollisionTop) { return true; } return false; }
function isCollidingWithHospital(playerCheckX, playerCheckY, playerSize, hospital) { if (!hospital || !hospital.collisionWidth || !hospital.collisionHeight) { return false; } const playerLeft = playerCheckX - playerSize / 2; const playerRight = playerCheckX + playerSize / 2; const playerTop = playerCheckY - playerSize / 2; const playerBottom = playerCheckY + playerSize / 2; const hospitalCollisionLeft = hospital.worldX - hospital.collisionWidth / 2; const hospitalCollisionRight = hospital.worldX + hospital.collisionWidth / 2; const hospitalCollisionTop = hospital.worldY - hospital.collisionHeight / 2; const hospitalCollisionBottom = hospital.worldY + hospital.collisionHeight / 2; if (playerLeft < hospitalCollisionRight && playerRight > hospitalCollisionLeft && playerTop < hospitalCollisionBottom && playerBottom > hospitalCollisionTop) { return true; } return false; }
function isCollidingWithTree(objectX, objectY, objectWidth, objectHeight, tree) { if (!tree || !tree.collisionWidth || !tree.collisionHeight) { return false; } const objectLeft = objectX - objectWidth / 2; const objectRight = objectX + objectWidth / 2; const objectTop = objectY - objectHeight / 2; const objectBottom = objectY + objectHeight / 2; const treeCollisionLeft = tree.worldX - tree.collisionWidth / 2; const treeCollisionRight = tree.worldX + tree.collisionWidth / 2; const treeCollisionTop = tree.worldY - tree.collisionHeight; const treeCollisionBottom = tree.worldY; if (objectLeft < treeCollisionRight && objectRight > treeCollisionLeft && objectTop < treeCollisionBottom && objectBottom > treeCollisionTop) { return true; } return false; }

// --- RENDERING FUNCTIONS ---
// Main Render Loop Dispatchers
function renderOverworld() {
    try {
        ctx.clearRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);
        drawWorld();
        let objectsToDraw = [];
        const activeFollower = player.team.find(p => p.isFollowingPlayer && p.currentHp > 0);

        NPCS.forEach(npc => {
            const npcScreenX = npc.worldX - camera.x;
            if (npcScreenX + NPC_SPRITE_SIZE > 0 && npcScreenX - NPC_SPRITE_SIZE < NATIVE_WIDTH) {
                objectsToDraw.push({ type: 'npc', entity: npc, ySort: npc.worldY + NPC_SPRITE_SIZE / 2 });
            }
        });
        discoveredHospitals.filter(h => h.worldX !== -Infinity && h.width && h.height).forEach(h => {
            const hScreenX = h.worldX - camera.x - h.width / 2;
            if (hScreenX + h.width > 0 && hScreenX < NATIVE_WIDTH) {
                objectsToDraw.push({ type: 'hospital', entity: h, ySort: h.worldY + (h.collisionHeight * 0.30) });
            }
        });
        wildPokemon.forEach(p => {
            if (p === activeFollower) return;
            const pScreenX = p.worldX - camera.x;
            if (pScreenX + POKEMON_SPRITE_SIZE > 0 && pScreenX - POKEMON_SPRITE_SIZE < NATIVE_WIDTH) {
                objectsToDraw.push({ type: 'wildPokemon', entity: p, ySort: p.worldY + POKEMON_SPRITE_SIZE / 2 });
            }
        });
        masterBallChests.filter(c => !c.isOpen).forEach(c => {
            const cScreenX = c.worldX - camera.x - c.size / 2;
            if (cScreenX + c.size > 0 && cScreenX < NATIVE_WIDTH) {
                objectsToDraw.push({ type: 'masterBallChest', entity: c, ySort: c.worldY + MASTER_BALL_CHEST_SIZE / 2 });
            }
        });
        worldPokeBalls.forEach(b => {
            const bScreenX = b.worldX - camera.x;
            if (bScreenX + POKEBALL_SPRITE_SIZE > 0 && bScreenX - POKEBALL_SPRITE_SIZE < NATIVE_WIDTH) {
                objectsToDraw.push({ type: 'worldPokeBall', entity: b, ySort: b.worldY + POKEBALL_SPRITE_SIZE / 2 });
            }
        });

        objectsToDraw.push({ type: 'playerCharacter', entity: player, ySort: player.worldY + PLAYER_SIZE / 2 });

        if (otherPlayers && Object.keys(otherPlayers).length > 0) {
            Object.values(otherPlayers).forEach(op => {
                if (op && op.id && op.id !== myPlayerId) {
                    const opScreenX = op.worldX - camera.x;
                    const opScreenY = op.worldY - camera.y;
                    if (typeof op.worldX === 'number' && typeof op.worldY === 'number' &&
                        opScreenX + PLAYER_SIZE > 0 && opScreenX - PLAYER_SIZE < NATIVE_WIDTH &&
                        opScreenY + PLAYER_SIZE > 0 && opScreenY - PLAYER_SIZE < NATIVE_HEIGHT) {
                        objectsToDraw.push({ type: 'otherPlayer', entity: op, ySort: op.worldY + PLAYER_SIZE / 2 });
                    }
                }
            });
        }

        if (activeFollower && POKEMON_DATA[activeFollower.name]) {
            const followerScreenXCheck = activeFollower.worldX - camera.x;
            if (followerScreenXCheck + POKEMON_SPRITE_SIZE > 0 && followerScreenXCheck - POKEMON_SPRITE_SIZE < NATIVE_WIDTH) {
                objectsToDraw.push({ type: 'followerPokemon', entity: activeFollower, ySort: activeFollower.worldY + POKEMON_SPRITE_SIZE / 2 });
            }
        }
        if (playerHouse && preloadedHouseImage) {
            const houseScreenXCheck = playerHouse.worldX - camera.x - playerHouse.width / 2;
            if (houseScreenXCheck + playerHouse.width > 0 && houseScreenXCheck < NATIVE_WIDTH) {
                objectsToDraw.push({ type: 'playerHouse', entity: playerHouse, ySort: playerHouse.worldY + (playerHouse.collisionHeight * 0.35) });
            }
        }
        worldTrees.forEach(tree => {
            const treeScreenX = tree.worldX - camera.x - tree.width / 2;
            if (treeScreenX + tree.width > 0 && treeScreenX < NATIVE_WIDTH) {
                objectsToDraw.push({ type: 'tree', entity: tree, ySort: tree.worldY });
            }
        });

        objectsToDraw.sort((a, b) => a.ySort - b.ySort);

        objectsToDraw.forEach(obj => {
            switch (obj.type) {
                case 'playerCharacter':
                    ctx.fillStyle = 'darkblue'; ctx.beginPath(); ctx.arc(player.screenX, player.screenY, PLAYER_SIZE / 2, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = 'white'; ctx.font = `${PLAYER_SIZE * 0.6}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                    const animChar = player.isMoving ? (Math.floor(player.animationFrame) % 2 === 0 ? "o" : "O") : "P";
                    ctx.fillText(animChar, player.screenX, player.screenY);
                    break;
                case 'otherPlayer':
                    drawOtherPlayer(obj.entity);
                    break;
                case 'followerPokemon': drawSingleFollowerPokemon(obj.entity); break;
                case 'playerHouse':
                    const ph = obj.entity;
                    const houseScreenX = ph.worldX - camera.x - ph.width / 2;
                    const houseScreenY = ph.worldY - camera.y - ph.height / 2;
                    if (houseScreenX + ph.width > 0 && houseScreenX < NATIVE_WIDTH && houseScreenY + ph.height > 0 && houseScreenY < NATIVE_HEIGHT) {
                        if (preloadedHouseImage) {
                            ctx.drawImage(preloadedHouseImage, houseScreenX, houseScreenY, ph.width, ph.height);
                        } else {
                            ctx.fillStyle = '#CD853F'; ctx.fillRect(houseScreenX, houseScreenY, ph.width, ph.height);
                            ctx.strokeStyle = '#8B4513'; ctx.lineWidth = 2; ctx.strokeRect(houseScreenX, houseScreenY, ph.width, ph.height);
                        }
                    }
                    break;
                case 'npc': drawSingleNPC(obj.entity); break;
                case 'hospital': drawSingleHospital(obj.entity); break;
                case 'wildPokemon': if (obj.entity !== activeFollower) { drawSingleWildPokemon(obj.entity); } break;
                case 'masterBallChest': drawSingleMasterBallChest(obj.entity); break;
                case 'worldPokeBall': drawSingleWorldPokeBall(obj.entity); break;
                case 'tree': drawSingleTree(obj.entity); break;
            }
        });

        if (currentWorldDarknessOverlay !== 'rgba(0,0,0,0)') {
            ctx.fillStyle = currentWorldDarknessOverlay;
            ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);
        }
        drawOverworldParticles(ctx, camera);
        drawEnvironmentOverlays();
        drawActiveTasksUI();
        drawMinimap();
        drawDistanceTracker();
        updateHtmlGuidingArrow();
    } catch (err) {
        console.error("ERROR IN RENDER OVERWORLD FUNCTION:", err);
        if (ctx) {
            ctx.fillStyle = 'darkred'; ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);
            ctx.fillStyle = 'white'; ctx.font = '20px Courier New'; ctx.textAlign = 'center';
            const errorLines = wrapText(`Render Error: ${err.message}. Check console.`, NATIVE_WIDTH - 40);
            let errY = NATIVE_HEIGHT / 2 - (errorLines.length * 10);
            errorLines.forEach(line => { ctx.fillText(line, NATIVE_WIDTH / 2, errY); errY += 20; });
        }
    }
}
function renderSpecialState() { if (GAME_STATE === 'IN_PLAYER_HOUSE' || GAME_STATE === 'HOUSE_ACTION_PROMPT') { renderPlayerHouseInterior(); } else if (GAME_STATE === 'HOSPITAL_INTERIOR' || GAME_STATE === 'HOSPITAL_HEAL_PROMPT') { renderHospitalInterior(); } else if (GAME_STATE === 'NPC_INTERACTION') { renderNpcInteraction(); } else if (GAME_STATE === 'ITEM_CHEST_PROMPT') { renderItemChestInteraction(); } else if (GAME_STATE === 'POKEMON_STORAGE_UI') { renderPokemonStorageUI(); } else if (GAME_STATE === 'MOVE_LEARNING_PROMPT') { renderMoveLearningPrompt(); } else if (GAME_STATE === 'MENU_OPEN') { renderOverworld(); } if (GAME_STATE === 'ROAMING' || GAME_STATE === 'MENU_OPEN') { /* Guiding arrow handled by HTML element now */ } }
function renderPausedScreen() { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(0,0, NATIVE_WIDTH, NATIVE_HEIGHT); ctx.fillStyle = 'white'; ctx.font = '30px Courier New'; ctx.textAlign = 'center'; ctx.fillText("PAUSED", NATIVE_WIDTH / 2, NATIVE_HEIGHT / 2 - 20); ctx.font = '16px Courier New'; ctx.fillText("Tap to Resume", NATIVE_WIDTH / 2, NATIVE_HEIGHT / 2 + 20); drawActiveTasksUI(); }

// Individual Component Renderers
function drawWorld() { const startCol = Math.floor(camera.x / TILE_SIZE); const endCol = startCol + Math.ceil(NATIVE_WIDTH / TILE_SIZE) + 2; const startRow = Math.floor(camera.y / TILE_SIZE); const endRow = startRow + Math.ceil(NATIVE_HEIGHT / TILE_SIZE) + 2; for (let r = startRow; r < endRow; r++) { for (let c = startCol; c < endCol; c++) { const tileWorldX = c * TILE_SIZE; const tileWorldY = r * TILE_SIZE; const tileScreenX = tileWorldX - camera.x; const tileScreenY = tileWorldY - camera.y; const noiseVal = fbm_noise(c / 20, r / 20, worldSeed); const detailNoise = fbm_noise(c/5, r/5, worldSeed + 10); ctx.fillStyle = getTileColor(noiseVal); ctx.fillRect(tileScreenX, tileScreenY, TILE_SIZE, TILE_SIZE); if (noiseVal >= 0.35 && noiseVal < 0.45) { if (detailNoise > 0.6) { ctx.fillStyle = 'rgba(34, 139, 34, 0.3)'; ctx.fillRect(tileScreenX + TILE_SIZE/4, tileScreenY + TILE_SIZE/4, TILE_SIZE/2, TILE_SIZE/2);}} else if (noiseVal >= 0.45) { if (detailNoise < 0.4) { ctx.fillStyle = 'rgba(222, 184, 135, 0.3)'; ctx.fillRect(tileScreenX + TILE_SIZE/4, tileScreenY + TILE_SIZE/4, TILE_SIZE/2, TILE_SIZE/2);}}}} }
function drawEnvironmentOverlays() { if (currentLightOverlay !== 'rgba(0,0,0,0)') { ctx.fillStyle = currentLightOverlay; ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT); } if (weather === "rainy") { ctx.strokeStyle = 'rgba(170,170,230,0.5)'; ctx.lineWidth = 1; rainParticles.forEach(p => { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.s/2, p.y + p.l); ctx.stroke(); }); } }
// drawOverworldParticles is duplicated, remove one. The one inside spawnWildPokemon seems more complete.
// The one here is simpler. Let's keep the one near spawnWildPokemon.
// function drawOverworldParticles(ctx, camera) { overworldParticles.forEach(p => { const screenX = p.x - camera.x; const screenY = p.y - camera.y; ctx.globalAlpha = p.opacity; ctx.fillStyle = p.color; if (p.type === 'sparkle') { ctx.beginPath(); for (let i = 0; i < 5; i++) { ctx.lineTo(screenX + p.size * Math.cos( (18 + i * 72) * Math.PI / 180 ), screenY + p.size * Math.sin( (18 + i * 72) * Math.PI / 180 )); ctx.lineTo(screenX + (p.size/2) * Math.cos( (54 + i * 72) * Math.PI / 180 ), screenY + (p.size/2) * Math.sin( (54 + i * 72) * Math.PI / 180 )); } ctx.closePath(); ctx.fill(); } else if (p.type === 'dark_smoke') { ctx.beginPath(); ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2); ctx.fill(); } ctx.globalAlpha = 1.0; }); }

function renderPlayerHouseInterior() {
    ctx.fillStyle = '#FFFFFF'; // Clear the canvas for the house interior
    ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT);

    // --- START: Original House Element Drawing Logic ---
    // Bed
    let bedDrawX = NATIVE_WIDTH * 0.1;
    let bedDrawY = NATIVE_HEIGHT * 0.7;
    let bedDrawW, bedDrawH;
    if (preloadedBedImage && preloadedBedImage instanceof Image) {
        bedDrawW = preloadedBedImage.naturalWidth; // Or scale them if too big
        bedDrawH = preloadedBedImage.naturalHeight;
        ctx.drawImage(preloadedBedImage, bedDrawX, bedDrawY, bedDrawW, bedDrawH);
    } else {
        // Fallback drawing if image didn't load
        bedDrawW = NATIVE_WIDTH * 0.25;
        bedDrawH = NATIVE_HEIGHT * 0.18;
        ctx.fillStyle = '#A0522D'; // Brown for bed
        ctx.fillRect(bedDrawX, bedDrawY, bedDrawW, bedDrawH);
        ctx.fillStyle = 'black';
        ctx.font = '11px Courier New';
        ctx.textAlign = 'center';
        ctx.fillText("Bed", bedDrawX + bedDrawW / 2, bedDrawY + bedDrawH / 2 + 4);
    }
    houseBedRect = { x: bedDrawX, y: bedDrawY, w: bedDrawW, h: bedDrawH };

    // Pokemon Storage Chest (PC)
    housePokemonChestRect = { x: NATIVE_WIDTH * 0.7, y: NATIVE_HEIGHT * 0.7, w: TILE_SIZE * 1.5, h: TILE_SIZE };
    ctx.fillStyle = '#8B4513'; // Dark brown for chest
    ctx.fillRect(housePokemonChestRect.x, housePokemonChestRect.y, housePokemonChestRect.w, housePokemonChestRect.h);
    ctx.fillStyle = '#DAA520'; // Gold-ish for lock/handle
    ctx.fillRect(housePokemonChestRect.x + housePokemonChestRect.w * 0.35, housePokemonChestRect.y + housePokemonChestRect.h * 0.4, housePokemonChestRect.w * 0.3, housePokemonChestRect.h * 0.2);
    ctx.fillStyle = 'black';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText("PC Storage", housePokemonChestRect.x + housePokemonChestRect.w / 2, housePokemonChestRect.y + housePokemonChestRect.h + 10);

    // Item Storage Chest
    const chestGap = TILE_SIZE * 1.5;
    houseItemChestRect = { x: housePokemonChestRect.x, y: housePokemonChestRect.y - housePokemonChestRect.h - chestGap, w: TILE_SIZE * 1.5, h: TILE_SIZE };
    ctx.fillStyle = '#654321'; // Another brown for item chest
    ctx.fillRect(houseItemChestRect.x, houseItemChestRect.y, houseItemChestRect.w, houseItemChestRect.h);
    ctx.fillStyle = '#C0C0C0'; // Silver for lock/handle
    ctx.fillRect(houseItemChestRect.x + houseItemChestRect.w * 0.35, houseItemChestRect.y + houseItemChestRect.h * 0.4, houseItemChestRect.w * 0.3, houseItemChestRect.h * 0.2);
    ctx.fillStyle = 'black';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText("Storage", houseItemChestRect.x + houseItemChestRect.w / 2, houseItemChestRect.y + houseItemChestRect.h + 10);

    // Door
    houseDoorRect = { x: NATIVE_WIDTH * 0.425, y: NATIVE_HEIGHT * 0.05, w: NATIVE_WIDTH * 0.15, h: TILE_SIZE * 1.8 };
    ctx.fillStyle = '#007bff'; // Blue for door
    ctx.fillRect(houseDoorRect.x, houseDoorRect.y, houseDoorRect.w, houseDoorRect.h);
    ctx.fillStyle = 'white';
    ctx.font = '11px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText("Door", houseDoorRect.x + houseDoorRect.w / 2, houseDoorRect.y + houseDoorRect.h / 2 + 4);
    // --- END: Original House Element Drawing Logic ---

    player.draw(); // Draw the local player

    // --- START MODIFICATION: Draw other players in the house ---
    if (otherPlayers && Object.keys(otherPlayers).length > 0) {
        Object.values(otherPlayers).forEach(opData => {
            if (opData && opData.id && opData.id !== myPlayerId) {
                // The drawOtherPlayer function (from script2.js) already handles
                // calculating screenX/Y based on opData.worldX/Y and the camera.
                // Since camera.x/y are usually 0 when in house state, worldX/Y of other players
                // will be used directly as screen coordinates if not offset.
                drawOtherPlayer(opData);
            }
        });
    }
    // --- END MODIFICATION ---

    if (houseActionPrompt.active) {
        const promptWidth = NATIVE_WIDTH * 0.5;
        const promptHeightCalculated = NATIVE_HEIGHT * 0.15 + (houseActionPrompt.options.length * 40);
        const promptHeight = Math.min(promptHeightCalculated, NATIVE_HEIGHT * 0.8);
        const promptX = (NATIVE_WIDTH - promptWidth) / 2;
        const promptY = (NATIVE_HEIGHT - promptHeight) / 2;
        const lineHeight = 20;
        const padding = 15;
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(promptX, promptY, promptWidth, promptHeight);
        ctx.strokeStyle = "white";
        ctx.lineWidth = 1;
        ctx.strokeRect(promptX, promptY, promptWidth, promptHeight);
        ctx.fillStyle = "white";
        ctx.font = "16px 'Courier New'";
        ctx.textAlign = "center";
        let textY = promptY + padding + lineHeight;
        houseActionPrompt.text.forEach(line => { ctx.fillText(line, promptX + promptWidth/2, textY); textY += lineHeight; });
        const buttonWidth = promptWidth * 0.4;
        const buttonHeight = 35;
        const totalButtonBlockHeight = houseActionPrompt.options.length * (buttonHeight + 10) - 10;
        let startButtonY = promptY + promptHeight - padding - totalButtonBlockHeight;
        if (houseActionPrompt.options.length === 1) {
            startButtonY = promptY + promptHeight - padding - buttonHeight;
        }
        houseActionPrompt.options.forEach((opt, index) => {
            opt.rect = { x: promptX + (promptWidth - buttonWidth)/2 , y: startButtonY + (index * (buttonHeight + 10)), w: buttonWidth, h: buttonHeight };
            ctx.fillStyle = opt.color || "#6c757d";
            ctx.fillRect(opt.rect.x, opt.rect.y, opt.rect.w, opt.rect.h);
            ctx.fillStyle = "white";
            ctx.fillText(opt.text, opt.rect.x + opt.rect.w / 2, opt.rect.y + opt.rect.h / 2 + 5);
        });
    }

    drawActiveTasksUI();
    drawMinimap();
    drawDistanceTracker();
}

function renderHospitalInterior() { ctx.fillStyle = '#FAFAFA'; ctx.fillRect(0,0, NATIVE_WIDTH, NATIVE_HEIGHT); ctx.fillStyle = '#FFC0CB'; ctx.beginPath(); ctx.arc(nurseScreenPos.x, nurseScreenPos.y, PLAYER_SIZE * 0.8, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'black'; ctx.font = '12px Arial'; ctx.textAlign = 'center'; ctx.fillText("Nurse", nurseScreenPos.x, nurseScreenPos.y + PLAYER_SIZE * 1.2); hospitalPokemonChestRect = {x: NATIVE_WIDTH * 0.8, y: NATIVE_HEIGHT * 0.15, w: TILE_SIZE * 1.5, h: TILE_SIZE}; ctx.fillStyle = '#4A90E2'; ctx.fillRect(hospitalPokemonChestRect.x, hospitalPokemonChestRect.y, hospitalPokemonChestRect.w, hospitalPokemonChestRect.h); ctx.fillStyle = '#D0E0F0'; ctx.fillRect(hospitalPokemonChestRect.x + hospitalPokemonChestRect.w*0.35, hospitalPokemonChestRect.y + hospitalPokemonChestRect.h*0.4, hospitalPokemonChestRect.w*0.3, hospitalPokemonChestRect.h*0.2); ctx.fillStyle = 'black'; ctx.font = '11px Courier New'; ctx.textAlign = 'center'; ctx.fillText("PC Storage", hospitalPokemonChestRect.x + hospitalPokemonChestRect.w/2, hospitalPokemonChestRect.y + hospitalPokemonChestRect.h + 10); hospitalExitRect = { x: NATIVE_WIDTH * 0.4, y: NATIVE_HEIGHT * 0.85, w: NATIVE_WIDTH * 0.2, h: NATIVE_HEIGHT * 0.1 }; ctx.fillStyle = '#778899'; ctx.fillRect(hospitalExitRect.x, hospitalExitRect.y, hospitalExitRect.w, hospitalExitRect.h); ctx.fillStyle = 'white'; ctx.font = '16px Courier New'; ctx.textAlign = 'center'; ctx.fillText("Exit", hospitalExitRect.x + hospitalExitRect.w/2, hospitalExitRect.y + hospitalExitRect.h/2 + 5); player.draw(); if (healPromptActive) { ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillRect(NATIVE_WIDTH * 0.2, NATIVE_HEIGHT * 0.4, NATIVE_WIDTH * 0.6, NATIVE_HEIGHT * 0.25); ctx.fillStyle = "white"; ctx.font = "16px 'Courier New'"; ctx.textAlign = "center"; ctx.fillText("Heal your Pokemon?", NATIVE_WIDTH / 2, NATIVE_HEIGHT * 0.4 + 30); healPromptYesRect = { x: NATIVE_WIDTH * 0.25, y: NATIVE_HEIGHT * 0.53, w: NATIVE_WIDTH * 0.2, h: 35 }; healPromptNoRect = { x: NATIVE_WIDTH * 0.55, y: NATIVE_HEIGHT * 0.53, w: NATIVE_WIDTH * 0.2, h: 35 }; ctx.fillStyle = "#5cb85c"; ctx.fillRect(healPromptYesRect.x, healPromptYesRect.y, healPromptYesRect.w, healPromptYesRect.h); ctx.fillStyle = "white"; ctx.fillText("YES", healPromptYesRect.x + healPromptYesRect.w/2, healPromptYesRect.y + healPromptYesRect.h/2 + 5); ctx.fillStyle = "#d9534f"; ctx.fillRect(healPromptNoRect.x, healPromptNoRect.y, healPromptNoRect.w, healPromptNoRect.h); ctx.fillStyle = "white"; ctx.fillText("NO", healPromptNoRect.x + healPromptNoRect.w/2, healPromptNoRect.y + healPromptNoRect.h/2 + 5); } drawActiveTasksUI(); drawMinimap(); drawDistanceTracker(); }
function renderNpcInteraction() { ctx.save(); ctx.globalAlpha = 0.3; if (previousGameState === 'ROAMING' || previousGameState === 'MENU_OPEN') { renderOverworld(); } else if (previousGameState === 'IN_PLAYER_HOUSE') { renderPlayerHouseInterior(); } else if (previousGameState === 'HOSPITAL_INTERIOR') { renderHospitalInterior(); } else { drawWorld(); } ctx.restore(); drawActiveTasksUI(); if (!npcInteractionPromptActive || !currentInteractingNPC) return; const basePromptWidth = NATIVE_WIDTH * 0.7; const padding = 15; const lineHeight = 18; const buttonHeight = 35; const buttonTopMargin = 15; ctx.font = "14px 'Courier New'"; let allTextLines = []; npcPromptText.forEach(line => { const wrappedLines = wrapText(line, basePromptWidth - padding * 2); allTextLines.push(...wrappedLines); }); const textBlockHeight = allTextLines.length * lineHeight; const buttonsHeight = npcPromptOptions.length > 0 ? buttonHeight + buttonTopMargin : 0; let promptHeight = padding + textBlockHeight + buttonsHeight + padding; let promptWidth = basePromptWidth; const promptX = (NATIVE_WIDTH - promptWidth) / 2; const promptY = (NATIVE_HEIGHT - promptHeight) / 2; ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(promptX, promptY, promptWidth, promptHeight); ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.strokeRect(promptX, promptY, promptWidth, promptHeight); ctx.fillStyle = "white"; ctx.textAlign = "left"; let currentTextY = promptY + padding + lineHeight * 0.8; allTextLines.forEach(line => { ctx.fillText(line, promptX + padding, currentTextY); currentTextY += lineHeight; }); if (npcPromptOptions.length > 0) { const totalButtonAreaWidth = promptWidth - padding * 2; const numButtons = npcPromptOptions.length; let buttonWidth = (totalButtonAreaWidth - (padding * (numButtons - 1))) / numButtons; buttonWidth = Math.min(buttonWidth, promptWidth * 0.4); const totalRequiredButtonWidth = (buttonWidth * numButtons) + (padding * (numButtons - 1)); let startButtonX = promptX + (promptWidth - totalRequiredButtonWidth) / 2; npcPromptOptions.forEach((opt, index) => { opt.rect = { x: startButtonX + (index * (buttonWidth + padding)), y: promptY + promptHeight - buttonHeight - padding, w: buttonWidth, h: buttonHeight }; ctx.fillStyle = opt.color || "#6c757d"; ctx.fillRect(opt.rect.x, opt.rect.y, opt.rect.w, opt.rect.h); ctx.fillStyle = "white"; ctx.textAlign = "center"; ctx.font = "12px 'Courier New'"; ctx.fillText(opt.text, opt.rect.x + opt.rect.w / 2, opt.rect.y + opt.rect.h / 2 + 4); }); } }
function renderItemChestInteraction() { const isHouseContext = itemChestPrompt.chestType === "house_item_chest"; if (isHouseContext) renderPlayerHouseInterior(); else if (GAME_STATE === 'ROAMING' || GAME_STATE === 'ITEM_CHEST_PROMPT') { ctx.save(); ctx.globalAlpha = 0.3; renderOverworld(); ctx.restore(); } if (!itemChestPrompt.active) return; const promptWidth = NATIVE_WIDTH * 0.5; const promptHeightCalculated = NATIVE_HEIGHT * 0.15 + (itemChestPrompt.options.length * 45) ; const promptHeight = Math.min(promptHeightCalculated, NATIVE_HEIGHT * 0.8); const promptX = (NATIVE_WIDTH - promptWidth) / 2; const promptY = (NATIVE_HEIGHT - promptHeight) / 2; const lineHeight = 20; const padding = 15; const chestColor = isHouseContext ? "rgba(70,50,30,0.85)" : "rgba(50,30,10,0.85)"; ctx.fillStyle = chestColor; ctx.fillRect(promptX, promptY, promptWidth, promptHeight); ctx.strokeStyle = "gold"; ctx.lineWidth = 2; ctx.strokeRect(promptX, promptY, promptWidth, promptHeight); ctx.fillStyle = "white"; ctx.font = "16px 'Courier New'"; ctx.textAlign = "center"; let textY = promptY + padding + lineHeight; itemChestPrompt.text.forEach(line => { ctx.fillText(line, promptX + promptWidth/2, textY); textY += lineHeight; }); textY += 5; const buttonWidth = promptWidth * 0.4; const buttonHeight = 35; itemChestPrompt.options.forEach((opt, index) => { opt.rect = { x: promptX + (promptWidth - buttonWidth)/2 , y: textY + (index * (buttonHeight + 10)), w: buttonWidth, h: buttonHeight }; ctx.fillStyle = opt.color || "#6c757d"; ctx.fillRect(opt.rect.x, opt.rect.y, opt.rect.w, opt.rect.h); ctx.fillStyle = "white"; ctx.fillText(opt.text, opt.rect.x + opt.rect.w / 2, opt.rect.y + opt.rect.h / 2 + 5); }); }
function renderPokemonStorageUI() { ctx.fillStyle = "rgba(0,0,0,0.85)"; ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT); ctx.fillStyle = "white"; ctx.font = "24px 'Courier New'"; ctx.textAlign = "center"; ctx.fillText("Pokémon Storage", NATIVE_WIDTH / 2, 50); pokemonStorageUI.buttons = []; const teamArea = pokemonStorageUI.teamListArea; ctx.font = "18px 'Courier New'"; ctx.textAlign = "center"; ctx.fillText("Your Team", teamArea.x + teamArea.w / 2, teamArea.y - 10); ctx.strokeStyle = "gray"; ctx.strokeRect(teamArea.x, teamArea.y, teamArea.w, teamArea.h); ctx.save(); ctx.beginPath(); ctx.rect(teamArea.x, teamArea.y, teamArea.w, teamArea.h); ctx.clip(); let teamY = teamArea.y + pokemonStorageUI.itemPadding - teamArea.scrollY; player.team.forEach((pkmn, index) => { if (teamY + teamArea.itemHeight > teamArea.y && teamY < teamArea.y + teamArea.h) { ctx.fillStyle = pkmn.currentHp > 0 ? "rgba(255,255,255,0.1)" : "rgba(255,100,100,0.2)"; ctx.fillRect(teamArea.x + pokemonStorageUI.itemPadding, teamY, teamArea.w - pokemonStorageUI.itemPadding * 2, teamArea.itemHeight - pokemonStorageUI.itemPadding); ctx.fillStyle = pkmn.color || 'grey'; ctx.fillRect(teamArea.x + pokemonStorageUI.itemPadding * 2, teamY + pokemonStorageUI.itemPadding, 20, 20); ctx.fillStyle = 'black'; ctx.font = `14px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pkmn.spriteChar, teamArea.x + pokemonStorageUI.itemPadding * 2 + 10, teamY + pokemonStorageUI.itemPadding + 11); ctx.fillStyle = "white"; ctx.font = "12px 'Courier New'"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(`${pkmn.name} Lvl:${pkmn.level} HP:${pkmn.currentHp}/${pkmn.maxHp}`, teamArea.x + pokemonStorageUI.itemPadding * 2 + 25, teamY + teamArea.itemHeight / 2); const buttonRect = { x: teamArea.x + teamArea.w - pokemonStorageUI.buttonWidth - pokemonStorageUI.itemPadding * 2, y: teamY + (teamArea.itemHeight - pokemonStorageUI.itemPadding - pokemonStorageUI.buttonHeight) / 2, w: pokemonStorageUI.buttonWidth, h: pokemonStorageUI.buttonHeight }; const canStore = player.team.length > 1; ctx.fillStyle = canStore ? "#d9534f" : "#555"; ctx.fillRect(buttonRect.x, buttonRect.y, buttonRect.w, buttonRect.h); ctx.fillStyle = "white"; ctx.font = "11px 'Courier New'"; ctx.textAlign = "center"; ctx.fillText("Store", buttonRect.x + buttonRect.w / 2, buttonRect.y + buttonRect.h / 2 + 1); if (canStore) { pokemonStorageUI.buttons.push({ rect: buttonRect, action: 'store_team', pokemonIndex: index }); } } teamY += teamArea.itemHeight; }); ctx.restore(); const storedArea = pokemonStorageUI.storedListArea; ctx.font = "18px 'Courier New'"; ctx.textAlign = "center"; ctx.fillText("In Storage", storedArea.x + storedArea.w / 2, storedArea.y - 10); ctx.strokeStyle = "gray"; ctx.strokeRect(storedArea.x, storedArea.y, storedArea.w, storedArea.h); ctx.save(); ctx.beginPath(); ctx.rect(storedArea.x, storedArea.y, storedArea.w, storedArea.h); ctx.clip(); let storedY = storedArea.y + pokemonStorageUI.itemPadding - storedArea.scrollY; player.storedPokemon.forEach((pkmn, index) => { if (storedY + storedArea.itemHeight > storedArea.y && storedY < storedArea.y + storedArea.h) { ctx.fillStyle = pkmn.currentHp > 0 ? "rgba(255,255,255,0.1)" : "rgba(255,100,100,0.2)"; ctx.fillRect(storedArea.x + pokemonStorageUI.itemPadding, storedY, storedArea.w - pokemonStorageUI.itemPadding * 2, storedArea.itemHeight - pokemonStorageUI.itemPadding); ctx.fillStyle = pkmn.color || 'grey'; ctx.fillRect(storedArea.x + pokemonStorageUI.itemPadding * 2, storedY + pokemonStorageUI.itemPadding, 20, 20); ctx.fillStyle = 'black'; ctx.font = `14px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pkmn.spriteChar, storedArea.x + pokemonStorageUI.itemPadding * 2 + 10, storedY + pokemonStorageUI.itemPadding + 11); ctx.fillStyle = "white"; ctx.font = "12px 'Courier New'"; ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(`${pkmn.name} Lvl:${pkmn.level} HP:${pkmn.currentHp}/${pkmn.maxHp}`, storedArea.x + pokemonStorageUI.itemPadding * 2 + 25, storedY + storedArea.itemHeight / 2); const buttonRect = { x: storedArea.x + storedArea.w - pokemonStorageUI.buttonWidth - pokemonStorageUI.itemPadding * 2, y: storedY + (storedArea.itemHeight - pokemonStorageUI.itemPadding - pokemonStorageUI.buttonHeight) / 2, w: pokemonStorageUI.buttonWidth, h: pokemonStorageUI.buttonHeight }; const canAddToTeam = player.team.length < 6; ctx.fillStyle = canAddToTeam ? "#5cb85c" : "#555"; ctx.fillRect(buttonRect.x, buttonRect.y, buttonRect.w, buttonRect.h); ctx.fillStyle = "white"; ctx.font = "11px 'Courier New'"; ctx.textAlign = "center"; ctx.fillText("To Team", buttonRect.x + buttonRect.w / 2, buttonRect.y + buttonRect.h / 2 + 1); if (canAddToTeam) { pokemonStorageUI.buttons.push({ rect: buttonRect, action: 'add_stored', pokemonIndex: index }); } } storedY += storedArea.itemHeight; }); ctx.restore(); const teamContentHeight = player.team.length * teamArea.itemHeight; if (teamContentHeight > teamArea.h) { const upArrowRect = {x: teamArea.x + teamArea.w - pokemonStorageUI.scrollButtonSize - 5, y: teamArea.y + 5, w: pokemonStorageUI.scrollButtonSize, h: pokemonStorageUI.scrollButtonSize}; const downArrowRect = {x: teamArea.x + teamArea.w - pokemonStorageUI.scrollButtonSize - 5, y: teamArea.y + teamArea.h - pokemonStorageUI.scrollButtonSize - 5, w: pokemonStorageUI.scrollButtonSize, h: pokemonStorageUI.scrollButtonSize}; ctx.fillStyle = "#777"; ctx.fillRect(upArrowRect.x, upArrowRect.y, upArrowRect.w, upArrowRect.h); ctx.fillRect(downArrowRect.x, downArrowRect.y, downArrowRect.w, downArrowRect.h); ctx.fillStyle = "white"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.font = "12px Arial"; ctx.fillText("▲", upArrowRect.x + upArrowRect.w/2, upArrowRect.y + upArrowRect.h/2 + 1); ctx.fillText("▼", downArrowRect.x + downArrowRect.w/2, downArrowRect.y + downArrowRect.h/2 +1); pokemonStorageUI.buttons.push({ rect: upArrowRect, action: 'scroll_team_up'}); pokemonStorageUI.buttons.push({ rect: downArrowRect, action: 'scroll_team_down'}); } const storedContentHeight = player.storedPokemon.length * storedArea.itemHeight; if (storedContentHeight > storedArea.h) { const upArrowRect = {x: storedArea.x + storedArea.w - pokemonStorageUI.scrollButtonSize - 5, y: storedArea.y + 5, w: pokemonStorageUI.scrollButtonSize, h: pokemonStorageUI.scrollButtonSize}; const downArrowRect = {x: storedArea.x + storedArea.w - pokemonStorageUI.scrollButtonSize - 5, y: storedArea.y + storedArea.h - pokemonStorageUI.scrollButtonSize - 5, w: pokemonStorageUI.scrollButtonSize, h: pokemonStorageUI.scrollButtonSize}; ctx.fillStyle = "#777"; ctx.fillRect(upArrowRect.x, upArrowRect.y, upArrowRect.w, upArrowRect.h); ctx.fillRect(downArrowRect.x, downArrowRect.y, downArrowRect.w, downArrowRect.h); ctx.fillStyle = "white"; ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.font = "12px Arial"; ctx.fillText("▲", upArrowRect.x + upArrowRect.w/2, upArrowRect.y + upArrowRect.h/2+1); ctx.fillText("▼", downArrowRect.x + downArrowRect.w/2, downArrowRect.y + downArrowRect.h/2+1); pokemonStorageUI.buttons.push({ rect: upArrowRect, action: 'scroll_stored_up'}); pokemonStorageUI.buttons.push({ rect: downArrowRect, action: 'scroll_stored_down'}); } ctx.fillStyle = "#6c757d"; ctx.fillRect(pokemonStorageUI.closeButtonRect.x, pokemonStorageUI.closeButtonRect.y, pokemonStorageUI.closeButtonRect.w, pokemonStorageUI.closeButtonRect.h); ctx.fillStyle = "white"; ctx.font = "16px 'Courier New'"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("Close", pokemonStorageUI.closeButtonRect.x + pokemonStorageUI.closeButtonRect.w / 2, pokemonStorageUI.closeButtonRect.y + pokemonStorageUI.closeButtonRect.h / 2); pokemonStorageUI.buttons.push({ rect: pokemonStorageUI.closeButtonRect, action: 'close_storage' }); }
function renderMoveLearningPrompt() { if (previousGameState === 'ROAMING' || previousGameState === 'MENU_OPEN') { ctx.save(); ctx.globalAlpha = 0.5; renderOverworld(); ctx.restore(); } else if (previousGameState === 'BATTLE' || previousGameState === 'BATTLE_STARTING') { ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT); } else if (previousGameState === 'IN_PLAYER_HOUSE') { ctx.save(); ctx.globalAlpha = 0.5; renderPlayerHouseInterior(); ctx.restore(); } else { ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(0, 0, NATIVE_WIDTH, NATIVE_HEIGHT); } const promptWidth = NATIVE_WIDTH * 0.8; const optionHeight = 35; const padding = 15; const textLineHeight = 20; let promptHeight = padding * 2 + moveLearningPrompt.text.length * textLineHeight; promptHeight += moveLearningPrompt.options.length * (optionHeight + 5) + padding; const promptX = (NATIVE_WIDTH - promptWidth) / 2; const promptY = (NATIVE_HEIGHT - promptHeight) / 2; ctx.fillStyle = "rgba(50,50,100,0.9)"; ctx.fillRect(promptX, promptY, promptWidth, promptHeight); ctx.strokeStyle = "white"; ctx.lineWidth = 2; ctx.strokeRect(promptX, promptY, promptWidth, promptHeight); ctx.fillStyle = "white"; ctx.font = "16px 'Courier New'"; ctx.textAlign = "center"; let currentY = promptY + padding + textLineHeight / 2; moveLearningPrompt.text.forEach(line => { ctx.fillText(line, promptX + promptWidth / 2, currentY); currentY += textLineHeight; }); currentY += padding / 2; const buttonWidth = promptWidth * 0.8; const buttonX = promptX + (promptWidth - buttonWidth) / 2; moveLearningPrompt.options.forEach((opt, index) => { opt.rect = { x: buttonX, y: currentY, w: buttonWidth, h: optionHeight }; ctx.fillStyle = opt.color || "#6c757d"; ctx.fillRect(opt.rect.x, opt.rect.y, opt.rect.w, opt.rect.h); ctx.fillStyle = "white"; ctx.font = "14px 'Courier New'"; ctx.fillText(opt.text, opt.rect.x + opt.rect.w / 2, opt.rect.y + opt.rect.h / 2 + 5); currentY += optionHeight + 5; }); }
// Y-Sorted Overworld Object Drawing Helpers
function drawSingleNPC(npc) { if (!npc) return; const screenX = npc.worldX - camera.x; const screenY = npc.worldY - camera.y; if (screenX > -NPC_SPRITE_SIZE && screenX < NATIVE_WIDTH + NPC_SPRITE_SIZE && screenY > -NPC_SPRITE_SIZE && screenY < NATIVE_HEIGHT + NPC_SPRITE_SIZE) { ctx.fillStyle = npc.color; ctx.beginPath(); ctx.arc(screenX, screenY, NPC_SPRITE_SIZE / 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'black'; ctx.font = `${NPC_SPRITE_SIZE * 0.7}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(npc.spriteChar, screenX, screenY); ctx.fillStyle = 'white'; ctx.font = '10px Courier New'; ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(npc.name, screenX, screenY + NPC_SPRITE_SIZE / 2 + 3); let symbolToDraw = null; let symbolColor = 'blue'; const playerTaskForThisNPC = player.activeTasks.find(task => task.npcId === npc.id); if (npc.isAwaitingRespawn) { symbolToDraw = null; } else if (playerTaskForThisNPC && playerTaskForThisNPC.taskDetails) { const taskChain = ALL_NPC_TASK_CHAINS[npc.taskChainName]; const currentTaskDefForNPC = taskChain ? taskChain[npc.currentTaskChainIndex] : null; if (currentTaskDefForNPC && playerTaskForThisNPC.taskDetails.objective === currentTaskDefForNPC.objective) { if (isTaskCompletable(playerTaskForThisNPC, currentTaskDefForNPC)) { symbolToDraw = "$"; symbolColor = 'lime'; } else { symbolToDraw = "?"; symbolColor = 'yellow'; } } else if (isTaskCompletable(playerTaskForThisNPC, playerTaskForThisNPC.taskDetails)) { symbolToDraw = "$"; symbolColor = 'lime'; } else { symbolToDraw = "?"; symbolColor = 'yellow'; } } else if (npc.currentTaskChainIndex < ALL_NPC_TASK_CHAINS[npc.taskChainName].length) { symbolToDraw = "!"; symbolColor = 'blue'; } if (symbolToDraw) { const bounceOffset = Math.sin(Date.now() * 0.004) * 4; ctx.fillStyle = symbolColor; ctx.font = 'bold 24px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom'; ctx.fillText(symbolToDraw, screenX, screenY - NPC_SPRITE_SIZE / 2 - 5 + bounceOffset); } } }
function drawSingleWildPokemon(p) {
    if (!p) return;
    const screenX = p.worldX - camera.x;
    const screenY = p.worldY - camera.y;
    let pSpriteSize = POKEMON_SPRITE_SIZE;
    if (p.variant === 'shiny') pSpriteSize *= 0.8;
    else if (p.variant === 'dark') pSpriteSize *= 1.5;

    if (screenX > -pSpriteSize && screenX < NATIVE_WIDTH + pSpriteSize && screenY > -pSpriteSize && screenY < NATIVE_HEIGHT + pSpriteSize) {
        const pDataEntry = POKEMON_DATA[p.name];
        if (pDataEntry) {
            let pSpriteToUse = null;
            const isShiny = p.variant === 'shiny';

            if (preloadedPokemonSprites[p.name]) {
                const preloaded = preloadedPokemonSprites[p.name];
                if (isShiny && preloaded.static_shiny instanceof Image) {
                    pSpriteToUse = preloaded.static_shiny;
                } else if (!isShiny && preloaded.static_default instanceof Image) {
                    pSpriteToUse = preloaded.static_default;
                } else if (isShiny && preloaded.static_default instanceof Image) { // Fallback for shiny if only default is loaded
                    pSpriteToUse = preloaded.static_default;
                }
            }

            if (!(pSpriteToUse instanceof Image) && pDataEntry.sprites) {
                const urlToLoad = isShiny ? pDataEntry.sprites.front_shiny : pDataEntry.sprites.front_default;
                const typeToLoad = isShiny ? 'static_shiny' : 'static_default';
                if (urlToLoad) {
                     getOrLoadPokemonSprite(p.name, typeToLoad, urlToLoad).then(img => {
                         if (img instanceof Image && p === currentBattle?.enemyPokemon) {
                            if (GAME_STATE === 'BATTLE') updateBattleUI();
                         }
                     });
                }
            }

            if (p.variant === 'shiny' && Math.random() < 0.1) createOverworldParticle(p.worldX, p.worldY, 'sparkle', p);
            else if (p.variant === 'dark' && Math.random() < 0.15) createOverworldParticle(p.worldX, p.worldY, 'dark_smoke', p);

            if (pSpriteToUse instanceof Image) {
                let originalFilter = ctx.filter;
                if (p.variant === 'dark') { /* optional dark filter */ }
                else if (isShiny && pSpriteToUse === preloadedPokemonSprites[p.name]?.static_default) {
                    ctx.filter = 'brightness(1.2) saturate(1.2) hue-rotate(15deg)';
                }
                ctx.drawImage(pSpriteToUse, screenX - pSpriteSize / 2, screenY - pSpriteSize / 2, pSpriteSize, pSpriteSize);
                ctx.filter = originalFilter;
            } else {
                let charColor = pDataEntry.color || 'gray';
                if (p.variant === 'dark') { charColor = '#701010'; }
                else if (isShiny) { const shimmerValue = Math.abs(Math.sin(gameTime * 0.01)); const baseLightness = 75; const shimmerLightness = baseLightness + shimmerValue * 15; charColor = `hsl(${ (gameTime * 0.5) % 360}, 100%, ${shimmerLightness}%)`; }
                ctx.fillStyle = charColor;
                const arcRadius = pSpriteSize / 2.5;
                ctx.beginPath(); ctx.arc(screenX, screenY, arcRadius, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'black'; ctx.font = `${Math.floor(arcRadius * 1.2)}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(pDataEntry.spriteChar, screenX, screenY);
            }
        }
    }
}
function drawSingleHospital(h) { if (!h || h.worldX === -Infinity || !h.width || !h.height) return; const screenX = h.worldX - camera.x - h.width / 2; const screenY = h.worldY - camera.y - h.height / 2; if (screenX + h.width > 0 && screenX < NATIVE_WIDTH && screenY + h.height > 0 && screenY < NATIVE_HEIGHT) { if (preloadedHospitalImage && preloadedHospitalImage instanceof Image) { ctx.drawImage(preloadedHospitalImage, screenX, screenY, h.width, h.height); } else { ctx.fillStyle = 'darkred'; ctx.fillRect(screenX, screenY, h.width, h.height); ctx.strokeStyle = 'white'; ctx.lineWidth = 2; ctx.strokeRect(screenX, screenY, h.width, h.height); ctx.fillStyle = 'white'; ctx.font = `${Math.min(h.width, h.height) * 0.4}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText("H", screenX + h.width / 2, screenY + h.height / 2); } } }
function drawSingleMasterBallChest(chest) { if (!chest || chest.isOpen) return; const screenX = chest.worldX - camera.x - chest.size / 2; const screenY = chest.worldY - camera.y - chest.size / 2; if (screenX + chest.size > 0 && screenX < NATIVE_WIDTH && screenY + chest.size > 0 && screenY < NATIVE_HEIGHT) { ctx.fillStyle = 'purple'; ctx.fillRect(screenX, screenY, chest.size, chest.size); ctx.strokeStyle = 'gold'; ctx.lineWidth = 2; ctx.strokeRect(screenX, screenY, chest.size, chest.size); ctx.fillStyle = 'white'; ctx.font = `bold ${chest.size * 0.5}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(chest.spriteChar, screenX + chest.size / 2, screenY + chest.size / 2 + 1); } }
function drawSingleWorldPokeBall(ball) { if (!ball) return; const screenX = ball.worldX - camera.x; const screenY = ball.worldY - camera.y; if (screenX > -POKEBALL_SPRITE_SIZE && screenX < NATIVE_WIDTH + POKEBALL_SPRITE_SIZE && screenY > -POKEBALL_SPRITE_SIZE && screenY < NATIVE_HEIGHT + POKEBALL_SPRITE_SIZE) { ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(screenX, screenY, POKEBALL_SPRITE_SIZE / 2, 0, Math.PI, true); ctx.fill(); ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(screenX, screenY, POKEBALL_SPRITE_SIZE / 2, Math.PI, Math.PI * 2, true); ctx.fill(); ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(screenX, screenY, POKEBALL_SPRITE_SIZE / 5, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(screenX, screenY, POKEBALL_SPRITE_SIZE / 7, 0, Math.PI * 2); ctx.fill(); } }
function drawSingleFollowerPokemon(follower) {
    if (!follower || !POKEMON_DATA[follower.name] || !follower.isFollowingPlayer) return;
    const pokemonDataEntry = POKEMON_DATA[follower.name];
    let followerScreenX = follower.worldX - camera.x;
    let followerScreenY = follower.worldY - camera.y;

    let baseFollowerSize = POKEMON_SPRITE_SIZE * FOLLOWER_SPRITE_SCALE;
    let currentSpriteSize = baseFollowerSize;

    if (follower.variant === 'shiny') currentSpriteSize = baseFollowerSize * 0.8;
    else if (follower.variant === 'dark') currentSpriteSize = baseFollowerSize * 1.2;

    let spriteToUse = null;
    const pokemonName = follower.name;
    const isShiny = follower.variant === 'shiny';

    if (preloadedPokemonSprites[pokemonName]) {
        const preloaded = preloadedPokemonSprites[pokemonName];
        if (isShiny) {
            if (preloaded.animated_shiny instanceof Image) spriteToUse = preloaded.animated_shiny;
            else if (preloaded.static_shiny instanceof Image) spriteToUse = preloaded.static_shiny;
        }
        if (!(spriteToUse instanceof Image)) {
             if (preloaded.animated_default instanceof Image) spriteToUse = preloaded.animated_default;
             else if (preloaded.static_default instanceof Image) spriteToUse = preloaded.static_default;
        }
    }

    if (!(spriteToUse instanceof Image) && pokemonDataEntry.sprites) {
         const urls = pokemonDataEntry.sprites;
        let urlToLoad = null;
        let typeToLoad = null;

        if (isShiny) {
            if (urls.animated_shiny) { urlToLoad = urls.animated_shiny; typeToLoad = 'animated_shiny'; }
            else if (urls.front_shiny) { urlToLoad = urls.front_shiny; typeToLoad = 'static_shiny'; }
        }
        if (!urlToLoad) {
            if (urls.animated_default) { urlToLoad = urls.animated_default; typeToLoad = 'animated_default'; }
            else if (urls.front_default) { urlToLoad = urls.front_default; typeToLoad = 'static_default'; }
        }

        if (urlToLoad && typeToLoad && (!preloadedPokemonSprites[pokemonName] || !(preloadedPokemonSprites[pokemonName][typeToLoad] instanceof Image || preloadedPokemonSprites[pokemonName][typeToLoad] === 'failed'))) {
            getOrLoadPokemonSprite(pokemonName, typeToLoad, urlToLoad);
        }
    }

    if (GAME_STATE === 'ROAMING') {
         if (follower.variant === 'shiny' && Math.random() < 0.1) {
            createOverworldParticle(follower.worldX, follower.worldY, 'sparkle', follower);
        } else if (follower.variant === 'dark' && Math.random() < 0.15) {
            createOverworldParticle(follower.worldX, follower.worldY, 'dark_smoke', follower);
        }
    }

    if (spriteToUse instanceof Image) {
        let originalFilter = ctx.filter;
        const usingDefaultForShiny = isShiny &&
                                   (spriteToUse === preloadedPokemonSprites[pokemonName]?.animated_default ||
                                    spriteToUse === preloadedPokemonSprites[pokemonName]?.static_default);

        if (usingDefaultForShiny) {
            ctx.filter = 'brightness(1.2) saturate(1.2) hue-rotate(15deg)';
        } else {
            ctx.filter = 'none';
        }
        if (follower.variant === 'dark') { /* your dark filter */ }

        ctx.drawImage(spriteToUse, followerScreenX - currentSpriteSize / 2, followerScreenY - currentSpriteSize / 2, currentSpriteSize, currentSpriteSize);
        ctx.filter = originalFilter;
    } else {
        let charColor = pokemonDataEntry.color || 'grey';
        if (follower.variant === 'dark') { charColor = '#701010'; }
        else if (isShiny) { const shimmerValue = Math.abs(Math.sin(gameTime * 0.01)); const baseLightness = 75; const shimmerLightness = baseLightness + shimmerValue * 15; charColor = `hsl(${ (gameTime*0.5) % 360}, 100%, ${shimmerLightness}%)`; }
        ctx.fillStyle = charColor;
        const arcRadius = currentSpriteSize / 2.5;
        ctx.beginPath(); ctx.arc(followerScreenX, followerScreenY, arcRadius, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'black'; ctx.font = `${Math.floor(arcRadius * 1.2)}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(pokemonDataEntry.spriteChar, followerScreenX, followerScreenY);
    }
}
function drawSingleTree(tree) { if (!tree || !tree.image) return; const imageDrawScreenX = tree.worldX - camera.x - tree.width / 2; const imageDrawScreenY = tree.worldY - camera.y - tree.height; if (imageDrawScreenX + tree.width > 0 && imageDrawScreenX < NATIVE_WIDTH && imageDrawScreenY + tree.height > 0 && imageDrawScreenY < NATIVE_HEIGHT) { ctx.drawImage(tree.image, imageDrawScreenX, imageDrawScreenY, tree.width, tree.height); } }
function drawMinimap() { if (GAME_STATE !== 'ROAMING' && GAME_STATE !== 'MENU_OPEN' && GAME_STATE !== 'IN_PLAYER_HOUSE' && GAME_STATE !== 'HOSPITAL_INTERIOR') return; const xpBarHeight = 30; minimapX = MINIMAP_MARGIN + MINIMAP_SIZE_PX / 2; minimapY = NATIVE_HEIGHT - MINIMAP_MARGIN - MINIMAP_SIZE_PX / 2 - (xpBarHeight * 2 + 20); ctx.save(); ctx.beginPath(); ctx.arc(minimapX, minimapY, MINIMAP_SIZE_PX / 2, 0, Math.PI * 2); ctx.fillStyle = 'rgba(100,100,100,0.65)'; ctx.fill(); ctx.clip(); const minimapScale = (MINIMAP_SIZE_PX) / (MINIMAP_RADIUS_WORLD_UNITS * 2); if (playerHouse && playerHouse.worldX !== undefined) { const houseIconSize = 12 * currentCanvasScale; const houseIconSizeOnEdge = 10 * currentCanvasScale; const houseIconColor = 'skyblue'; const houseRoofColor = 'blue'; const houseIconEdgeColor = 'skyblue'; const houseIconEdgeRoofColor = 'blue'; const dxHouse = playerHouse.worldX - player.worldX; const dyHouse = playerHouse.worldY - player.worldY; const distToHouseSq = dxHouse * dxHouse + dyHouse * dyHouse; if (distToHouseSq < (MINIMAP_RADIUS_WORLD_UNITS * MINIMAP_RADIUS_WORLD_UNITS)) { const houseMapX = minimapX + dxHouse * minimapScale; const houseMapY = minimapY + dyHouse * minimapScale; drawMinimapHouseIcon(ctx, houseMapX, houseMapY, houseIconSize, houseIconColor, houseRoofColor); } else { const angleToHouse = Math.atan2(dyHouse, dxHouse); const edgeRadius = (MINIMAP_SIZE_PX / 2) - (houseIconSizeOnEdge / 2) - 2; const iconEdgeX = minimapX + Math.cos(angleToHouse) * edgeRadius; const iconEdgeY = minimapY + Math.sin(angleToHouse) * edgeRadius; drawMinimapHouseIcon(ctx, iconEdgeX, iconEdgeY, houseIconSizeOnEdge, houseIconEdgeColor, houseIconEdgeRoofColor); } } [...NPCS, ...discoveredHospitals.filter(h => h.worldX !== -Infinity)].forEach(entity => { const dx = entity.worldX - player.worldX; const dy = entity.worldY - player.worldY; if (Math.sqrt(dx * dx + dy * dy) < MINIMAP_RADIUS_WORLD_UNITS) { const mapX = minimapX + dx * minimapScale; const mapY = minimapY + dy * minimapScale; let color = 'grey'; let size = 2; let char = ''; if (NPCS.includes(entity) && !entity.isAwaitingRespawn) { color = entity.color || 'blue'; size = 4.5; } else if (discoveredHospitals.includes(entity)) { color = 'red'; size = 5.5; char = 'H'; } if (!NPCS.includes(entity) || (NPCS.includes(entity) && !entity.isAwaitingRespawn)) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(mapX, mapY, size * currentCanvasScale, 0, Math.PI * 2); ctx.fill(); if (char) { ctx.fillStyle = 'white'; ctx.font = `bold ${Math.floor(size * 1.8)}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(char, mapX, mapY + 0.5); } } } }); masterBallChests.forEach(chest => { if (!chest.isOpen) { const dx = chest.worldX - player.worldX; const dy = chest.worldY - player.worldY; if (Math.sqrt(dx * dx + dy * dy) < MINIMAP_RADIUS_WORLD_UNITS) { const mapX = minimapX + dx * minimapScale; const mapY = minimapY + dy * minimapScale; ctx.fillStyle = 'purple'; ctx.beginPath(); ctx.arc(mapX, mapY, 5 * currentCanvasScale, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'white'; ctx.font = `bold ${5 * currentCanvasScale}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(chest.spriteChar || "M", mapX, mapY + 0.5); } } }); const playerAngle = player.isMoving ? Math.atan2(player.targetY - player.screenY, player.targetX - player.screenX) : (player.lastAngle || -Math.PI / 2); if (player.isMoving || GAME_STATE === 'IN_PLAYER_HOUSE') player.lastAngle = playerAngle; ctx.translate(minimapX, minimapY); ctx.rotate(playerAngle + Math.PI / 2); ctx.fillStyle = 'lime'; ctx.beginPath(); const playerArrowSize = 9 * currentCanvasScale; ctx.moveTo(0, -playerArrowSize); ctx.lineTo(-playerArrowSize * 0.7, playerArrowSize * 0.7); ctx.lineTo(playerArrowSize * 0.7, playerArrowSize * 0.7); ctx.closePath(); ctx.fill(); ctx.restore(); ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(minimapX, minimapY, MINIMAP_SIZE_PX / 2, 0, Math.PI * 2); ctx.stroke(); }
function drawDistanceTracker() { if (GAME_STATE !== 'ROAMING' && GAME_STATE !== 'MENU_OPEN' && GAME_STATE !== 'IN_PLAYER_HOUSE' && GAME_STATE !== 'HOSPITAL_INTERIOR') return; const distFromOrigin = player.originWorldX === 0 && player.originWorldY === 0 && GAME_STATE === 'IN_PLAYER_HOUSE' ? 0 : Math.sqrt((player.worldX - player.originWorldX)**2 + (player.worldY - player.originWorldY)**2); const distInMeters = Math.floor(distFromOrigin / DISTANCE_UNIT_PER_METER); ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.font = '11px Courier New'; const text = `Distance: ${distInMeters}m`; const textMetrics = ctx.measureText(text); const textWidth = textMetrics.width + 10; const textHeight = 18; const textX = minimapX - MINIMAP_SIZE_PX / 2; const textY = minimapY - MINIMAP_SIZE_PX / 2 - textHeight - 5; ctx.fillRect(textX - 5, textY - 12, textWidth, textHeight); ctx.fillStyle = 'white'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, textX, textY - 2); }
function drawActiveTasksUI() {
    if (player.activeTasks.length === 0) return;

    const lineHeight = 11;
    const padding = 6;
    const targetWidth = NATIVE_WIDTH * 0.28;

    let allTaskTextLines = [];
    ctx.font = '10px Courier New';

    player.activeTasks.forEach((task, index) => {
        allTaskTextLines.push(`Task (${task.npcName}):`);
        const objective = task.taskDetails ? task.taskDetails.objective : "Retrieve task details...";
        const objectiveLines = wrapText(`- ${objective}`, targetWidth - padding * 2);
        objectiveLines.forEach(line => allTaskTextLines.push(line));

        if (task.taskDetails) {
            let progressDisplay = "";
            switch (task.taskDetails.type) {
                case "DEFEAT_ANY":
                case "DEFEAT_SPECIFIC":
                case "LEVEL_UP_EVENTS":
                case "CAPTURE_POKEMON":
                    progressDisplay = `- Progress: ${task.progress || 0}/${task.taskDetails.targetCount}`;
                    break;
                case "PLAY_TIME":
                    const timeElapsedMs = player.totalPlayTimeMs - (task.startTimeMs || player.totalPlayTimeMs);
                    const durationMs = task.taskDetails.durationMs;
                    const percentComplete = Math.min(100, (timeElapsedMs / durationMs) * 100);
                    progressDisplay = `- Time: ${Math.floor(percentComplete)}% complete`;
                    break;
            }
            if (progressDisplay) allTaskTextLines.push(progressDisplay);
        }
        if (index < player.activeTasks.length - 1) {
            allTaskTextLines.push(" ");
        }
    });
    taskListContentHeight = allTaskTextLines.length * lineHeight;

    taskListBoxRect.w = targetWidth;
    taskListBoxRect.h = Math.min(taskListContentHeight + padding * 2, taskListMaxHeight);

    taskListBoxRect.x = 15;
    taskListBoxRect.y = (NATIVE_HEIGHT / 2) - (taskListBoxRect.h / 2);

    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(taskListBoxRect.x, taskListBoxRect.y, taskListBoxRect.w, taskListBoxRect.h);

    ctx.save();
    ctx.beginPath();
    ctx.rect(taskListBoxRect.x, taskListBoxRect.y, taskListBoxRect.w, taskListBoxRect.h);
    ctx.clip();

    ctx.fillStyle = 'white';
    let currentY = taskListBoxRect.y + padding + lineHeight * 0.8 - taskListScrollOffset;
    allTaskTextLines.forEach(line => {
        if (currentY > taskListBoxRect.y - lineHeight && currentY < taskListBoxRect.y + taskListBoxRect.h + lineHeight) {
            ctx.textAlign = 'left';
            ctx.fillText(line, taskListBoxRect.x + padding, currentY);
        }
        currentY += lineHeight;
    });
    ctx.restore();

    if (taskListContentHeight > taskListBoxRect.h) {
        ctx.fillStyle = 'rgba(200,200,200,0.7)';
        const arrowSize = 5;
        const arrowPadding = 5;

        if (taskListScrollOffset > 0) {
            ctx.beginPath();
            ctx.moveTo(taskListBoxRect.x + taskListBoxRect.w / 2, taskListBoxRect.y + arrowPadding);
            ctx.lineTo(taskListBoxRect.x + taskListBoxRect.w / 2 - arrowSize, taskListBoxRect.y + arrowPadding + arrowSize * 1.5);
            ctx.lineTo(taskListBoxRect.x + taskListBoxRect.w / 2 + arrowSize, taskListBoxRect.y + arrowPadding + arrowSize * 1.5);
            ctx.closePath();
            ctx.fill();
        }

        if (taskListScrollOffset < taskListContentHeight - (taskListBoxRect.h - padding * 2)) {
            ctx.beginPath();
            ctx.moveTo(taskListBoxRect.x + taskListBoxRect.w / 2, taskListBoxRect.y + taskListBoxRect.h - arrowPadding);
            ctx.lineTo(taskListBoxRect.x + taskListBoxRect.w / 2 - arrowSize, taskListBoxRect.y + taskListBoxRect.h - arrowPadding - arrowSize * 1.5);
            ctx.lineTo(taskListBoxRect.x + taskListBoxRect.w / 2 + arrowSize, taskListBoxRect.y + taskListBoxRect.h - arrowPadding - arrowSize * 1.5);
            ctx.closePath();
            ctx.fill();
        }
    }
}
function drawMinimapHouseIcon(ctx, x, y, size, color = 'sienna', roofColor = 'darkred') { ctx.save(); ctx.translate(x, y); ctx.fillStyle = color; const bodyHeight = size * 0.6; const bodyWidth = size; ctx.fillRect(-bodyWidth / 2, -bodyHeight / 2, bodyWidth, bodyHeight); ctx.fillStyle = roofColor; ctx.beginPath(); ctx.moveTo(0, -bodyHeight / 2 - size * 0.4); ctx.lineTo(bodyWidth / 2 + size * 0.1, -bodyHeight / 2); ctx.lineTo(-bodyWidth / 2 - size * 0.1, -bodyHeight / 2); ctx.closePath(); ctx.fill(); ctx.restore(); }
function drawMasterBallChests() { masterBallChests.forEach(chest => { if (chest.isOpen) return; const screenX = chest.worldX - camera.x - chest.size / 2; const screenY = chest.worldY - camera.y - chest.size / 2; if (screenX + chest.size > 0 && screenX < NATIVE_WIDTH && screenY + chest.size > 0 && screenY < NATIVE_HEIGHT) { ctx.fillStyle = 'purple'; ctx.fillRect(screenX, screenY, chest.size, chest.size); ctx.strokeStyle = 'gold'; ctx.lineWidth = 2; ctx.strokeRect(screenX, screenY, chest.size, chest.size); ctx.fillStyle = 'white'; ctx.font = `bold ${chest.size * 0.5}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(chest.spriteChar, screenX + chest.size / 2, screenY + chest.size / 2 + 1); } }); }
function drawWorldPokeBalls() { worldPokeBalls.forEach(ball => { const screenX = ball.worldX - camera.x; const screenY = ball.worldY - camera.y; if (screenX > -POKEBALL_SPRITE_SIZE && screenX < NATIVE_WIDTH + POKEBALL_SPRITE_SIZE && screenY > -POKEBALL_SPRITE_SIZE && screenY < NATIVE_HEIGHT + POKEBALL_SPRITE_SIZE) { ctx.fillStyle = 'red'; ctx.beginPath(); ctx.arc(screenX, screenY, POKEBALL_SPRITE_SIZE / 2, 0, Math.PI, true); ctx.fill(); ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(screenX, screenY, POKEBALL_SPRITE_SIZE / 2, Math.PI, Math.PI * 2, true); ctx.fill(); ctx.fillStyle = 'black'; ctx.beginPath(); ctx.arc(screenX, screenY, POKEBALL_SPRITE_SIZE / 5, 0, Math.PI * 2); ctx.lineWidth = 1; ctx.stroke(); ctx.fillStyle = 'white'; ctx.beginPath(); ctx.arc(screenX, screenY, POKEBALL_SPRITE_SIZE / 7, 0, Math.PI * 2); ctx.fill(); } }); }