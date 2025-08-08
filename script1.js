// --- GAME STATE & CORE VARIABLES ---
let GAME_STATE = 'LOADING_ASSETS';
let previousGameState = 'ROAMING';
let TYPE_EFFECTIVENESS_DATA = {};
let POKEMON_DATA = {};
let worldSeed = Date.now();
let gameTime = 0;
let currentLightOverlay = 'rgba(0,0,0,0)';
let weather = "sunny";
let weatherTimer = 0;
let rainParticles = [];
let overworldParticles = [];
let currentBattle = null;
let pokemonLearningMove = null;
let newMoveToLearn = null;
let moveLearningPrompt = { active: false, text: [], options: [] };
let afterMoveLearnCallback = null;
let messageTimer = 0;
let currentCanvasScale = 1;
let lastTime = 0;
let preloadedHouseImage = null;
let preloadedBedImage = null;
let preloadedHospitalImage = null;
let preloadedTreeImage = null;
let treeProcessedChunks = new Set();
let worldTrees = [];
const preloadedPokemonSprites = {};
let needsBoostCheck = false; // For Pokemon storage UI click handler

// --- MULTIPLAYER VARIABLES ---
let socket = null; // WebSocket connection instance
let myPlayerId = null; // Unique ID for this client, assigned by the server
let otherPlayers = {}; // Object to store data of other connected players { id: {worldX, worldY, ...} }

// --- GAME CONSTANTS ---
// Mechanics & World
const NATIVE_WIDTH = 800;
const NATIVE_HEIGHT = 600;
const TILE_SIZE = 32;
const PLAYER_SIZE = 24;
const NPC_SPRITE_SIZE = 26;
const POKEMON_SPRITE_SIZE = 78;
const FOLLOWER_SPRITE_SCALE = 0.2;
const MAX_WILD_POKEMON = 20;
const WILD_POKEMON_COLLISION_SCALE = 0.6;
const NPC_COLLISION_SCALE = 0.8;
const DISTANCE_UNIT_PER_METER = TILE_SIZE;
const PLAYER_HOUSE_SAFE_ZONE_RADIUS = 100 * DISTANCE_UNIT_PER_METER;
const DISTANCE_TIER_2_MIN = 100 * DISTANCE_UNIT_PER_METER;
const DISTANCE_TIER_3_MIN = 500 * DISTANCE_UNIT_PER_METER;
const DISTANCE_TIER_4_MIN = 10000 * DISTANCE_UNIT_PER_METER;
const MEWTWO_COOLDOWN_DURATION_MS = 25 * 60 * 1000;
const DAY_NIGHT_CYCLE_SPEED = 0.2;
const WEATHER_DURATION = 20000;
// Darkness Fade
const DARKNESS_FADE_START_DISTANCE_M = 100;
const DARKNESS_FULL_DISTANCE_M = DISTANCE_TIER_4_MIN / DISTANCE_UNIT_PER_METER;
const MAX_DARKNESS_OPACITY = 0.97;
let currentWorldDarknessOverlay = 'rgba(0,0,0,0)';
// Hospital
const HOSPITAL_SIZE = TILE_SIZE * 2.5;
const HOSPITAL_CHUNK_SIZE_TILES = 30;
const HOSPITAL_SPAWN_CHANCE_PER_CHUNK = 0.3;
const HEALING_FLASH_DURATION = 1.0;
// Trees
const TREE_IMAGE_SCALE = 0.8;
const TREE_COLLISION_WIDTH_RATIO = 0.25;
const TREE_COLLISION_HEIGHT_RATIO = 0.2;
const TREE_SPAWN_CHANCE_PER_GRASS_TILE = 0.03;
const MIN_SPACING_BETWEEN_TREES_SQ = (TILE_SIZE * 2.5) ** 2;
const TREE_CHUNK_SIZE_TILES = 20;
// PokeBalls
const POKEBALL_SPRITE_SIZE = TILE_SIZE * 0.5;
const POKEBALL_PICKUP_RADIUS_SQ = (TILE_SIZE * 0.7) ** 2;
const PLAYER_VISIBILITY_RADIUS_FOR_POKEBALL_SQ = (50 * TILE_SIZE) ** 2;
const POKEBALL_SPAWN_TARGET_DISTANCE_FROM_PLAYER = 60 * TILE_SIZE;
const MIN_SPACING_BETWEEN_POKEBALLS_SQ = (7 * TILE_SIZE) ** 2;
const MAX_ACTIVE_POKEBALLS_IN_WORLD = 15;
const PLAYER_MOVE_THRESHOLD_FOR_POKEBALL_CHECK_SQ = (5 * TILE_SIZE) ** 2;
const POKEBALL_DESPAWN_IF_FARTHER_THAN_SQ = (60 * TILE_SIZE) ** 2;
// Minimap
const MINIMAP_SIZE_PX = NATIVE_WIDTH * 0.15;
const MINIMAP_MARGIN = 15;
const MINIMAP_RADIUS_WORLD_UNITS = 80 * DISTANCE_UNIT_PER_METER;

