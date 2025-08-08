// audio.js
let gameAudio;
let isMuted = false; // Keep track of mute state

function initializeMusic(filePath) {
    if (gameAudio) {
        gameAudio.pause();
        gameAudio.currentTime = 0;
    }
    gameAudio = new Audio(filePath);
    gameAudio.loop = true;
    gameAudio.volume = 0.3; // Adjust volume as needed (0.0 to 1.0)
    gameAudio.hasPlayed = false; // Flag to ensure we only try to play once on initial interaction

    // Attempt to play music. Browsers might block this until user interaction.
    // We'll also try to play it on the first canvas click/touch in index.html
    playMusic();

    // Update mute button text
    const muteBtn = document.getElementById('muteButton');
    if (muteBtn) {
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
    }
}

function playMusic() {
    if (gameAudio && gameAudio.paused && !isMuted) {
        gameAudio.play().then(() => {
            console.log("Background music started playing.");
            gameAudio.hasPlayed = true;
        }).catch(error => {
            console.warn("Audio autoplay was prevented by the browser. Will try again on user interaction.", error);
            // User interaction is needed to start audio in most modern browsers.
            // The main script will call playMusic() again on first canvas interaction.
        });
    }
}

function pauseMusic() {
    if (gameAudio && !gameAudio.paused) {
        gameAudio.pause();
        console.log("Background music paused.");
    }
}

function toggleMute() {
    isMuted = !isMuted;
    const muteBtn = document.getElementById('muteButton');
    if (gameAudio) {
        gameAudio.muted = isMuted;
        if (isMuted) {
            console.log("Music Muted");
            if(muteBtn) muteBtn.textContent = '🔇';
        } else {
            console.log("Music Unmuted");
            if(muteBtn) muteBtn.textContent = '🔊';
            // If unmuting and it was paused *because* it was muted, try to play.
            if (gameAudio.paused && gameAudio.hasPlayed) {
                playMusic();
            }
        }
    }
}

// Optional: Listen for visibility changes to pause/play music
document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
        pauseMusic();
    } else {
        if (!isMuted) { // Only resume if not manually muted
           playMusic();
        }
    }
});