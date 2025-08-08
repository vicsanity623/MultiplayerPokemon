// fetch_poke_data.js (Version 2 - Selective Data & Sprite Download)
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const https = require('https'); // For downloading images

const API_BASE_URL = 'https://pokeapi.co/api/v2/';
const KANTO_LIMIT = 151;

// Output directory for sprites, relative to where this script is run
const SPRITE_OUTPUT_DIR = path.join(__dirname, 'sprites', 'pokemon');
// Output file for the JSON data
const JSON_OUTPUT_FILE = path.join(__dirname, 'pokedex_data_minimized.json');

// Ensure sprite directory exists
if (!fs.existsSync(SPRITE_OUTPUT_DIR)) {
    fs.mkdirSync(SPRITE_OUTPUT_DIR, { recursive: true });
    console.log(`Created sprite directory: ${SPRITE_OUTPUT_DIR}`);
}

async function fetchJsonWithRetry(url, retries = 3, delay = 1000, isCritical = true) {
    console.log(`Fetching JSON: ${url}`);
    for (let i = 0; i <= retries; i++) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(` - 404 Not Found for JSON: ${url}.`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status} for ${url}`);
            }
            return await response.json();
        } catch (error) {
            console.error(` - JSON Fetch attempt ${i + 1} for ${url} failed:`, error.message);
            if (i < retries) {
                console.log(` - Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                console.error(` - All retries failed for JSON: ${url}.`);
                if (isCritical) throw error; // Rethrow if critical so script can stop
                return null;
            }
        }
    }
}

async function downloadImage(url, filepath, pokemonName, spriteType) {
    if (!url) {
        console.warn(` - No URL for ${pokemonName} ${spriteType} sprite. Skipping download.`);
        return null;
    }
    console.log(` - Attempting to download ${spriteType} sprite for ${pokemonName} from ${url} to ${filepath}`);
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, response => {
            if (response.statusCode !== 200) {
                console.warn(` - Failed to download ${spriteType} for ${pokemonName}. Status: ${response.statusCode} from ${url}`);
                fs.unlink(filepath, () => {}); // Delete empty file if created
                resolve(null); // Resolve with null on failure to download
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(() => {
                    console.log(`   - Successfully downloaded ${filepath}`);
                    resolve(path.basename(filepath)); // Return just the filename
                });
            });
        }).on('error', err => {
            fs.unlink(filepath, () => {}); // Delete partial file on error
            console.error(` - Error downloading ${spriteType} for ${pokemonName}: ${err.message} from ${url}`);
            resolve(null); // Resolve with null on error
        });
    });
}