// NPC Task System
const NPC_INTERACTION_LEVEL_REQUIREMENTS = {
    npc_tier_2: 10,
    npc_tier_3: 20,
};
const ALL_NPC_TASK_CHAINS = {
    npc_tier_1: [
        { type: "CAPTURE_POKEMON", objective: "Hi, This here is an infinite Pokemon world. Start by catching 5 pokemon. Return here when complete. There should be some balls in your house.", targetCount: 1, minLevelRequirement: 0, rewards: { xp: 200, pokeBalls: 5, pokeCoins: 1 } },
        { type: "DEFEAT_SPECIFIC", objective: "I'm researching fire type Pokemon. Can you defeat 3 of them for my study?", targetPokemonName: "Charmander", targetCount: 1, rewards: { xp: 500, pokeBalls: 3, pokeCoins: 15 } },
        { type: "LEVEL_UP_EVENTS", objective: "Training is key! Achieve 1 level-up across your Pokemon team.", targetCount: 1, rewards: { xp: 700, pokeBalls: 5, pokeCoins: 25 } },
        { type: "PLAY_TIME", objective: "Dedication is admirable! Spend some more time exploring (approx. 5 minutes).", durationMs: 1 * 60 * 1000, rewards: { xp: 8500, pokeBalls: 10, pokeCoins: 35 } },
        { type: "DEFEAT_ANY", objective: "I need your help again. Please defeat 15 wild Pokemon.", targetCount: 1, rewards: { xp: 50000, pokeBalls: 7, pokeCoins: 40 } },
    ],
    npc_tier_2: [
        { type: "CAPTURE_POKEMON", objective: "We need more data. Capture 5 Pokemon that are level 20 or higher. you can find some south of here.", targetCount: 1, minLevelRequirement: 10, minCaughtPokemonLevel: 20, rewards: { xp: 1000, pokeBalls: 7, pokeCoins: 75 } },
        { type: "CAPTURE_POKEMON", objective: "We still need more data! Capture 10 Pokemon that are level 25 or higher. you can find some south of here.", targetCount: 11, minCaughtPokemonLevel: 25, rewards: { xp: 2000, pokeBalls: 10, pokeCoins: 175 } },
        { type: "DEFEAT_SPECIFIC", objective: "Those pesky Squirtle are overrunning the area! Defeat 10 Squirtles.", targetPokemonName: "Squirtle", targetCount: 1, rewards: { xp: 3000, pokeBalls: 3, pokeCoins: 90 } },
        { type: "PLAY_TIME", objective: "Dedication is admirable! Spend some more time exploring (approx. 15 minutes).", durationMs: 11 * 60 * 1000, rewards: { xp: 5000, pokeBalls: 30, pokeCoins: 100 } },
        { type: "DEFEAT_ANY", objective: "Could you help me out? Please defeat 10 wild Pokemon. There's too many!!!", targetCount: 1, rewards: { xp: 50000, pokeBalls: 4, pokeCoins: 100 } }
    ],
    npc_tier_3: [
        { type: "DEFEAT_ANY", objective: "I need to see some real power. Defeat 40 wild Pokemon of any kind.", targetCount: 1, minLevelRequirement: 25, rewards: { xp: 1000, pokeBalls: 8, pokeCoins: 120 } },
        { type: "LEVEL_UP_EVENTS", objective: "Push your team to new heights! Achieve 20 level-ups.", targetCount: 1, rewards: { xp: 2000, pokeBalls: 12, pokeCoins: 150 } },
        { type: "DEFEAT_SPECIFIC", objective: "Those pesky Machamp are overrunning the area! Defeat 5 Machamp.", targetPokemonName: "Machamp", targetCount: 1, rewards: { xp: 5000, pokeBalls: 13, pokeCoins: 175 } },
        { type: "CAPTURE_POKEMON", objective: "I'm looking for stronger specimens. Capture 10 Pokemon that are level 30 or higher.", targetCount: 1, minCaughtPokemonLevel: 30, rewards: { xp: 50000, pokeBalls: 15, pokeCoins: 200 } }
    ],
    default: [
        { type: "DEFEAT_ANY", objective: "Just need a quick hand, defeat any 120 Pokemon!", targetCount: 1, minLevelRequirement: 20, rewards: { xp: 1000, pokeBalls: 1, pokeCoins: 5 } },
        { type: "DEFEAT_ANY", objective: "Just defeat any 50 Pokemon!", targetCount: 1, rewards: { xp: 2000, pokeBalls: 2, pokeCoins: 10 } },
        { type: "CAPTURE_POKEMON", objective: "Can you find a Magikarp? I hear they turn into a dragon. Capture 1 Magikarp", targetCount: 1, rewards: { xp: 3000, pokeBalls: 3, pokeCoins: 20 } },
        { type: "CAPTURE_POKEMON", objective: "I hear Raichu is pretty rare, can you find it?", targetCount: 1, rewards: { xp: 4000, pokeBalls: 4, pokeCoins: 30 } },
        { type: "PLAY_TIME", objective: "Dedication is admirable! Spend some more time exploring (approx. 45 minutes).", durationMs: 1 * 60 * 1000, rewards: { xp: 5000, pokeBalls: 5, pokeCoins: 40 } },
        { type: "CAPTURE_POKEMON", objective: "OK I hear rumors that if you walk 10,000m into the DARKNESS, you may encounter Mewtwo. Capture 1 Mewtwo", targetCount: 1, rewards: { xp: 500000, pokeBalls: 300, pokeCoins: 2000 } },

    ]
};
const NPC_RESPAWN_DISTANCE_M = 125;
const NPC_PROMPT_DELAY_AFTER_ACTION_MS = 2000;
const NPC_PROMPT_DELAY_AFTER_CLOSE_MS = 9500;

