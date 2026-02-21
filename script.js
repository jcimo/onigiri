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
const onigiri = document.getElementById("onigiri-link");

function updateSongTitle() {
    const titleElement = document.getElementById("song-title");
    const artistElement = document.getElementById("song-artist");
    const container = document.getElementById("metadata-container");
    const videoData = player.getVideoData();
    if (videoData && videoData.title) {
        titleElement.innerText = videoData.title;
        artistElement.innerText = videoData.author.replace(/ - Topic$/i, "");
        container.classList.add("show-title");
    }
}

window.onYouTubeIframeAPIReady = function () {
    console.log("onigiri: handshake started");
    player = new YT.Player("youtube-player", {
        height: "1",
        width: "1",
        playerVars: {
            listType: "playlist",
            list: "PLsTX-6Y0uWvMKvaDYnd1f_PZR7hq0vjPP",
            autoplay: 0,
            controls: 0,
            enablejsapi: 1,
            origin: window.location.origin,
        },
        events: {
            onReady: (event) => {
                apiReady = true;
                player.setShuffle(true);
                console.log("onigiri: ready");
            },
            onStateChange: (event) => {
                if (event.data === YT.PlayerState.PLAYING) {
                    player.setShuffle(true);
                    updateSongTitle();
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
        document.body.style.animationPlayState = "running";
        player.unMute();
        player.setVolume(100);
        if (firstPlay) {
            const playlist = player.getPlaylist();
            const randomIndex = Math.floor(
                Math.random() * (playlist ? playlist.length : 1),
            );
            player.playVideoAt(randomIndex);
            firstPlay = false;
            console.log("onigiri: start");
        } else {
            player.nextVideo();
            console.log("onigiri: next");
        }
    } else {
        isPlaying = false;
        onigiri.classList.remove("glow-active");
        document.body.style.animationPlayState = "paused";
        player.pauseVideo();
        document
            .getElementById("metadata-container")
            .classList.remove("show-title");
        console.log("onigiri: pause");
    }
});
