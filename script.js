// --- BACKGROUND ---
const orange = { r: 255, g: 169, b: 0 };
const purple = { r: 100, g: 0, b: 169 };
const lime = { r: 169, g: 255, b: 0 };
const blue = { r: 69, g: 100, b: 255 };

function interpolate(color1, color2, percent) {
    const r = Math.round(color1.r + (color2.r - color1.r) * percent);
    const g = Math.round(color1.g + (color2.g - color1.g) * percent);
    const b = Math.round(color1.b + (color2.b - color1.b) * percent);
    return `rgb(${r}, ${g}, ${b})`;
}

function updateBackground(x, y) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width / 2;
    const centerY = height / 2;
    const distanceX = x - centerX;
    const distanceY = y - centerY;
    const currentDistance = Math.sqrt(
        distanceX * distanceX + distanceY * distanceY,
    );
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    const percent = Math.min(currentDistance / maxDistance, 1);
    const currentTop = interpolate(lime, orange, percent);
    const currentBottom = interpolate(blue, purple, percent);
    document.body.style.backgroundImage = `linear-gradient(var(--gradient-angle, 0deg), ${currentTop}, ${currentBottom})`;
}

updateBackground(0, 0);

window.addEventListener("mousemove", (e) => {
    updateBackground(e.clientX, e.clientY);
});

window.addEventListener("resize", () => {
    updateBackground(0, 0);
});

// --- PLAYER ---
let player;
let isPlaying = false;
let apiReady = false;
let firstPlay = true;
let currentVolume = 80;

const PLAYLIST_ID = "PLsTX-6Y0uWvMKvaDYnd1f_PZR7hq0vjPP";
const onigiri = document.getElementById("onigiri-link");
const controls = document.getElementById("player-controls");
const nextBtn = document.getElementById("next-btn");
const volUpBtn = document.getElementById("vol-up-btn");
const volDownBtn = document.getElementById("vol-down-btn");

function updateSongTitle() {
    const titleElement = document.getElementById("song-title");
    const artistElement = document.getElementById("song-artist");
    const container = document.getElementById("metadata-container");
    const videoData = player.getVideoData();
    if (firstPlay) return;
    if (videoData && videoData.title) {
        let cleanTitle = videoData.title
            .replace(/\s*\(.*\)$/, "")
            .replace(/\s*\[.*\]$/, "");
        titleElement.innerText = cleanTitle;
        artistElement.innerText = videoData.author.replace(/ - Topic$/i, "");
        if (isPlaying) {
            container.classList.add("show-title");
        }
    }
}

function updateVolumeUI() {
    volUpBtn.classList.toggle("limit-reached", currentVolume >= 100);
    volDownBtn.classList.toggle("limit-reached", currentVolume <= 1);
}

window.onYouTubeIframeAPIReady = function () {
    console.log("onigiri: handshake started");
    player = new YT.Player("youtube-player", {
        height: "1",
        width: "1",
        playerVars: {
            listType: "playlist",
            list: PLAYLIST_ID,
            autoplay: 0,
            controls: 0,
            enablejsapi: 1,
            origin: window.location.origin,
        },
        events: {
            onReady: () => {
                console.log("onigiri: ready");
                apiReady = true;
                player.setShuffle(true);
                player.setLoop(true);
                player.setVolume(currentVolume);
                updateVolumeUI();
            },
            onStateChange: (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                    // player.setShuffle(true);
                    updateSongTitle();
                }
                if (event.data === YT.PlayerState.ENDED) {
                    console.log("onigiri: ended");
                    player.nextVideo();
                }
            },
            onError: (e) => {
                console.log("onigiri: error:", e.data);
                player.nextVideo();
            },
        },
    });
};

onigiri.addEventListener("click", () => {
    console.log("onigiri: click");
    if (!apiReady) return;
    if (!document.body.classList.contains("rotating-background")) {
        document.body.classList.add("rotating-background");
    }
    if (!isPlaying) {
        isPlaying = true;
        onigiri.classList.add("glow-active");
        controls.classList.add("show-nav");
        updateSongTitle();
        document.body.style.animationPlayState = "running";
        player.unMute();
        if (firstPlay) {
            console.log("onigiri: start");
            const playlist = player.getPlaylist();
            const max = playlist && playlist.length ? playlist.length : 1;
            const randomIndex = Math.floor(Math.random() * max);
            player.playVideoAt(randomIndex);
            firstPlay = false;
        } else {
            console.log("onigiri: play");
            player.playVideo();
        }
    } else {
        console.log("onigiri: pause");
        isPlaying = false;
        onigiri.classList.remove("glow-active");
        controls.classList.remove("show-nav");
        document
            .getElementById("metadata-container")
            .classList.remove("show-title");
        document.body.style.animationPlayState = "paused";
        player.pauseVideo();
    }
});

nextBtn.addEventListener("click", () => {
    if (apiReady && isPlaying) {
        onigiri.classList.remove("shake");
        void onigiri.offsetWidth;
        onigiri.classList.add("shake");
        setTimeout(() => onigiri.classList.remove("shake"), 400);
        player.nextVideo();
    }
});

volUpBtn.addEventListener("click", () => {
    if (apiReady && isPlaying && currentVolume < 100) {
        currentVolume = Math.min(currentVolume + 10, 100);
        player.setVolume(currentVolume);
        updateVolumeUI();
    }
});

volDownBtn.addEventListener("click", () => {
    if (apiReady && isPlaying && currentVolume > 1) {
        currentVolume = Math.max(currentVolume - 10, 1);
        player.setVolume(currentVolume);
        updateVolumeUI();
    }
});