// Pokemon Specific Constants
const STARTER_ZONE_POKEMON_NAMES = [ "Bulbasaur", "Charmander", "Squirtle", "Caterpie", "Weedle", "Pidgey", "Rattata", "Spearow",];
const LEGENDARY_POKEMON_NAMES = ["Articuno", "Zapdos", "Moltres", "Mewtwo", "Mew"];
const ELIGIBLE_FOR_DARK_VARIANT = [ "Venusaur", "Charizard", "Blastoise", "Ninetales", "Arcanine", "Poliwrath", "Alakazam", "Cloyster", "Gengar", "Gyarados", "Lapras", "Dragonite", "Mewtwo" ];

// Master Ball Chests
const MASTER_BALL_CHEST_DEFINITIONS = [
    { baseRadiusMeters: 10,  randomOffsetMeters: 2, id: "mb_chest_1" },
    { baseRadiusMeters: 1500, randomOffsetMeters: 50, id: "mb_chest_2" },
    { baseRadiusMeters: 2500, randomOffsetMeters: 50, id: "mb_chest_3" },
    { baseRadiusMeters: 5500, randomOffsetMeters: 50, id: "mb_chest_4" }
];
const MASTER_BALL_CHEST_SIZE = TILE_SIZE * 1.5;
const MASTER_BALL_CHEST_SPRITE_CHAR = "M";

