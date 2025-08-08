const fs = require('fs');
const path = require('path');

// --- Configuration ---
const inputFile = './pokedex_data_full_api.json';
const outputFile = './pokedex_mini_data_full_api.json';

// IMPORTANT: This is the path PREFIX your CLIENT'S BROWSER will use.
// It MUST correctly point to your 'sprites/pokemon/' directory from the perspective of your index.html.
// If index.html is in MultiplayerPokemon/ and sprites are in MultiplayerPokemon/sprites/pokemon/,
// then this should be 'sprites/pokemon/'.
const CLIENT_SPRITE_DIRECTORY_PREFIX = 'sprites/pokemon/'; // ADJUST IF NEEDED (e.g., './sprites/pokemon/')

// Base local filesystem path for THIS SCRIPT to construct full paths to your sprite files.
// This script assumes it's running from your project root (/Users/vic/Desktop/MultiplayerPokemon/)
const LOCAL_SPRITE_BASE_FILESYSTEM_PATH = path.join(__dirname, 'sprites', 'pokemon');

console.log(`Input Pokedex JSON: ${inputFile}`);
console.log(`Output Mini Pokedex JSON: ${outputFile}`);
console.log(`Client Sprite Directory Prefix: ${CLIENT_SPRITE_DIRECTORY_PREFIX}`);
console.log(`Local Sprite Base Filesystem Path (for script): ${LOCAL_SPRITE_BASE_FILESYSTEM_PATH}`);

// --- Helper to check if a local file exists based on your naming convention ---
function checkFileExists(pokemonId, pokemonName, variant) {
    let filename = '';
    if (variant === 'shiny') {
        filename = `${pokemonId}_${pokemonName}_shiny.png`;
    } else if (variant === 'default') {
        filename = `${pokemonId}_${pokemonName}.png`;
    } else {
        return false; // Or handle other types like animated if you have them
    }
    const filePath = path.join(LOCAL_SPRITE_BASE_FILESYSTEM_PATH, filename);
    return fs.existsSync(filePath);
}

// --- Main Script Logic ---
let rawData;
try {
    rawData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));
} catch (error) {
    console.error(`Error reading or parsing input file ${inputFile}:`, error);
    process.exit(1);
}

if (!rawData.pokemonDetails || !rawData.typeDamageRelations) {
    console.error(`Input file ${inputFile} is missing 'pokemonDetails' or 'typeDamageRelations'.`);
    process.exit(1);
}