async function fetchAllData() {
    console.log("Starting MINIMIZED data fetch for local JSON...");
    let outputData = {
        pokemonDetails: [], // This will store our refined pokemon objects
        typeDamageRelations: {}
    };

    // 1. Fetch Type Data (same as before)
    console.log("\nFetching Type Data...");
    const typesListResponse = await fetchJsonWithRetry(`${API_BASE_URL}type?limit=18`);
    if (!typesListResponse) { console.error("No types list response. Exiting."); return; }
    const typePromises = typesListResponse.results.map(async (typeSummary) => {
        const typeData = await fetchJsonWithRetry(typeSummary.url);
        if (typeData) {
            outputData.typeDamageRelations[typeData.name] = typeData.damage_relations;
        }
    });
    await Promise.all(typePromises);
    console.log("Type data fetched and processed.");

    // 2. Fetch Kanto Pokemon Summaries
    console.log("\nFetching Kanto Pokemon List...");
    const kantoPokemonListResponse = await fetchJsonWithRetry(`${API_BASE_URL}pokemon?limit=${KANTO_LIMIT}&offset=0`);
    if (!kantoPokemonListResponse) { console.error("No pokemon list response. Exiting."); return; }
    
    const kantoPokemonSummaries = kantoPokemonListResponse.results;
    console.log(`Found ${kantoPokemonSummaries.length} Pokemon to process.`);

    for (let i = 0; i < kantoPokemonSummaries.length; i++) {
        const pokemonSummary = kantoPokemonSummaries[i]; // { name: 'bulbasaur', url: '...' }
        console.log(`\nProcessing Pokemon ${i + 1}/${kantoPokemonSummaries.length}: ${pokemonSummary.name}`);

        const pkmnData = await fetchJsonWithRetry(pokemonSummary.url);
        if (!pkmnData) {
            console.warn(` - Failed to fetch main data for ${pokemonSummary.name}. Skipping.`);
            continue;
        }

        let speciesData = null;
        if (pkmnData.species && pkmnData.species.url) {
            speciesData = await fetchJsonWithRetry(pkmnData.species.url, 2, 1000, false); // Species data not super critical if fails
        }

        // Extract only the data you need
        const baseStats = {};
        pkmnData.stats.forEach(s => {
            baseStats[s.stat.name.replace('-', '')] = s.base_stat; // e.g., specialattack, specialdefense
        });

        let description = "No description available.";
        if (speciesData && speciesData.flavor_text_entries) {
            const englishFlavorText = speciesData.flavor_text_entries.find(entry => entry.language.name === 'en');
            if (englishFlavorText) {
                description = englishFlavorText.flavor_text.replace(/[\n\f\r]/g, ' ').replace(/\s+/g, ' ').trim();
            }
        }
        
        // Sprite URLs from API
        const spriteUrls = {
            front_default: pkmnData.sprites.front_default,
            front_shiny: pkmnData.sprites.front_shiny,
            // You can add animated here if you want to try downloading them too
            // animated_default: pkmnData.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_default,
            // animated_shiny: pkmnData.sprites.versions?.['generation-v']?.['black-white']?.animated?.front_shiny,
        };

        // Download sprites and get local paths
        const localSpritePaths = {};
        const defaultSpriteFilename = `${pkmnData.id}_${pkmnData.name}.png`;
        const shinySpriteFilename = `${pkmnData.id}_${pkmnData.name}_shiny.png`;

        localSpritePaths.front_default = await downloadImage(spriteUrls.front_default, path.join(SPRITE_OUTPUT_DIR, defaultSpriteFilename), pkmnData.name, 'default');
        localSpritePaths.front_shiny = await downloadImage(spriteUrls.front_shiny, path.join(SPRITE_OUTPUT_DIR, shinySpriteFilename), pkmnData.name, 'shiny');
        
        // If animated sprites were desired, download them similarly:
        // const animatedDefaultFilename = `${pkmnData.id}_${pkmnData.name}_anim.gif`;
        // const animatedShinyFilename = `${pkmnData.id}_${pkmnData.name}_anim_shiny.gif`;
        // localSpritePaths.animated_default = await downloadImage(spriteUrls.animated_default, path.join(SPRITE_OUTPUT_DIR, animatedDefaultFilename), pkmnData.name, 'animated default');
        // localSpritePaths.animated_shiny = await downloadImage(spriteUrls.animated_shiny, path.join(SPRITE_OUTPUT_DIR, animatedShinyFilename), pkmnData.name, 'animated shiny');


        // Construct the refined pokemon object for our JSON
        const refinedPokemon = {
            id: pkmnData.id,
            apiName: pkmnData.name, // Keep the API name for mapping in script4
            types: pkmnData.types.map(t => t.type.name),
            baseStats: {
                hp: baseStats.hp || 0,
                attack: baseStats.attack || 0,
                defense: baseStats.defense || 0,
                specialattack: baseStats.specialattack || 0,
                specialdefense: baseStats.specialdefense || 0,
                speed: baseStats.speed || 0,
            },
            height: pkmnData.height, // In decimetres
            weight: pkmnData.weight, // In hectograms
            description: description,
            baseExperienceYield: pkmnData.base_experience,
            sprites: { // Store relative paths to downloaded sprites
                front_default: localSpritePaths.front_default ? `./sprites/pokemon/${localSpritePaths.front_default}` : null,
                front_shiny: localSpritePaths.front_shiny ? `./sprites/pokemon/${localSpritePaths.front_shiny}` : null,
                // animated_default: localSpritePaths.animated_default ? `./sprites/pokemon/${localSpritePaths.animated_default}` : null,
                // animated_shiny: localSpritePaths.animated_shiny ? `./sprites/pokemon/${localSpritePaths.animated_shiny}` : null,
            }
            // Note: Learnsets and evolutions are handled manually in your script4.js
            // so we don't need to fetch/store the massive move list from the API here.
        };
        outputData.pokemonDetails.push(refinedPokemon);
    }

    outputData.pokemonDetails.sort((a, b) => a.id - b.id);

    // 3. Save to JSON file
    try {
        fs.writeFileSync(JSON_OUTPUT_FILE, JSON.stringify(outputData, null, 2));
        console.log(`\nSuccessfully fetched and saved MINIMIZED data to ${JSON_OUTPUT_FILE}`);
        console.log(`Sprites downloaded to: ${SPRITE_OUTPUT_DIR}`);
    } catch (err) {
        console.error("\nError writing data to file:", err);
    }
}

fetchAllData();