// --- DOM ELEMENT SELECTIONS ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// UI Elements
const menuToggleBtn = document.getElementById('menuToggleBtn');
const gameMenu = document.getElementById('gameMenu');
const saveGameBtn = document.getElementById('saveGameBtn');
const loadGameBtn = document.getElementById('loadGameBtn');
const quitGameBtn = document.getElementById('quitGameBtn');
const fullscreenBtn = document.getElementById('fullscreenBtn');
// POKEDEX
const pokedexBtn = document.getElementById('pokedexBtn'); // New
const pokedexPanel = document.getElementById('pokedex-panel'); // New
const pokedexCloseBtn = document.getElementById('pokedex-close-btn'); // New
const pokedexPokemonList = document.getElementById('pokedex-pokemon-list'); // New
const pokedexSpriteContainer = document.getElementById('pokedex-sprite-container'); // New
const pokedexNameNumber = document.getElementById('pokedex-name-number'); // New
const pokedexTypes = document.getElementById('pokedex-types'); // New
const pokedexStatHp = document.getElementById('pokedex-stat-hp'); // New
const pokedexStatAtk = document.getElementById('pokedex-stat-atk'); // New
const pokedexStatDef = document.getElementById('pokedex-stat-def'); // New
const pokedexStatSpa = document.getElementById('pokedex-stat-spa'); // New
const pokedexStatSpd = document.getElementById('pokedex-stat-spd'); // New
const pokedexStatSpe = document.getElementById('pokedex-stat-spe'); // New
const pokedexDescription = document.getElementById('pokedex-description'); // New
// Player Status UI
const playerStatusLabel = document.getElementById('playerStatusLabel');
const playerHpBarFill = document.getElementById('playerHpBarFill');
const playerHpBarValueText = document.getElementById('playerHpBarValueText');
const playerXpBarFill = document.getElementById('playerXpBarFill');
const playerXpBarValueText = document.getElementById('playerXpBarValueText');
// Active Pokemon Status UI
const pokemonStatusLabel = document.getElementById('pokemonStatusLabel');
const pokemonHpBarFill = document.getElementById('pokemonHpBarFill');
const pokemonHpBarValueText = document.getElementById('pokemonHpBarValueText');
const pokemonXpBarFill = document.getElementById('pokemonXpBarFill');
const pokemonXpBarValueText = document.getElementById('pokemonXpBarValueText');
// Battle UI
const battleScreen = document.getElementById('battle-screen');
const battleLogContainer = document.getElementById('battle-log-container');
const enemySpriteEl = document.getElementById('enemySprite');
const enemyNameEl = document.getElementById('enemyName');
const enemyLevelEl = document.getElementById('enemyLevelText');
const enemyHPBarFillEl = document.getElementById('enemyHPFill');
const enemyHPTextEl = document.querySelector('#enemyBattleUI .battle-hp-text');
const playerPokemonSpriteEl = document.getElementById('playerPokemonSprite');
const playerPokemonNameEl = document.getElementById('playerPokemonName');
const playerPokemonLevelEl = document.getElementById('playerPokemonLevelText');
const playerPokemonHPBarFillEl = document.getElementById('playerPokemonHPFill');
const playerPokemonHPTextEl = document.querySelector('#playerBattleUI .battle-hp-text');
const playerBattlePokemonXpFill = document.getElementById('playerBattlePokemonXpFill');
const playerBattlePokemonXpText = document.getElementById('playerBattlePokemonXpText');
const battleOptionsContainer = document.getElementById('battle-options-container');
const playerBoostIndicatorEl = document.getElementById('playerBoostIndicator');
// Overlays & Messages
const flashOverlay = document.getElementById('flash-overlay');
const healFlashOverlay = document.getElementById('heal-flash-overlay');
const generalMessageArea = document.getElementById('general-message-area');
// Other UI
const teamStatusBarsContainer = document.getElementById('team-status-bars-container');
const joystickContainer = document.getElementById('joystick-container');
const joystickBase = document.getElementById('joystick-base');
const joystickNub = document.getElementById('joystick-nub');
const pokeCoinDisplayEl = document.getElementById('pokeCoinDisplay');
const pokeCoinAmountEl = document.getElementById('pokeCoinAmount');
// Loading Screen
const loadingScreen = document.getElementById('loading-screen');
const loadingMessage = document.getElementById('loading-message');
const loadingProgressBar = document.getElementById('loading-progress-bar');

