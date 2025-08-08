// --- UTILITY FUNCTIONS ---
function seededRandom(seed) { let x = Math.sin(seed) * 10000; return x - Math.floor(x); }
function interpolate(a, b, t) { return a * (1 - t) + b * t; }
function simpleNoise(x, y, currentSeed) { const ix = Math.floor(x); const iy = Math.floor(y); const fx = x - ix; const fy = y - iy; const s_seed = ix + iy * 5700 + currentSeed; const t_seed = (ix + 1) + iy * 5700 + currentSeed; const u_seed = ix + (iy + 1) * 5700 + currentSeed; const v_seed = (ix + 1) + (iy + 1) * 5700 + currentSeed; const s = seededRandom(s_seed); const t = seededRandom(t_seed); const u = seededRandom(u_seed); const v = seededRandom(v_seed); const i1 = interpolate(s, t, fx * fx * (3 - 2 * fx)); const i2 = interpolate(u, v, fx * fx * (3 - 2 * fx)); return interpolate(i1, i2, fy * fy * (3 - 2 * fy)); }
function fbm_noise(x, y, currentSeed, octaves = 3, persistence = 0.4, lacunarity = 2.2) { let total = 0; let frequency = 1; let amplitude = 1; let maxValue = 0; for (let i = 0; i < octaves; i++) { total += simpleNoise(x * frequency, y * frequency, currentSeed + i * 100) * amplitude; maxValue += amplitude; amplitude *= persistence; frequency *= lacunarity; } return total / maxValue; }
function getMoveByName(name) { const moveNameLower = name.toLowerCase(); const foundMove = ALL_MOVES.find(m => m.name.toLowerCase() === moveNameLower); return foundMove || { name: "Struggle", power: 50, type: "Normal" }; }
function calculateTypeEffectiveness(moveType, defenderPokemonTypes) { if (!TYPE_EFFECTIVENESS_DATA || Object.keys(TYPE_EFFECTIVENESS_DATA).length === 0) { console.warn("TYPE_EFFECTIVENESS_DATA not available for damage calculation."); return 1; } const moveTypeLower = moveType.toLowerCase(); const damageRelations = TYPE_EFFECTIVENESS_DATA[moveTypeLower]; if (!damageRelations) { console.warn(`No damage relations found for move type: ${moveTypeLower}`); return 1; } let overallMultiplier = 1; defenderPokemonTypes.forEach(defenderType => { const defenderTypeLower = defenderType.toLowerCase(); let currentEffectiveness = 1; if (damageRelations.double_damage_to.some(t => t.name === defenderTypeLower)) { currentEffectiveness = 2; } else if (damageRelations.half_damage_to.some(t => t.name === defenderTypeLower)) { currentEffectiveness = 0.5; } else if (damageRelations.no_damage_to.some(t => t.name === defenderTypeLower)) { currentEffectiveness = 0; } overallMultiplier *= currentEffectiveness; }); return overallMultiplier; }
function getStatWithStage(baseStat, stage) { if (stage === 0) return baseStat; let multiplier; if (stage > 0) { multiplier = (2 + stage) / 2; } else { multiplier = 2 / (2 - stage); } return Math.floor(baseStat * multiplier); }
function checkAABBCollision(obj1, obj2) { const obj1Left = obj1.x - obj1.width / 2; const obj1Right = obj1.x + obj1.width / 2; const obj1Top = obj1.y - obj1.height / 2; const obj1Bottom = obj1.y + obj1.height / 2; const obj2Left = obj2.x - obj2.width / 2; const obj2Right = obj2.x + obj2.width / 2; const obj2Top = obj2.y - obj2.height / 2; const obj2Bottom = obj2.y + obj2.height / 2; return obj1Left < obj2Right && obj1Right > obj2Left && obj1Top < obj2Bottom && obj1Bottom > obj2Top; }
function isPointInRect(px, py, rect) { if (!rect) return false; return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h; }
function distanceSq(x1, y1, x2, y2) { return (x1 - x2)**2 + (y1 - y2)**2; }
function wrapText(text, maxWidth) { const words = text.split(' '); let lines = []; if (words.length === 0) return [""]; let currentLine = words[0]; for (let i = 1; i < words.length; i++) { const word = words[i]; const width = ctx.measureText(currentLine + " " + word).width; if (width < maxWidth) { currentLine += " " + word; } else { lines.push(currentLine); currentLine = word; } } lines.push(currentLine); return lines; }
function getRandomLevel(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function getEventCoordinates(e, canvasEl = canvas) { const rect = canvasEl.getBoundingClientRect(); const scaleFactorX = canvasEl.width / rect.width; const scaleFactorY = canvasEl.height / rect.height; let clientX, clientY; if (e.touches && e.touches.length > 0) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } else if (e.changedTouches && e.changedTouches.length > 0) { clientX = e.changedTouches[0].clientX; clientY = e.changedTouches[0].clientY; } else { clientX = e.clientX; clientY = e.clientY; } return { x: (clientX - rect.left) * scaleFactorX, y: (clientY - rect.top) * scaleFactorY }; }
async function screenFlash() { flashOverlay.style.opacity = '0.7'; await new Promise(resolve => setTimeout(resolve, 100)); flashOverlay.style.opacity = '0'; await new Promise(resolve => setTimeout(resolve, 100)); flashOverlay.style.opacity = '0.7'; await new Promise(resolve => setTimeout(resolve, 100)); flashOverlay.style.opacity = '0';}
function isMobileDevice() { return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }

