// --- WEBSOCKET COMMUNICATION ---
function connectToServer() {
    // Using port 8081 as per your server log
    const socketURL = `ws://${window.location.hostname}:8081`;

    socket = new WebSocket(socketURL);

    socket.onopen = function(event) {
        console.log("WebSocket connection established.");
        showGeneralMessage("Connected to server!", 2000);
    };

    socket.onmessage = function(event) {
        try {
            const message = JSON.parse(event.data);
            // console.log("RAW Message from server:", event.data);

            switch (message.type) {
                case 'assign_id':
                    myPlayerId = message.id;
                    player.playerName = message.playerName || "Player";
                    // Prioritize server-sent worldSeed.
                    if (typeof message.worldSeed === 'string' && message.worldSeed.length > 0) {
                        worldSeed = parseInt(message.worldSeed, 10); // Parse back to number
                    } else if (typeof message.worldSeed === 'number') { // Keep current good path
                        worldSeed = message.worldSeed;
                    } else {
                        // This should ideally not happen if the server is correctly sending the seed.
                        console.error("CRITICAL: Server did not provide a worldSeed! Each client will have a different world. Multiplayer will be broken.");
                        worldSeed = Date.now(); // Fallback, but indicates a problem.
                    }
                    console.log(`CLIENT: Assigned Player ID: ${myPlayerId}, Name: ${player.playerName}, World Seed: ${worldSeed}`);
                    break;
                case 'world_state': 
                    console.log("CLIENT: Received 'world_state'. Player count:", message.players ? message.players.length : 0);
                    const initialOtherPlayers = {};
                    if (message.players && Array.isArray(message.players)) {
                        message.players.forEach(pData => {
                            if (pData.id !== myPlayerId) {
                                initialOtherPlayers[pData.id] = pData; 
                                console.log(`CLIENT (world_state): Added other player ${pData.id} (${pData.playerName || 'NoName'})`);
                            }
                        });
                    }
                    otherPlayers = initialOtherPlayers;
                    // console.log("CLIENT: otherPlayers initialized from world_state:", JSON.stringify(otherPlayers)); // Can be spammy
                    break;
                case 'player_joined': 
                    console.log("CLIENT: Received 'player_joined'. Player data:", JSON.stringify(message.player));
                    if (message.player && message.player.id && message.player.id !== myPlayerId) {
                        otherPlayers[message.player.id] = message.player; 
                        console.log(`CLIENT: Player ${message.player.id} (${message.player.playerName || 'NoName'}) joined. otherPlayers count: ${Object.keys(otherPlayers).length}`);
                    }
                    break;
                case 'player_left': 
                    console.log("CLIENT: Received 'player_left'. ID:", message.id, "Name:", message.playerName);
                    if (message.id && message.id !== myPlayerId) {
                        const leftPlayerName = otherPlayers[message.id]?.playerName || message.playerName || "Unknown";
                        delete otherPlayers[message.id];
                        console.log(`CLIENT: Player ${message.id} (${leftPlayerName}) left. otherPlayers count: ${Object.keys(otherPlayers).length}`);
                    }
                    break;
                case 'player_updated': 
                    // --- MODIFICATION: Focused log for playerName ---
                    if (message.player && message.player.id && message.player.id !== myPlayerId) {
                        if (typeof message.player.playerName === 'undefined') {
                            console.warn(`CLIENT (player_updated): PlayerName is UNDEFINED for player ${message.player.id}. Full data:`, JSON.stringify(message.player));
                        } else {
                            // This log can be spammy, enable if needed to see all updates
                            // console.log(`CLIENT (player_updated): Updating otherPlayer ${message.player.id} (${message.player.playerName}). Pos:(${message.player.worldX},${message.player.worldY}) Action:${message.player.action}`);
                        }
                        otherPlayers[message.player.id] = message.player; 
                    }
                    // --- END MODIFICATION ---
                    break;
                case 'game_update': 
                    console.warn("CLIENT: Received 'game_update' message (DEPRECATED PATH for other player updates):", JSON.stringify(message));
                    // This path should ideally not be taken if server sends 'player_updated'
                    let targetId = message.playerId || message.id;
                    if (targetId && targetId !== myPlayerId) {
                        otherPlayers[targetId] = {
                            id: targetId,
                            playerName: message.playerName || `Player_${targetId.substring(0,4)}`, 
                            worldX: message.worldX,
                            worldY: message.worldY,
                            level: message.level,
                            action: message.action,
                            isMoving: message.action === 'moving', 
                            animationFrame: message.animationFrame || 0, 
                        };
                        console.log(`CLIENT: Processed 'game_update' for ${targetId} into otherPlayers.`);
                    }
                    break;
                default:
                    console.log("CLIENT: Received unhandled message type from server:", message.type, JSON.stringify(message)); 
            }
        } catch (error) {
            console.error("CLIENT: Error processing message from server:", error, "Raw data:", event.data);
        }
    };

    socket.onclose = function(event) {
        console.log("WebSocket connection closed.", event);
        showGeneralMessage("Disconnected from server.", 3000);
        myPlayerId = null;
        otherPlayers = {};
    };

    socket.onerror = function(error) {
        console.error("WebSocket error:", error);
        showGeneralMessage("Connection error.", 3000);
    };
}