// --- GLOBAL STATE VARIABLES (Continued) ---
// Player & Camera
let player = {
    worldX: 0, worldY: 0, originWorldX: 0, originWorldY: 0, preHospitalWorldX: 0, preHospitalWorldY: 0,
    screenX: 0, screenY: 0, speed: 92, level: 1, xp: 0, maxXp: 100,
    isMoving: false, targetX: 0, targetY: 0, mouseDown: false,
    animationFrame: 0, animationTimer: 0, animationSpeed: 0.2,
    team: [], storedPokemon: [], activeTasks: [],
    npcInteractionCooldownEnd: 0, lastAngle: 0,
    inventory: { PokeBall: 0, MasterBall: 0, PokeCoin: 0 },
    guidingArrowTargetNPC: null, showGuidingArrow: false,
    totalPlayTimeMs: 0,
    distanceTraveledSinceLastLegendaryAttempt: 0,
    lastLegendarySpawnCoordinates: { x: 0, y: 0},
    hasShinySpeedBoost: false, hasDarkAttackBoost: false,
    joystickActive: false, joystickAngle: 0, joystickMagnitude: 0,
    levelBasedSpeed: 150, // Base speed before level calculation if needed
    initTeam: function() { /* ... (implementation below) ... */ },
    addXp: function(amount) { /* ... (implementation below) ... */ },
    updateEffectiveSpeed: function() { /* ... (implementation below) ... */ },
    draw: function() { /* ... (implementation below) ... */ }
};
let camera = { x: 0, y: 0, update: function() { this.x = player.worldX - NATIVE_WIDTH/2; this.y = player.worldY - NATIVE_HEIGHT/2; } };
// World Objects
let wildPokemon = [];
let NPCS = [];
let discoveredHospitals = [];
let masterBallChests = [];
let worldPokeBalls = [];
let lastPlayerPosForPokeBallCheck = { x: 0, y: 0 };
// Hospital UI
let healPromptActive = false;
let nurseScreenPos = {x:0, y:0};
let healPromptYesRect = {x:0, y:0, w:0, h:0};
let healPromptNoRect = {x:0, y:0, w:0, h:0};
let hospitalPokemonChestRect = {x:0, y:0, w:0, h:0};
let hospitalExitRect = {x:0, y:0, w:0, h:0};
let isHealingFlashActive = false;
let healingFlashTimer = 0;
// Player House UI
let playerHouse = { worldX: 0, worldY: 0, width: TILE_SIZE * 6, height: TILE_SIZE * 6, collisionWidth: TILE_SIZE * 4.5, collisionHeight: TILE_SIZE * 3 };
let houseBedRect = {x:0, y:0, w:0, h:0};
let houseDoorRect = {x:0, y:0, w:0, h:0};
let housePokemonChestRect = {x:0, y:0, w:0, h:0};
let houseItemChestRect = {x:0, y:0, w:0, h:0};
let houseActionPrompt = { active: false, text: [], options: [] };
let itemChestPrompt = { active: false, text: [], options: [] };
let houseItemChest = { currentPokeBalls: 25, maxPokeBalls: 25, pokeBallSpriteChar: "●", color: "#FF0000" };
// NPC Interaction
let currentInteractingNPC = null;
let npcInteractionPromptActive = false;
let npcPromptText = [];
let npcPromptOptions = [];
// Pokemon Storage UI
let pokemonStorageUI = {
    teamListArea: { x: 50, y: 100, w: 330, h: NATIVE_HEIGHT - 200, itemHeight: 35, scrollY: 0, headerH: 30 },
    storedListArea: { x: NATIVE_WIDTH - 330 - 50, y: 100, w: 330, h: NATIVE_HEIGHT - 200, itemHeight: 35, scrollY: 0, headerH: 30 },
    buttons: [],
    closeButtonRect: { x: NATIVE_WIDTH / 2 - 50, y: NATIVE_HEIGHT - 70, w: 100, h: 35 },
    itemPadding: 5, buttonWidth: 80, buttonHeight: 25, scrollButtonSize: 20
};
// Task List UI
let taskListScrollOffset = 0;
let taskListMaxHeight = NATIVE_HEIGHT * 0.3;
let taskListContentHeight = 0;
let taskListBoxRect = {x:0, y:0, w:0, h:0};
// Minimap
let minimapX, minimapY;
// Mewtwo Cooldown
let lastMewtwoSpawnTime = 0;
let mewtwoOnCooldown = false;
// Joystick
let joystickTouchId = null;
let joystickInitialX = 0;
let joystickInitialY = 0;
let joystickNubCenterX = 0;
let joystickNubCenterY = 0;
let joystickBaseRect;

