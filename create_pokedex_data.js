const fs = require('fs');
const path = require('path');

// Use dynamic import for node-fetch
async function main() {
    const fetch = (await import('node-fetch')).default;

    const API_BASE_URL = 'https://pokeapi.co/api/v2/';
    const KANTO_LIMIT = 151;
    const OUTPUT_FILE = path.join(__dirname, 'pokedex_data_full_api.json'); // Saves in the same directory as the script

    let allPokemonDetails = [];
    let allTypeDamageRelations = {};

    console.log("Starting Pokedex data generation...");

    async function fetchJsonWithRetry(url, retries = 3, delay = 2000, attempt = 1) {
        try {
            console.log(`Fetching (Attempt ${attempt}): ${url}`);
            const response = await fetch(url, { timeout: 20000 }); // 20 second timeout
            if (!response.ok) {
                if (response.status === 404) {
                    console.warn(`404 Not Found for URL: ${url}. Returning null.`);
                    return null;
                }
                throw new Error(`HTTP error! status: ${response.status} for ${url}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`Fetch attempt ${attempt} for ${url} failed:`, error.message);
            if (attempt <= retries) {
                console.log(`Retrying in ${delay / 1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                return fetchJsonWithRetry(url, retries, delay, attempt + 1);
            } else {
                console.error(`All retries failed for ${url}.`);
                return null;
            }
        }
    }

    try {
        // 1. Fetch all Type Data
        console.log("\n--- Fetching Type Damage Relations ---");
        const typesListResponse = await fetchJsonWithRetry(`${API_BASE_URL}type?limit=18`); // There are 18 types
        if (!typesListResponse || !typesListResponse.results) {
            throw new Error("Failed to fetch initial type list.");
        }

        for (const typeSummary of typesListResponse.results) {
            const typeData = await fetchJsonWithRetry(typeSummary.url);
            if (typeData) {
                allTypeDamageRelations[typeData.name] = typeData.damage_relations;
                console.log(`Fetched type: ${typeData.name}`);
            } else {
                console.warn(`Could not fetch data for type: ${typeSummary.name}`);
            }
        }
        console.log("All type damage relations fetched.\n");

        // 2. Fetch Kanto Pokemon List
        console.log("--- Fetching Kanto Pokémon List ---");
        const kantoPokemonListResponse = await fetchJsonWithRetry(`${API_BASE_URL}pokemon?limit=${KANTO_LIMIT}&offset=0`);
        if (!kantoPokemonListResponse || !kantoPokemonListResponse.results) {
            throw new Error("Failed to fetch Kanto Pokemon list.");
        }
        const kantoPokemonSummaries = kantoPokemonListResponse.results;
        console.log(`Found ${kantoPokemonSummaries.length} Kanto Pokémon summaries.\n`);

        // 3. Fetch details for each Pokémon
        console.log("--- Fetching Individual Pokémon Details ---");
        for (let i = 0; i < kantoPokemonSummaries.length; i++) {
            const pokemonSummary = kantoPokemonSummaries[i];
            const pokemonId = parseInt(pokemonSummary.url.split('/').slice(-2, -1)[0]); // Extract ID from URL

            console.log(`Fetching data for ${pokemonSummary.name} (ID: ${pokemonId}) [${i + 1}/${KANTO_LIMIT}]...`);

            const pokemonAPIData = await fetchJsonWithRetry(pokemonSummary.url);
            let speciesAPIData = null;

            if (pokemonAPIData && pokemonAPIData.species && pokemonAPIData.species.url) {
                speciesAPIData = await fetchJsonWithRetry(pokemonAPIData.species.url);
            } else if (pokemonAPIData) {
                 console.warn(`Species URL missing for ${pokemonSummary.name}, attempting species fetch by ID: ${pokemonId}`);
                 speciesAPIData = await fetchJsonWithRetry(`${API_BASE_URL}pokemon-species/${pokemonId}/`);
            }


            if (pokemonAPIData) { // Only add if primary data was fetched
                allPokemonDetails.push({
                    id: pokemonAPIData.id,      // Store the numeric ID
                    name: pokemonAPIData.name,  // Store the API name (lowercase)
                    pokemonAPIData,
                    speciesAPIData
                });
            } else {
                console.warn(`Skipping ${pokemonSummary.name} due to fetch error for primary data.`);
            }
        }

        // Ensure sorting by ID just in case API list wasn't perfectly ordered or retries changed order
        allPokemonDetails.sort((a, b) => a.id - b.id);

        // 4. Combine and Save
        const finalData = {
            pokemonDetails: allPokemonDetails,
            typeDamageRelations: allTypeDamageRelations
        };

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(finalData, null, 2)); // null, 2 for pretty printing
        console.log(`\nSUCCESS: Pokedex data successfully generated and saved to ${OUTPUT_FILE}`);

    } catch (error) {
        console.error("\nFATAL ERROR during Pokedex data generation:", error);
    }
}

main().catch(console.error);