function sendPlayerUpdate() {
    if (socket && socket.readyState === WebSocket.OPEN && myPlayerId) {
        const playerData = {
            type: 'game_update', 
            worldX: Math.round(player.worldX),
            worldY: Math.round(player.worldY),
            level: player.level,
            action: player.isMoving ? 'moving' : 'idle',
            animationFrame: player.animationFrame,
        };
        socket.send(JSON.stringify(playerData));
    }
}


// --- DATA INITIALIZATION HELPERS ---
// ... (getManualLearnsets, getManualEvolutions, transformAndPopulateGamePokemonData remain unchanged from your last provided version)
function getManualLearnsets() { let learnsets = {}; POKEMON_NAMES.forEach(name => { learnsets[name] = [{level: 1, moveName: "Tackle"}, {level: 5, moveName: "Growl"}]; }); learnsets["Pikachu"] = [ {level: 1, moveName: "Thunder Shock"}, {level: 1, moveName: "Growl"}, {level: 6, moveName: "Tail Whip"}, {level: 8, moveName: "Quick Attack"}, {level: 15, moveName: "Thunderbolt"} ]; learnsets["Raichu"] = [ {level: 1, moveName: "Thunder Shock"}, {level: 1, moveName: "Growl"}, {level: 1, moveName: "Tail Whip"}, {level: 1, moveName: "Quick Attack"}, {level: 1, moveName: "Thunderbolt"}, {level: 35, moveName: "Hyper Beam"} ]; learnsets["Pidgey"] = [ {level: 1, moveName: "Tackle"}, {level: 5, moveName: "Gust"}, {level: 12, moveName: "Quick Attack"}, {level: 19, moveName: "Wing Attack"} ]; learnsets["Pidgeotto"] = [ {level: 1, moveName: "Gust"}, {level: 1, moveName: "Quick Attack"}, {level: 21, moveName: "Wing Attack"}, {level: 31, moveName: "Agility"} ]; learnsets["Pidgeot"] = [ {level: 1, moveName: "Gust"}, {level: 1, moveName: "Quick Attack"}, {level: 1, moveName: "Wing Attack"}, {level: 38, moveName: "Agility"}, {level: 40, moveName: "Hyper Beam"} ]; learnsets["Charmander"] = [ {level: 1, moveName: "Scratch"}, {level: 1, moveName: "Growl"}, {level: 7, moveName: "Ember"}, {level: 13, moveName: "Smokescreen"}, {level: 19, moveName: "Flamethrower"}]; learnsets["Charmeleon"] = [ {level: 1, moveName: "Scratch"}, {level: 1, moveName: "Growl"}, {level: 1, moveName: "Ember"}, {level: 20, moveName: "Flamethrower"}, {level: 28, moveName: "Fire Punch"} ]; learnsets["Charizard"] = [ {level: 1, moveName: "Scratch"}, {level: 1, moveName: "Growl"}, {level: 1, moveName: "Ember"}, {level: 1, moveName: "Flamethrower"}, {level: 1, moveName: "Wing Attack"}, {level: 45, moveName: "Hyper Beam"} ]; learnsets["Squirtle"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Tail Whip"}, {level: 8, moveName: "Bubble"}, {level: 15, moveName: "Water Gun"}, {level: 22, moveName: "Bite"}]; learnsets["Wartortle"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Tail Whip"}, {level: 1, moveName: "Bubble"}, {level: 15, moveName: "Water Gun"}, {level: 24, moveName: "Bite"}, {level: 31, moveName: "Hydro Pump"}]; learnsets["Blastoise"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Tail Whip"}, {level: 1, moveName: "Bubble"}, {level: 1, moveName: "Water Gun"}, {level: 1, moveName: "Bite"}, {level: 42, moveName: "Hydro Pump"}, {level: 50, moveName: "Hyper Beam"}]; learnsets["Bulbasaur"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Growl"}, {level: 7, moveName: "Vine Whip"}, {level: 13, moveName: "Razor Leaf"} ]; learnsets["Ivysaur"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Growl"}, {level: 1, moveName: "Vine Whip"}, {level: 20, moveName: "Razor Leaf"}, {level: 30, moveName: "Solar Beam"} ]; learnsets["Venusaur"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Growl"}, {level: 1, moveName: "Vine Whip"}, {level: 1, moveName: "Razor Leaf"}, {level: 40, moveName: "Solar Beam"}, {level: 50, moveName: "Hyper Beam"} ]; learnsets["Magikarp"] = [{level: 1, moveName: "Splash"}]; learnsets["Gyarados"] = [{level: 1, moveName: "Bite"}, {level: 20, moveName: "Hydro Pump"}, {level: 30, moveName: "Hyper Beam"}]; learnsets["Mewtwo"] = [{level: 1, moveName: "Psychic"}, {level: 70, moveName: "Hyper Beam"}]; return learnsets; }
function getManualEvolutions() { let evolutions = {}; evolutions["Pikachu"] = { evolvesTo: "Raichu", evolutionLevel: 30 }; evolutions["Pidgey"] = { evolvesTo: "Pidgeotto", evolutionLevel: 18 }; evolutions["Pidgeotto"] = { evolvesTo: "Pidgeot", evolutionLevel: 36 }; evolutions["Charmander"] = { evolvesTo: "Charmeleon", evolutionLevel: 16 }; evolutions["Charmeleon"] = { evolvesTo: "Charizard", evolutionLevel: 36 }; evolutions["Squirtle"] = { evolvesTo: "Wartortle", evolutionLevel: 16 }; evolutions["Wartortle"] = { evolvesTo: "Blastoise", evolutionLevel: 36 }; evolutions["Bulbasaur"] = { evolvesTo: "Ivysaur", evolutionLevel: 16 }; evolutions["Ivysaur"] = { evolvesTo: "Venusaur", evolutionLevel: 32 }; evolutions["Magikarp"] = { evolvesTo: "Gyarados", evolutionLevel: 20 }; return evolutions; }

