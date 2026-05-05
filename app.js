import { getPlaylistTracks, getTrackById, playlists, tracks } from "./api.js";

const $ = (selector) => document.querySelector(selector);

const state = {
  activeMood: "All",
  activePlaylist: "Trending Tracks",
  currentTrack: tracks[0],
  downloaded: JSON.parse(localStorage.getItem("nuyo-downloads") || "[]"),
  elapsed: 0,
  liked: JSON.parse(localStorage.getItem("nuyo-liked") || "[1,3,4,8]"),
  playing: false,
  queue: [...tracks],
};

let audioContext;
let masterGain;
let noteTimer;
let progressTimer;

function formatTime(value) {
  const minutes = Math.floor(value / 60);
  const seconds = String(value % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function saveState() {
  localStorage.setItem("nuyo-downloads", JSON.stringify(state.downloaded));
  localStorage.setItem("nuyo-liked", JSON.stringify(state.liked));
}

function showToast(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  window.setTimeout(() => $("#toast").classList.remove("show"), 1600);
}

function ensureAudio() {
  if (audioContext) return;

  audioContext = new AudioContext();
  masterGain = audioContext.createGain();
  masterGain.gain.value = Number($("#volumeSlider").value) / 100;
  masterGain.connect(audioContext.destination);
}

function playTone(frequency, start, duration, type, gainValue) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(gainValue, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(masterGain);
  oscillator.start(start);
  oscillator.stop(start + duration + 0.03);
}

function scheduleMusic() {
  stopMusic();
  ensureAudio();

  const track = state.currentTrack;
  const beat = 60 / track.tempo;
  const scale = [1, 1.125, 1.25, 1.5, 1.667, 2];
  let step = 0;

  noteTimer = window.setInterval(() => {
    const now = audioContext.currentTime;
    const degree = scale[(step + track.id) % scale.length];
    const bassDegree = scale[(step + 2) % 3];

    playTone(track.root * degree, now, beat * 0.72, track.wave, 0.055);
    playTone(track.root * bassDegree * 0.5, now, beat * 1.45, "sine", 0.08);

    if (step % 4 === 0) {
      playTone(track.root * 2.5, now + beat * 0.5, beat * 0.18, "triangle", 0.025);
    }

    step += 1;
  }, beat * 1000);
}

function stopMusic() {
  if (noteTimer) window.clearInterval(noteTimer);
  noteTimer = null;
}

function updateProgress() {
  $("#elapsed").textContent = formatTime(state.elapsed);
  $("#duration").textContent = formatTime(state.currentTrack.duration);
  $("#progressFill").style.width = `${Math.min(100, (state.elapsed / state.currentTrack.duration) * 100)}%`;
}

function startProgress() {
  window.clearInterval(progressTimer);
  progressTimer = window.setInterval(() => {
    if (!state.playing) return;
    state.elapsed += 1;
    if (state.elapsed >= state.currentTrack.duration) {
      playNext(1);
      return;
    }
    updateProgress();
  }, 1000);
}

function setPlaying(playing) {
  state.playing = playing;
  $("#playButton").textContent = playing ? "⏸" : "▶";

  if (playing) {
    ensureAudio();
    audioContext.resume();
    scheduleMusic();
    startProgress();
  } else {
    stopMusic();
  }
}

function setTrack(track, autoplay = true) {
  state.currentTrack = track;
  state.elapsed = 0;
  document.documentElement.style.setProperty("--current-cover", track.color);

  $("#nowArt").style.background = track.color;
  $("#playerArt").style.background = track.color;
  $("#nowTitle").textContent = track.title;
  $("#nowArtist").textContent = track.artist;
  $("#playerTitle").textContent = track.title;
  $("#playerArtist").textContent = track.artist;
  $("#likeButton").textContent = state.liked.includes(track.id) ? "♥" : "♡";
  $("#downloadButton").textContent = state.downloaded.includes(track.id) ? "✓" : "⇩";

  updateProgress();
  renderTracks();
  setPlaying(autoplay);
}

function visibleTracks() {
  const term = $("#searchInput").value.trim().toLowerCase();
  return state.queue.filter((track) => {
    const moodMatch = state.activeMood === "All" || track.mood === state.activeMood;
    const searchMatch = `${track.title} ${track.artist} ${track.mood}`.toLowerCase().includes(term);
    return moodMatch && searchMatch;
  });
}

function renderPlaylists() {
  $("#playlistList").innerHTML = playlists.map((playlist) => `
    <button class="playlist-pill" data-playlist="${playlist.name}">
      <span style="background:${playlist.color}"></span>
      ${playlist.name}
    </button>
  `).join("");
}

function renderMoods() {
  const moods = ["All", ...new Set(tracks.map((track) => track.mood))];
  $("#moodTabs").innerHTML = moods.map((mood) => `
    <button class="tab ${mood === state.activeMood ? "active" : ""}" data-mood="${mood}">${mood}</button>
  `).join("");
}

function renderRecommendations() {
  const recommended = tracks
    .filter((track) => state.activeMood === "All" || track.mood === state.activeMood)
    .slice(0, 4);

  $("#recommendationGrid").innerHTML = recommended.map((track) => `
    <button class="mix-card" data-track="${track.id}">
      <span class="mix-art" style="background:${track.color}">▶</span>
      <strong>${track.title}</strong>
      <small>${track.artist} • ${track.mood}</small>
    </button>
  `).join("");
}

function renderTracks() {
  const rows = visibleTracks();
  $("#trackList").innerHTML = rows.map((track, index) => `
    <button class="track-row ${track.id === state.currentTrack.id ? "active" : ""}" data-track="${track.id}">
      <span>${index + 1}</span>
      <span class="song-cell">
        <i style="background:${track.color}"></i>
        <span>
          <strong>${track.title}</strong>
          <small>${track.artist}</small>
        </span>
      </span>
      <span>${track.mood}</span>
      <span>${formatTime(track.duration)}</span>
      <span>${state.downloaded.includes(track.id) ? "✓" : "⇩"}</span>
    </button>
  `).join("");
}

function renderDownloads() {
  const downloads = state.downloaded.map(getTrackById).filter(Boolean);
  $("#downloadCount").textContent = downloads.length;
  $("#likedCount").textContent = state.liked.length;

  if (!downloads.length) {
    $("#downloadList").innerHTML = `<p class="empty">Downloaded songs will appear here and stay saved in this browser.</p>`;
    return;
  }

  $("#downloadList").innerHTML = downloads.map((track) => `
    <div class="download-item">
      <button data-track="${track.id}">
        <i style="background:${track.color}"></i>
        <span>
          <strong>${track.title}</strong>
          <small>${track.artist}</small>
        </span>
      </button>
      <button class="remove-btn" data-remove="${track.id}">×</button>
    </div>
  `).join("");
}

function choosePlaylist(name) {
  const queue = getPlaylistTracks(name);
  if (!queue.length) return;

  state.activePlaylist = name;
  state.queue = queue;
  $("#queueTitle").textContent = name;
  setTrack(queue[0], true);
}

function playNext(direction) {
  const rows = visibleTracks();
  const source = rows.length ? rows : tracks;
  const currentIndex = source.findIndex((track) => track.id === state.currentTrack.id);
  const nextTrack = source[(currentIndex + direction + source.length) % source.length] || source[0];
  setTrack(nextTrack, true);
}

function toggleDownload(track = state.currentTrack) {
  if (state.downloaded.includes(track.id)) {
    state.downloaded = state.downloaded.filter((id) => id !== track.id);
    showToast(`${track.title} removed from offline`);
  } else {
    state.downloaded.push(track.id);
    showToast(`${track.title} saved offline`);
  }

  saveState();
  renderDownloads();
  setTrack(state.currentTrack, state.playing);
}

document.addEventListener("click", (event) => {
  const trackButton = event.target.closest("[data-track]");
  const playlistButton = event.target.closest("[data-playlist]");
  const moodButton = event.target.closest("[data-mood]");
  const removeButton = event.target.closest("[data-remove]");
  const navButton = event.target.closest("[data-view]");

  if (trackButton) setTrack(getTrackById(trackButton.dataset.track), true);

  if (playlistButton) choosePlaylist(playlistButton.dataset.playlist);

  if (moodButton) {
    state.activeMood = moodButton.dataset.mood;
    renderMoods();
    renderRecommendations();
    renderTracks();
  }

  if (removeButton) {
    state.downloaded = state.downloaded.filter((id) => id !== Number(removeButton.dataset.remove));
    saveState();
    renderDownloads();
    setTrack(state.currentTrack, state.playing);
  }

  if (navButton) {
    document.querySelectorAll(".nav-item").forEach((button) => button.classList.remove("active"));
    navButton.classList.add("active");

    if (navButton.dataset.view === "offline") {
      state.queue = state.downloaded.map(getTrackById).filter(Boolean);
      $("#queueTitle").textContent = "Offline Tracks";
      renderTracks();
    }

    if (navButton.dataset.view === "home" || navButton.dataset.view === "library") {
      state.queue = [...tracks];
      $("#queueTitle").textContent = navButton.dataset.view === "library" ? "Your Library" : "Trending Tracks";
      renderTracks();
    }

    if (navButton.dataset.view === "recommendations") {
      $("#recommendations").scrollIntoView({ behavior: "smooth" });
    }
  }
});

$("#playButton").addEventListener("click", () => setPlaying(!state.playing));
$("#prevButton").addEventListener("click", () => playNext(-1));
$("#nextButton").addEventListener("click", () => playNext(1));
$("#heroPlay").addEventListener("click", () => choosePlaylist("Daily Mix"));
$("#downloadButton").addEventListener("click", () => toggleDownload());
$("#shuffleButton").addEventListener("click", () => {
  state.queue = [...state.queue].sort(() => Math.random() - 0.5);
  setTrack(state.queue[0] || tracks[0], true);
  showToast(`${state.activePlaylist} shuffled`);
});
$("#likeButton").addEventListener("click", () => {
  state.liked = state.liked.includes(state.currentTrack.id)
    ? state.liked.filter((id) => id !== state.currentTrack.id)
    : [...state.liked, state.currentTrack.id];
  saveState();
  setTrack(state.currentTrack, state.playing);
});
$("#clearDownloads").addEventListener("click", () => {
  state.downloaded = [];
  saveState();
  renderDownloads();
  setTrack(state.currentTrack, state.playing);
});
$("#searchInput").addEventListener("input", renderTracks);
$("#volumeSlider").addEventListener("input", (event) => {
  if (masterGain) masterGain.gain.value = Number(event.target.value) / 100;
});

renderPlaylists();
renderMoods();
renderRecommendations();
renderDownloads();
setTrack(state.currentTrack, false);