const newPokemonDetails = rawData.pokemonDetails.map(detail => {
    if (!detail.pokemonAPIData || !detail.speciesAPIData) {
        console.warn(`Skipping Pokemon ID ${detail.id} (${detail.name}) due to missing core API data.`);
        return null;
    }

    const pokemonId = detail.id;
    const pokemonNameFromApi = detail.name; // This is 'bulbasaur', 'ivysaur', etc.

    // Construct CLIENT-ACCESSIBLE paths based on your naming convention
    let clientSprites = {
        front_default: null,
        front_shiny: null,
        animated_default: null, // Assuming no animated GIFs for now based on your example
        animated_shiny: null   // Assuming no animated GIFs for now
    };

    // Default sprite
    if (checkFileExists(pokemonId, pokemonNameFromApi, 'default')) {
        clientSprites.front_default = `${CLIENT_SPRITE_DIRECTORY_PREFIX}${pokemonId}_${pokemonNameFromApi}.png`;
    } else {
        console.warn(`Default sprite not found for: ${pokemonId}_${pokemonNameFromApi}.png`);
    }

    // Shiny sprite
    if (checkFileExists(pokemonId, pokemonNameFromApi, 'shiny')) {
        clientSprites.front_shiny = `${CLIENT_SPRITE_DIRECTORY_PREFIX}${pokemonId}_${pokemonNameFromApi}_shiny.png`;
    } else {
        console.warn(`Shiny sprite not found for: ${pokemonId}_${pokemonNameFromApi}_shiny.png`);
    }

    // If you have animated GIFs with a similar naming convention, add checks for them here.
    // For example, if animated were 1_bulbasaur.gif:
    // if (fs.existsSync(path.join(LOCAL_SPRITE_BASE_FILESYSTEM_PATH, `${pokemonId}_${pokemonNameFromApi}.gif`))) {
    //     clientSprites.animated_default = `${CLIENT_SPRITE_DIRECTORY_PREFIX}${pokemonId}_${pokemonNameFromApi}.gif`;
    // }

    // Override for Pikachu (ensure these paths are correct relative to index.html
    // AND that these specific files exist at your project root or wherever you point them)
    if (pokemonNameFromApi === "pikachu") {
        // Assuming these special Pikachu files are at the root relative to index.html
        // and are named exactly as below.
        // If StaticPikachu.png is your 25_pikachu.png, adjust accordingly.
        if (fs.existsSync(path.join(__dirname, 'StaticPikachu.png'))) {
             clientSprites.front_default = './StaticPikachu.png';
        } else {
            console.warn("Local StaticPikachu.png not found for override.");
        }
        if (fs.existsSync(path.join(__dirname, 'ShinyPikachu.png'))) {
            clientSprites.front_shiny = './ShinyPikachu.png';
        } else {
            console.warn("Local ShinyPikachu.png not found for override.");
        }
        if (fs.existsSync(path.join(__dirname, 'Pikachu.gif'))) {
            clientSprites.animated_default = './Pikachu.gif';
        } else {
            console.warn("Local Pikachu.gif not found for override.");
        }
        // For animated shiny Pikachu, if it's the same as static shiny:
        if (fs.existsSync(path.join(__dirname, 'ShinyPikachu.png'))) {
            clientSprites.animated_shiny = './ShinyPikachu.png';
        } else {
            console.warn("Local ShinyPikachu.png (for animated_shiny) not found for override.");
        }
    }


    // Find the first English flavor text
    let englishFlavorText = "No description available.";
    if (detail.speciesAPIData.flavor_text_entries && Array.isArray(detail.speciesAPIData.flavor_text_entries)) {
        const foundEntry = detail.speciesAPIData.flavor_text_entries.find(entry => entry.language && entry.language.name === 'en');
        if (foundEntry) {
            englishFlavorText = foundEntry.flavor_text.replace(/[\n\f\r]/g, ' ').trim();
        }
    }

    return {
        id: pokemonId,
        name: pokemonNameFromApi, // Use the API name, your POKEMON_NAMES array maps this if needed later
        pokemonAPIData: {
            abilities: detail.pokemonAPIData.abilities.map(a => ({
                ability: { name: a.ability.name },
                is_hidden: a.is_hidden
            })),
            base_experience: detail.pokemonAPIData.base_experience,
            stats: detail.pokemonAPIData.stats.map(s => ({
                base_stat: s.base_stat,
                stat: { name: s.stat.name }
            })),
            types: detail.pokemonAPIData.types.map(t => ({
                type: { name: t.type.name }
            })),
            height: detail.pokemonAPIData.height,
            weight: detail.pokemonAPIData.weight,
            sprites: clientSprites
        },
        speciesAPIData: {
            flavor_text_entries: [
                { flavor_text: englishFlavorText, language: { name: "en" } }
            ]
        }
    };
}).filter(p => p !== null);

const newPokedexData = {
    pokemonDetails: newPokemonDetails,
    typeDamageRelations: rawData.typeDamageRelations
};

try {
    fs.writeFileSync(outputFile, JSON.stringify(newPokedexData, null, 2));
    console.log(`SUCCESS: Created ${outputFile} with ${newPokemonDetails.length} Pokemon processed.`);
    console.log(`Ensure client sprite paths (e.g., "${CLIENT_SPRITE_DIRECTORY_PREFIX}1_bulbasaur.png") are correct for your web server.`);
} catch (error) {
    console.error(`Error writing output file ${outputFile}:`, error);
    process.exit(1);
}