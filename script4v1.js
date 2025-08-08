// script4v1.js (or script4.js - designed for local minimized JSON)

// --- DATA INITIALIZATION HELPERS ---
function getManualLearnsets() {
    let learnsets = {};
    // Ensure POKEMON_NAMES is available or this will error.
    // This part assumes POKEMON_NAMES uses your canonical game names.
    if (typeof POKEMON_NAMES !== 'undefined') {
        POKEMON_NAMES.forEach(name => {
            learnsets[name] = [{ level: 1, moveName: "Tackle" }, { level: 5, moveName: "Growl" }];
        });
    } else {
        console.warn("POKEMON_NAMES not available for default learnset generation in getManualLearnsets.");
    }
    learnsets["Pikachu"] = [ {level: 1, moveName: "Thunder Shock"}, {level: 1, moveName: "Growl"}, {level: 6, moveName: "Tail Whip"}, {level: 8, moveName: "Quick Attack"}, {level: 15, moveName: "Thunderbolt"} ];
    learnsets["Raichu"] = [ {level: 1, moveName: "Thunder Shock"}, {level: 1, moveName: "Growl"}, {level: 1, moveName: "Tail Whip"}, {level: 1, moveName: "Quick Attack"}, {level: 1, moveName: "Thunderbolt"}, {level: 35, moveName: "Hyper Beam"} ];
    learnsets["Pidgey"] = [ {level: 1, moveName: "Tackle"}, {level: 5, moveName: "Gust"}, {level: 12, moveName: "Quick Attack"}, {level: 19, moveName: "Wing Attack"} ];
    learnsets["Pidgeotto"] = [ {level: 1, moveName: "Gust"}, {level: 1, moveName: "Quick Attack"}, {level: 21, moveName: "Wing Attack"}, {level: 31, moveName: "Agility"} ];
    learnsets["Pidgeot"] = [ {level: 1, moveName: "Gust"}, {level: 1, moveName: "Quick Attack"}, {level: 1, moveName: "Wing Attack"}, {level: 38, moveName: "Agility"}, {level: 40, moveName: "Hyper Beam"} ];
    learnsets["Charmander"] = [ {level: 1, moveName: "Scratch"}, {level: 1, moveName: "Growl"}, {level: 7, moveName: "Ember"}, {level: 13, moveName: "Smokescreen"}, {level: 19, moveName: "Flamethrower"}];
    learnsets["Charmeleon"] = [ {level: 1, moveName: "Scratch"}, {level: 1, moveName: "Growl"}, {level: 1, moveName: "Ember"}, {level: 20, moveName: "Flamethrower"}, {level: 28, moveName: "Fire Punch"} ];
    learnsets["Charizard"] = [ {level: 1, moveName: "Scratch"}, {level: 1, moveName: "Growl"}, {level: 1, moveName: "Ember"}, {level: 1, moveName: "Flamethrower"}, {level: 1, moveName: "Wing Attack"}, {level: 45, moveName: "Hyper Beam"} ];
    learnsets["Squirtle"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Tail Whip"}, {level: 8, moveName: "Bubble"}, {level: 15, moveName: "Water Gun"}, {level: 22, moveName: "Bite"}];
    learnsets["Wartortle"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Tail Whip"}, {level: 1, moveName: "Bubble"}, {level: 15, moveName: "Water Gun"}, {level: 24, moveName: "Bite"}, {level: 31, moveName: "Hydro Pump"}];
    learnsets["Blastoise"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Tail Whip"}, {level: 1, moveName: "Bubble"}, {level: 1, moveName: "Water Gun"}, {level: 1, moveName: "Bite"}, {level: 42, moveName: "Hydro Pump"}, {level: 50, moveName: "Hyper Beam"}];
    learnsets["Bulbasaur"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Growl"}, {level: 7, moveName: "Vine Whip"}, {level: 13, moveName: "Razor Leaf"} ];
    learnsets["Ivysaur"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Growl"}, {level: 1, moveName: "Vine Whip"}, {level: 20, moveName: "Razor Leaf"}, {level: 30, moveName: "Solar Beam"} ];
    learnsets["Venusaur"] = [ {level: 1, moveName: "Tackle"}, {level: 1, moveName: "Growl"}, {level: 1, moveName: "Vine Whip"}, {level: 1, moveName: "Razor Leaf"}, {level: 40, moveName: "Solar Beam"}, {level: 50, moveName: "Hyper Beam"} ];
    learnsets["Magikarp"] = [{level: 1, moveName: "Splash"}];
    learnsets["Gyarados"] = [{level: 1, moveName: "Bite"}, {level: 20, moveName: "Hydro Pump"}, {level: 30, moveName: "Hyper Beam"}];
    learnsets["Mewtwo"] = [{level: 1, moveName: "Psychic"}, {level: 70, moveName: "Hyper Beam"}];
    return learnsets;
}

function getManualEvolutions() {
    let evolutions = {};
    evolutions["Pikachu"] = { evolvesTo: "Raichu", evolutionLevel: 30 };
    evolutions["Pidgey"] = { evolvesTo: "Pidgeotto", evolutionLevel: 18 };
    evolutions["Pidgeotto"] = { evolvesTo: "Pidgeot", evolutionLevel: 36 };
    evolutions["Charmander"] = { evolvesTo: "Charmeleon", evolutionLevel: 16 };
    evolutions["Charmeleon"] = { evolvesTo: "Charizard", evolutionLevel: 36 };
    evolutions["Squirtle"] = { evolvesTo: "Wartortle", evolutionLevel: 16 };
    evolutions["Wartortle"] = { evolvesTo: "Blastoise", evolutionLevel: 36 };
    evolutions["Bulbasaur"] = { evolvesTo: "Ivysaur", evolutionLevel: 16 };
    evolutions["Ivysaur"] = { evolvesTo: "Venusaur", evolutionLevel: 32 };
    evolutions["Magikarp"] = { evolvesTo: "Gyarados", evolutionLevel: 20 };
    return evolutions;
}

async function transformAndPopulateGamePokemonData(minimizedPokedexData) {
    console.log("Transforming MINIMIZED local JSON data into game format...");
    
    if (!minimizedPokedexData || !minimizedPokedexData.pokemonDetails || !minimizedPokedexData.typeDamageRelations) {
        console.error("CRITICAL: Minimized Pokedex data is malformed or missing essential parts.");
        GAME_STATE = 'ERROR_LOADING'; // Or handle error appropriately
        return;
    }

    const { pokemonDetails, typeDamageRelations } = minimizedPokedexData;
    TYPE_EFFECTIVENESS_DATA = typeDamageRelations; // Store fetched type effectiveness

    const manualLearnsets = getManualLearnsets();
    const manualEvolutions = getManualEvolutions();

    if (typeof POKEMON_NAMES === 'undefined' || POKEMON_NAMES.length === 0) {
        console.error("CRITICAL: POKEMON_NAMES array (from script1.js) is not available or empty for mapping!");
        GAME_STATE = 'ERROR_LOADING';
        return;
    }
    console.log("POKEMON_NAMES array is available. Length:", POKEMON_NAMES.length);

    const apiToGameNameMap = {};
    POKEMON_NAMES.forEach(gameName => {
        if (typeof gameName !== 'string') {
            console.warn("Encountered non-string in POKEMON_NAMES:", gameName);
            return;
        }
        let normalizedGameName = gameName.toLowerCase().replace("♀", "-f").replace("♂", "-m").replace("'", "").replace(". ", "-").replace(" ", "-");
        if (gameName === "Nidoran♀") normalizedGameName = "nidoran-f";
        else if (gameName === "Nidoran♂") normalizedGameName = "nidoran-m";
        else if (gameName === "Mr. Mime") normalizedGameName = "mr-mime";
        else if (gameName === "Farfetch'd") normalizedGameName = "farfetchd";
        apiToGameNameMap[normalizedGameName] = gameName;
    });
    console.log("Constructed apiToGameNameMap (first 5 entries):", Object.fromEntries(Object.entries(apiToGameNameMap).slice(0,5)));


    let successfullyMappedCount = 0;
    POKEMON_DATA = {}; // Initialize POKEMON_DATA

    for (const pkmnFromMinJson of pokemonDetails) {
        if (!pkmnFromMinJson || typeof pkmnFromMinJson.apiName !== 'string' || typeof pkmnFromMinJson.id === 'undefined') {
            console.warn("Skipping malformed entry in minimizedPokedexData.pokemonDetails:", pkmnFromMinJson);
            continue;
        }

        const apiNameNormalized = pkmnFromMinJson.apiName.toLowerCase(); // Name from JSON is already API-style
        let gameName = apiToGameNameMap[apiNameNormalized];

        if (!gameName) { // Fallback attempt using ID
            const nameFromIdArray = POKEMON_NAMES[pkmnFromMinJson.id - 1];
            if (nameFromIdArray && typeof nameFromIdArray === 'string') {
                let normalizedFromArray = nameFromIdArray.toLowerCase().replace("♀", "-f").replace("♂", "-m").replace("'", "").replace(". ", "-").replace(" ", "-");
                if (nameFromIdArray === "Nidoran♀") normalizedFromArray = "nidoran-f";
                else if (nameFromIdArray === "Nidoran♂") normalizedFromArray = "nidoran-m";
                else if (nameFromIdArray === "Mr. Mime") normalizedFromArray = "mr-mime";
                else if (nameFromIdArray === "Farfetch'd") normalizedFromArray = "farfetchd";
                
                if (normalizedFromArray === apiNameNormalized) {
                    gameName = nameFromIdArray;
                }
            }
        }

        if (!gameName) {
            console.warn(`FINAL FAIL (minimized): Could not map API name "${pkmnFromMinJson.apiName}" (ID ${pkmnFromMinJson.id}) to a canonical game name. Skipping.`);
            continue;
        }
        successfullyMappedCount++;

        let spriteChar = gameName.substring(0, 1).toUpperCase();
        if (gameName === "Nidoran♀") spriteChar = "N♀";
        else if (gameName === "Nidoran♂") spriteChar = "N♂";
        else if (gameName === "Mr. Mime") spriteChar = "MrM";
        else if (gameName === "Farfetch'd") spriteChar = "Fa";
        
        let finalSprites = pkmnFromMinJson.sprites; // These are local relative paths from pokedex_data_minimized.json

        // Handle specific local overrides for Pikachu if its sprites aren't managed by the download script's naming convention
        // or if you want to use different specific files for it (like a GIF).
        if (gameName === "Pikachu") {
            // console.log(`Processing Pikachu. Sprites from JSON:`, JSON.stringify(finalSprites));
            // The fetch script saves as './sprites/pokemon/25_pikachu.png' etc.
            // Your original code had specific paths like './Pikachu.gif'.
            // Choose which ones to use or combine:
            finalSprites = {
                front_default: pkmnFromMinJson.sprites.front_default || './StaticPikachu.png', // Use downloaded, fallback to your specific
                front_shiny: pkmnFromMinJson.sprites.front_shiny || './ShinyPikachu.png',   // Use downloaded, fallback to your specific
                animated_default: './Pikachu.gif', // Assuming this is a specific local file you have
                animated_shiny: './ShinyPikachu.png' // Assuming this is a specific local file you have
            };
            // console.log(`Final sprites for Pikachu:`, JSON.stringify(finalSprites));
        }

        POKEMON_DATA[gameName] = {
            id: pkmnFromMinJson.id,
            apiName: pkmnFromMinJson.apiName, // Original API name for reference
            name: gameName,                   // Canonical game name
            displayName: gameName,
            baseHp: pkmnFromMinJson.baseStats.hp,
            baseAtk: pkmnFromMinJson.baseStats.attack,
            baseDef: pkmnFromMinJson.baseStats.defense,
            baseSpAtk: pkmnFromMinJson.baseStats.specialattack,
            baseSpDef: pkmnFromMinJson.baseStats.specialdefense,
            baseSpeed: pkmnFromMinJson.baseStats.speed,
            types: pkmnFromMinJson.types,
            // abilities: pkmnFromMinJson.abilities, // Not currently in minimized JSON, add if needed
            height: pkmnFromMinJson.height,
            weight: pkmnFromMinJson.weight,
            description: pkmnFromMinJson.description,
            xpYield: pkmnFromMinJson.baseExperienceYield,
            learnset: manualLearnsets[gameName] || [{ level: 1, moveName: "Tackle" }],
            evolution: manualEvolutions[gameName] || null,
            sprites: finalSprites, // Contains relative paths (potentially overridden for Pikachu)
            spriteChar: spriteChar,
            color: (typeof TYPE_COLORS_MAP !== 'undefined' && pkmnFromMinJson.types.length > 0) ? TYPE_COLORS_MAP[pkmnFromMinJson.types[0]] : '#808080',
        };
    }
    console.log(`POKEMON_DATA populated from MINIMIZED JSON. Successfully mapped ${successfullyMappedCount} of ${pokemonDetails.length} Pokemon.`);
}

// --- PRELOADING ASSETS ---
async function preloadHouseSprite(imageUrl) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { preloadedHouseImage = img; console.log("House sprite preloaded successfully."); resolve(); }; img.onerror = (err) => { console.error(`Failed to preload house sprite from ${imageUrl}:`, err); preloadedHouseImage = null; reject(err); }; img.src = imageUrl; }); }
async function preloadBedSprite(imageUrl) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { preloadedBedImage = img; console.log("Bed sprite preloaded successfully."); resolve(); }; img.onerror = (err) => { console.error(`Failed to preload bed sprite from ${imageUrl}:`, err); preloadedBedImage = null; reject(err); }; img.src = imageUrl; }); }
async function preloadHospitalSprite(imageUrl) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { preloadedHospitalImage = img; console.log("Hospital sprite preloaded successfully."); resolve(); }; img.onerror = (err) => { console.error(`Failed to preload hospital sprite from ${imageUrl}:`, err); preloadedHospitalImage = null; reject(err); }; img.src = imageUrl; }); }
async function preloadTreeSprite(imageUrl) { return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => { preloadedTreeImage = img; console.log("Tree sprite preloaded successfully."); resolve(); }; img.onerror = (err) => { console.error(`Failed to preload tree sprite from ${imageUrl}:`, err); preloadedTreeImage = null; reject(err); }; img.src = imageUrl; }); }

