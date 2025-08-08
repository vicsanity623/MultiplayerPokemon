// pokedex-data-loader.js
const PokedexDataLoader = (() => {
    const LOCAL_DATA_FILE = 'pokedex_mini_data_full_api.json'; // Path to your local JSON file

    async function loadAllKantoData(onCompleteCallback, onProgressCallback) {
        console.log("PokedexDataLoader: Starting Kanto data load from local file...");
        let rawPokemonDetails = [];
        let allTypeDamageRelations = {};

        if (onProgressCallback) onProgressCallback("Loading Pokedex data from local file...", 0.1);

        try {
            const response = await fetch(LOCAL_DATA_FILE);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} for ${LOCAL_DATA_FILE}`);
            }
            const localData = await response.json();

            if (onProgressCallback) onProgressCallback("Processing local Pokedex data...", 0.7);

            if (localData && localData.pokemonDetails && localData.typeDamageRelations) {
                rawPokemonDetails = localData.pokemonDetails;
                // Ensure pokemonDetails are sorted by ID if not already
                rawPokemonDetails.sort((a, b) => a.id - b.id);

                allTypeDamageRelations = localData.typeDamageRelations;

                console.log("PokedexDataLoader: All Kanto Pokemon data loaded from local file.");
                if (onProgressCallback) onProgressCallback("All Pokémon data loaded!", 1);

                if (onCompleteCallback) {
                    onCompleteCallback({
                        pokemonDetails: rawPokemonDetails,
                        typeDamageRelations: allTypeDamageRelations
                    });
                }
            } else {
                throw new Error("Local Pokedex data is missing expected 'pokemonDetails' or 'typeDamageRelations' properties.");
            }

        } catch (error) {
            console.error("Fatal: Failed to load or parse local Pokedex data.", error);
            if (onProgressCallback) onProgressCallback(`Error: Could not load local Pokedex data. ${error.message}`, 1);
            if (onCompleteCallback) onCompleteCallback(null); // Indicate failure
            return;
        }
    }

    return {
        loadAllKantoData
    };
})();