async function transformAndPopulateGamePokemonData(pokedexApiData) {
    console.log("Transforming API data into game format...");
    const { pokemonDetails, typeDamageRelations } = pokedexApiData; 
    const manualLearnsets = getManualLearnsets();
    const manualEvolutions = getManualEvolutions();

    for (const detail of pokemonDetails) {
        if (!detail) {
            console.error("Encountered null or undefined detail in pokemonDetails. Skipping.");
            continue;
        }
        const detailIdForLog = detail.id !== undefined ? detail.id : 'N/A_ID';
        const detailApiNameForLog = detail.name !== undefined ? detail.name : 'N/A_APINAME'; 
        // console.log(`Processing detail for ID: ${detailIdForLog}, API Name: ${detailApiNameForLog}`); 

        if (!detail.pokemonAPIData) {
            console.error(`CRITICAL: pokemonAPIData is missing for ID: ${detailIdForLog}, Name: ${detailApiNameForLog}. Skipping entry.`);
            // console.log("Full detail object that caused error:", JSON.stringify(detail)); 
            continue; 
        }
        
        const apiName = detail.name; 
        const gameName = POKEMON_NAMES[detail.id - 1]; 
        if (!gameName) {
            console.warn(`Could not map API ID ${detail.id} (${apiName}) to a game name. Skipping.`);
            continue;
        }

        const pkmn = detail.pokemonAPIData; 
        const species = detail.speciesAPIData;

        if (!pkmn) { 
            console.error(`pkmn (detail.pokemonAPIData) is undefined for ${gameName} (ID: ${detail.id}). Skipping.`);
            continue;
        }
 
        // console.log(`Attempting to access pkmn.stats for ${gameName} (ID: ${detail.id}).`); 
        if (!pkmn.stats || typeof pkmn.stats.forEach !== 'function') { 
            console.error(`pkmn.stats is undefined or not an array for ${gameName} (ID: ${detail.id}). Value of pkmn.stats:`, pkmn.stats);
            // console.error("Full pkmn object causing error:", JSON.parse(JSON.stringify(pkmn))); 
            continue; 
        }

        let baseHp = 0, baseAtk = 0, baseDef = 0, baseSpAtk = 0, baseSpDef = 0, baseSpeed = 0;
        
        pkmn.stats.forEach(s => { 
            if (!s || !s.stat) { 
                console.error(`Malformed stat entry for ${gameName}:`, s);
                return; 
            }
            switch (s.stat.name) {
                case 'hp': baseHp = s.base_stat; break;
                case 'attack': baseAtk = s.base_stat; break;
                case 'defense': baseDef = s.base_stat; break;
                case 'special-attack': baseSpAtk = s.base_stat; break;
                case 'special-defense': baseSpDef = s.base_stat; break;
                case 'speed': baseSpeed = s.base_stat; break;
            }
        });
        const types = pkmn.types && Array.isArray(pkmn.types) ? pkmn.types.map(t => t.type.name) : []; 
        const abilities = pkmn.abilities && Array.isArray(pkmn.abilities) ? pkmn.abilities.map(a => ({ name: a.ability.name, isHidden: a.is_hidden })) : []; 
        let description = "No description available.";
        if (species && species.flavor_text_entries && Array.isArray(species.flavor_text_entries)) {
            const englishFlavorText = species.flavor_text_entries.find(entry => entry.language && entry.language.name === 'en');
            if (englishFlavorText) description = englishFlavorText.flavor_text.replace(/[\n\f\r]/g, ' ');
        } else if (species) {
            // console.warn(`flavor_text_entries missing or not an array for ${gameName}`);
        }
        
        let spriteChar = gameName.substring(0, 1).toUpperCase();
        if (gameName === "Nidoran♀") spriteChar = "N♀";
        else if (gameName === "Nidoran♂") spriteChar = "N♂";
        else if (gameName === "Mr. Mime") spriteChar = "MrM";
        else if (gameName === "Farfetch'd") spriteChar = "Fa";

        const spritesFromApi = pkmn.sprites || {}; 
        const genVSprites = spritesFromApi.versions?.['generation-v']?.['black-white'];

        let finalSprites = {
            front_default: spritesFromApi.front_default,
            front_shiny: spritesFromApi.front_shiny || null,
            animated_default: genVSprites?.animated?.front_default || null,
            animated_shiny: genVSprites?.animated?.front_shiny || null
        };

        if (gameName === "Pikachu") {
            finalSprites.front_default = './StaticPikachu.png'; 
            finalSprites.front_shiny = './ShinyPikachu.png';   
            finalSprites.animated_default = './Pikachu.gif'; 
            finalSprites.animated_shiny = './ShinyPikachu.png'; 
        }

        POKEMON_DATA[gameName] = {
            id: pkmn.id, apiName: apiName, name: gameName, displayName: gameName,
            baseHp, baseAtk, baseDef, baseSpAtk, baseSpDef, baseSpeed,
            types, abilities,
            height: pkmn.height !== undefined ? pkmn.height / 10 : 0, 
            weight: pkmn.weight !== undefined ? pkmn.weight / 10 : 0, 
            description,
            xpYield: pkmn.base_experience || (20 + Math.floor(Math.random() * 31) + Math.floor((pkmn.id || 0) * 0.3)), 
            learnset: manualLearnsets[gameName] || [{ level: 1, moveName: "Tackle" }],
            evolution: manualEvolutions[gameName] || null,
            sprites: finalSprites, 
            spriteChar: spriteChar,
            color: types.length > 0 ? (TYPE_COLORS_MAP[types[0]] || '#808080') : '#808080', 
        };
    }
    console.log("POKEMON_DATA populated. Sprites will be loaded on demand or from local paths for Pikachu.");
}