// This function preloads sprites using the paths from POKEMON_DATA (which should now be local paths)
async function preloadPokemonSprite(pokemonName, spriteUrl, spriteType) {
    if (!spriteUrl) {
        // console.warn(`No sprite URL provided for ${pokemonName} - ${spriteType}. Cannot preload.`);
        return 'failed_no_url';
    }
    
    if (!preloadedPokemonSprites[pokemonName]) {
        preloadedPokemonSprites[pokemonName] = {
            static_default: null, animated_default: null,
            static_shiny: null, animated_shiny: null,
        };
    }

    // If already an Image object or marked as 'failed_load' or 'failed_no_url', return that status/object
    if (preloadedPokemonSprites[pokemonName][spriteType] instanceof Image || 
        preloadedPokemonSprites[pokemonName][spriteType] === 'failed_load' ||
        preloadedPokemonSprites[pokemonName][spriteType] === 'failed_no_url') {
        return preloadedPokemonSprites[pokemonName][spriteType];
    }

    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            preloadedPokemonSprites[pokemonName][spriteType] = img;
            // console.log(`Successfully preloaded: ${pokemonName} - ${spriteType} from ${spriteUrl}`);
            resolve(img);
        };
        img.onerror = (err) => {
            console.warn(`Failed to preload ${spriteType} sprite for ${pokemonName} from ${spriteUrl}. Error:`, err);
            preloadedPokemonSprites[pokemonName][spriteType] = 'failed_load';
            resolve('failed_load'); 
        };
        img.src = spriteUrl; // spriteUrl is now a local path like './sprites/pokemon/25_pikachu.png'
    });
}