// --- GAME DATA DEFINITIONS ---
const TYPE_COLORS_MAP = {
    normal: "#A8A77A", fire: "#EE8130", water: "#6390F0", electric: "#F7D02C",
    grass: "#7AC74C", ice: "#96D9D6", fighting: "#C22E28", poison: "#A33EA1",
    ground: "#E2BF65", flying: "#A98FF3", psychic: "#F95587", bug: "#A6B91A",
    rock: "#B6A136", ghost: "#735797", dragon: "#6F35FC", dark: "#705746",
    steel: "#B7B7CE", fairy: "#D685AD", unknown: "#68A090"
};
const POKEMON_NAMES = ["Bulbasaur", "Ivysaur", "Venusaur", "Charmander", "Charmeleon", "Charizard", "Squirtle", "Wartortle", "Blastoise", "Caterpie", "Metapod", "Butterfree", "Weedle", "Kakuna", "Beedrill", "Pidgey", "Pidgeotto", "Pidgeot", "Rattata", "Raticate", "Spearow", "Fearow", "Ekans", "Arbok", "Pikachu", "Raichu", "Sandshrew", "Sandslash", "Nidoran♀", "Nidorina", "Nidoqueen", "Nidoran♂", "Nidorino", "Nidoking", "Clefairy", "Clefable", "Vulpix", "Ninetales", "Jigglypuff", "Wigglytuff", "Zubat", "Golbat", "Oddish", "Gloom", "Vileplume", "Paras", "Parasect", "Venonat", "Venomoth", "Diglett", "Dugtrio", "Meowth", "Persian", "Psyduck", "Golduck", "Mankey", "Primeape", "Growlithe", "Arcanine", "Poliwag", "Poliwhirl", "Poliwrath", "Abra", "Kadabra", "Alakazam", "Machop", "Machoke", "Machamp", "Bellsprout", "Weepinbell", "Victreebel", "Tentacool", "Tentacruel", "Geodude", "Graveler", "Golem", "Ponyta", "Rapidash", "Slowpoke", "Slowbro", "Magnemite", "Magneton", "Farfetch'd", "Doduo", "Dodrio", "Seel", "Dewgong", "Grimer", "Muk", "Shellder", "Cloyster", "Gastly", "Haunter", "Gengar", "Onix", "Drowzee", "Hypno", "Krabby", "Kingler", "Voltorb", "Electrode", "Exeggcute", "Exeggutor", "Cubone", "Marowak", "Hitmonlee", "Hitmonchan", "Lickitung", "Koffing", "Weezing", "Rhyhorn", "Rhydon", "Chansey", "Tangela", "Kangaskhan", "Horsea", "Seadra", "Goldeen", "Seaking", "Staryu", "Starmie", "Mr. Mime", "Scyther", "Jynx", "Electabuzz", "Magmar", "Pinsir", "Tauros", "Magikarp", "Gyarados", "Lapras", "Ditto", "Eevee", "Vaporeon", "Jolteon", "Flareon", "Porygon", "Omanyte", "Omastar", "Kabuto", "Kabutops", "Aerodactyl", "Snorlax", "Articuno", "Zapdos", "Moltres", "Dratini", "Dragonair", "Dragonite", "Mewtwo","Mew"];
const ALL_MOVES = [
    { name: "Tackle", power: 35, type: "Normal" }, 
    { name: "Scratch", power: 40, type: "Normal" },
    { name: "Quick Attack", power: 40, type: "Normal" },
    { name: "Hyper Beam", power: 150, type: "Normal" },
    { name: "Splash", power: 0, type: "Normal"}, 
    { name: "Smokescreen", power:0, type:"Normal"},
    { name: "Ember", power: 40, type: "Fire" },
    { name: "Flame Wheel", power: 60, type: "Fire" },
    { name: "Fire Punch", power: 75, type: "Fire" },
    { name: "Flamethrower", power: 90, type: "Fire" },
    { name: "Water Gun", power: 40, type: "Water" },
    { name: "Bubble", power: 40, type: "Water" },
    { name: "Hydro Pump", power: 110, type: "Water" },
    { name: "Vine Whip", power: 40, type: "Grass" },
    { name: "Razor Leaf", power: 55, type: "Grass" },
    { name: "Solar Beam", power: 120, type: "Grass" },
    { name: "Thunder Shock", power: 40, type: "Electric" },
    { name: "Thunder Punch", power: 75, type: "Electric" },
    { name: "Thunderbolt", power: 90, type: "Electric" },
    { name: "Gust", power: 40, type: "Flying" },
    { name: "Peck", power: 35, type: "Flying" },
    { name: "Wing Attack", power: 60, type: "Flying" },
    { name: "Confusion", power: 50, type: "Psychic" },
    { name: "Psychic", power: 90, type: "Psychic" },
    { name: "Rock Throw", power: 50, type: "Rock" },
    { name: "Bite", power: 60, type: "Dark" },
    { name: "Ice Punch", power: 75, type: "Ice" },
    { name: "Ice Beam", power: 90, type: "Ice" },          
    { name: "Harden", power: 0, type: "Normal", stat_changes: [{ stat: "defense", change: 1, target: "user", chance: 1 }] },
    { name: "Growl", power: 0, type: "Normal", stat_changes: [{ stat: "attack", change: -1, target: "opponent", chance: 1 }] },
    { name: "Tail Whip", power: 0, type: "Normal", stat_changes: [{ stat: "defense", change: -1, target: "opponent", chance: 1 }] },
    { name: "Charge Beam", power: 50, type: "Electric", stat_changes: [{ stat: "special-attack", change: 1, target: "user", chance: 0.7 }] },
    { name: "Metal Claw", power: 50, type: "Steel", stat_changes: [{ stat: "attack", change: 1, target: "user", chance: 0.1 }] },
    { name: "Moonblast", power: 95, type: "Fairy", stat_changes: [{ stat: "special-attack", change: -1, target: "opponent", chance: 0.3 }] },
    { name: "Crunch", power: 80, type: "Dark", stat_changes: [{ stat: "defense", change: -1, target: "opponent", chance: 0.2 }] },
    { name: "Aurora Beam", power: 65, type: "Ice", stat_changes: [{ stat: "attack", change: -1, target: "opponent", chance: 0.1 }] },
    { name: "Overheat", power: 130, type: "Fire", stat_changes: [{ stat: "special-attack", change: -2, target: "user", chance: 1 }] },
    { name: "Close Combat", power: 120, type: "Fighting", stat_changes: [ { stat: "defense", change: -1, target: "user", chance: 1 }, { stat: "special-defense", change: -1, target: "user", chance: 1 } ]},
    { name: "Agility", power:0, type:"Psychic", stat_changes: [{ stat: "speed", change: 2, target: "user", chance: 1 }] }
];