// --- PRELOADING ASSETS ---
async function preloadHouseSprite(imageUrl) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { preloadedHouseImage = img; console.log("House sprite preloaded successfully."); resolve(); }; img.onerror = (err) => { console.error(`Failed to preload house sprite from ${imageUrl}:`, err); preloadedHouseImage = null; reject(err); }; img.src = imageUrl; }); }
async function preloadBedSprite(imageUrl) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { preloadedBedImage = img; console.log("Bed sprite preloaded successfully."); resolve(); }; img.onerror = (err) => { console.error(`Failed to preload bed sprite from ${imageUrl}:`, err); preloadedBedImage = null; reject(err); }; img.src = imageUrl; }); }
async function preloadHospitalSprite(imageUrl) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { preloadedHospitalImage = img; console.log("Hospital sprite preloaded successfully."); resolve(); }; img.onerror = (err) => { console.error(`Failed to preload hospital sprite from ${imageUrl}:`, err); preloadedHospitalImage = null; reject(err); }; img.src = imageUrl; }); }
async function preloadTreeSprite(imageUrl) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { preloadedTreeImage = img; console.log("Tree sprite preloaded successfully."); resolve(); }; img.onerror = (err) => { console.error(`Failed to preload tree sprite from ${imageUrl}:`, err); preloadedTreeImage = null; reject(err); }; img.src = imageUrl; }); }
async function preloadPokemonSprite(pokemonName, spriteUrl, spriteType) {
    if (!spriteUrl) return 'failed'; 
    if (!preloadedPokemonSprites[pokemonName]) {
        preloadedPokemonSprites[pokemonName] = {
            static_default: null, animated_default: null,
            static_shiny: null, animated_shiny: null,
        };
    }

    if (preloadedPokemonSprites[pokemonName][spriteType] instanceof Image || preloadedPokemonSprites[pokemonName][spriteType] === 'failed') {
        return preloadedPokemonSprites[pokemonName][spriteType];
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            preloadedPokemonSprites[pokemonName][spriteType] = img;
            resolve(img);
        };
        img.onerror = () => {
            console.warn(`Failed to preload ${spriteType} sprite for ${pokemonName} from ${spriteUrl}`);
            preloadedPokemonSprites[pokemonName][spriteType] = 'failed';
            resolve('failed'); 
        };
        img.src = spriteUrl;
    });
}

// --- SPRITE LOADING HELPER ---
async function getOrLoadPokemonSprite(pokemonName, spriteType, spriteUrl) {
    if (!preloadedPokemonSprites[pokemonName] || !preloadedPokemonSprites[pokemonName][spriteType]) {
        if (spriteUrl) {
            await preloadPokemonSprite(pokemonName, spriteUrl, spriteType);
        }
    }
    const loadedSprite = preloadedPokemonSprites[pokemonName] ? preloadedPokemonSprites[pokemonName][spriteType] : null;
    if (loadedSprite instanceof Image) {
        return loadedSprite;
    }
    return null; 
}