// --- FUNCTION TO DRAW OTHER PLAYERS ---
function drawOtherPlayer(playerData) {
    if (!playerData || !playerData.id || playerData.id === myPlayerId) { 
        // console.log("DRAW_OTHER: Not drawing self or incomplete data. ID:", playerData ? playerData.id : "N/A_ID");
        return;
    }
    // console.log(`DRAW_OTHER: Attempting to draw ${playerData.id} (${playerData.playerName || 'NoName'}) at wX:${playerData.worldX}, wY:${playerData.worldY}, action: ${playerData.action}, animFrame: ${playerData.animationFrame}`);

    const screenX = playerData.worldX - camera.x;
    const screenY = playerData.worldY - camera.y;

    if (screenX < -PLAYER_SIZE * 2 || screenX > NATIVE_WIDTH + PLAYER_SIZE * 2 ||
        screenY < -PLAYER_SIZE * 2 || screenY > NATIVE_HEIGHT + PLAYER_SIZE * 2) {
        // console.log(`DRAW_OTHER: Culling ${playerData.id} - Off-screen. Screen(${screenX.toFixed(0)}, ${screenY.toFixed(0)})`);
        return;
    }

    ctx.fillStyle = 'lime'; 
    ctx.beginPath();
    ctx.arc(screenX, screenY, PLAYER_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'black'; 
    ctx.font = `${PLAYER_SIZE * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const isOtherPlayerMoving = playerData.action === 'moving';
    const animFrame = playerData.animationFrame || 0; 
    const animChar = isOtherPlayerMoving ? (Math.floor(animFrame) % 2 === 0 ? "o" : "O") : "P";
    ctx.fillText(animChar, screenX, screenY);

    // --- MODIFICATION START: Display player name ---
    const nameToDisplay = playerData.playerName || playerData.id.substring(0, 6); // Fallback to part of ID
    ctx.fillStyle = 'white';
    ctx.font = '12px Courier New'; // Slightly larger font for name
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom'; // Position name above the player
    // Add a black stroke for better readability
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2; // Stroke thickness
    ctx.strokeText(nameToDisplay, screenX, screenY - PLAYER_SIZE / 2 - 5); // Adjust Y offset as needed
    ctx.fillText(nameToDisplay, screenX, screenY - PLAYER_SIZE / 2 - 5); // Adjust Y offset as needed
    // --- MODIFICATION END ---
}

// --- PLAYER OBJECT METHODS (moved here for better organization) ---
player.initTeam = function() {
    this.team.push(createPokemon("Pikachu", 5));
    if (this.team.length > 0) {
        const follower = this.team[0];
        if (follower) {
            follower.isFollowingPlayer = true;
            follower.worldX = this.worldX - TILE_SIZE;
            follower.worldY = this.worldY;
            follower.followerTargetX = follower.worldX;
            follower.followerTargetY = follower.worldY;
            follower.followerPath = [{ x: this.worldX, y: this.worldY }];
            follower.followerSpeed = this.speed * 0.996;
            follower.followerPathIndex = 0;
        }
    }
    updateTeamPokemonStatusBars();
};
player.addXp = function(amount) { this.xp += amount; showGeneralMessage(`Player gained ${Math.floor(amount)} XP!`); while (this.xp >= this.maxXp) { this.xp -= this.maxXp; this.level++; this.maxXp = Math.floor(this.maxXp * 1.5); this.speed += 5; this.updateEffectiveSpeed(); showGeneralMessage(`Player reached Level ${this.level}!`); } updatePlayerXpBar(); };
player.updateEffectiveSpeed = function() {
    let currentSpeed = this.levelBasedSpeed || 150;
    if (this.hasShinySpeedBoost) { currentSpeed *= 1.15; }
    this.speed = Math.floor(currentSpeed);
};
player.draw = function() {
    ctx.fillStyle = 'darkblue'; ctx.beginPath(); ctx.arc(this.screenX, this.screenY, PLAYER_SIZE / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'white'; ctx.font = `${PLAYER_SIZE * 0.6}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const animChar = this.isMoving ? (Math.floor(this.animationFrame) % 2 === 0 ? "o" : "O") : "P";
    ctx.fillText(animChar, this.screenX, this.screenY);

    // --- MODIFICATION START: Display local player's name ---
    if (this.playerName) {
        ctx.fillStyle = 'white';
        ctx.font = '12px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.strokeText(this.playerName, this.screenX, this.screenY - PLAYER_SIZE / 2 - 5);
        ctx.fillText(this.playerName, this.screenX, this.screenY - PLAYER_SIZE / 2 - 5);
    }
    // --- MODIFICATION END ---


    if (GAME_STATE === 'IN_PLAYER_HOUSE' && this.team.length > 0) {
        const followerInHouse = this.team.find(p => p.currentHp > 0 && p.isFollowingPlayer);
        if (followerInHouse && POKEMON_DATA[followerInHouse.name]) {
            const pokemonDataEntry = POKEMON_DATA[followerInHouse.name];
            const pikaScreenX = this.screenX - TILE_SIZE * 0.8; 
            const pikaScreenY = this.screenY + TILE_SIZE * 0.8; 
            
            let baseFollowerSize = POKEMON_SPRITE_SIZE * FOLLOWER_SPRITE_SCALE; 
            let currentSpriteSize = baseFollowerSize;
            if (followerInHouse.variant === 'shiny') currentSpriteSize *= 0.8;
            else if (followerInHouse.variant === 'dark') currentSpriteSize *= 1.2;

            let spriteToUse = null;
            const pokemonName = followerInHouse.name;
            const isShiny = followerInHouse.variant === 'shiny';

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
                if (followerInHouse.variant === 'dark') { /* your dark filter */ }
                
                ctx.drawImage(spriteToUse, pikaScreenX - currentSpriteSize / 2, pikaScreenY - currentSpriteSize / 2, currentSpriteSize, currentSpriteSize);
                ctx.filter = originalFilter;
            } else { 
                let charColor = pokemonDataEntry.color || 'grey';
                if (followerInHouse.variant === 'dark') { charColor = '#701010'; }
                else if (isShiny) { const shimmerValue = Math.abs(Math.sin(gameTime * 0.01)); const baseLightness = 75; const shimmerLightness = baseLightness + shimmerValue * 15; charColor = `hsl(${ (gameTime * 0.5) % 360}, 100%, ${shimmerLightness}%)`; }
                ctx.fillStyle = charColor;
                const arcRadius = currentSpriteSize / 2.5;
                ctx.beginPath(); ctx.arc(pikaScreenX, pikaScreenY, arcRadius, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = 'black'; ctx.font = `${Math.floor(arcRadius * 1.2)}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(pokemonDataEntry.spriteChar, pikaScreenX, pikaScreenY);
            }
        }
    }
};