// This function gets a preloaded sprite or triggers a load if not already attempted using paths from POKEMON_DATA
async function getOrLoadPokemonSprite(pokemonName, spriteTypeKey, defaultSpriteUrlFromData) {
    // spriteTypeKey examples: 'front_default', 'front_shiny', 'animated_default'
    // defaultSpriteUrlFromData is the path like './sprites/pokemon/25_pikachu.png'

    if (!POKEMON_DATA[pokemonName] || !POKEMON_DATA[pokemonName].sprites) {
        // console.warn(`No POKEMON_DATA or sprites entry for ${pokemonName} in getOrLoadPokemonSprite.`);
        return null;
    }
    
    // Use the sprite URL from POKEMON_DATA[pokemonName].sprites[spriteTypeKey]
    const spriteUrlToLoad = POKEMON_DATA[pokemonName].sprites[spriteTypeKey] || defaultSpriteUrlFromData;

    if (!preloadedPokemonSprites[pokemonName] || !(preloadedPokemonSprites[pokemonName][spriteTypeKey] instanceof Image)) {
        if (spriteUrlToLoad) {
            // console.log(`On-demand loading sprite: ${pokemonName} - ${spriteTypeKey} from ${spriteUrlToLoad}`);
            await preloadPokemonSprite(pokemonName, spriteUrlToLoad, spriteTypeKey);
        } else {
            // console.warn(`No sprite URL found for ${pokemonName} - ${spriteTypeKey} during on-demand load.`);
        }
    }
    
    const loadedSprite = preloadedPokemonSprites[pokemonName] ? preloadedPokemonSprites[pokemonName][spriteTypeKey] : null;
    if (loadedSprite instanceof Image) {
        return loadedSprite;
    }
    // console.warn(`Returning null/failed for ${pokemonName} - ${spriteTypeKey}. Status: ${loadedSprite}`);
    return null; 
}