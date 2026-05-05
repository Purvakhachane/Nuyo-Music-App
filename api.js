export const tracks = [
  {
    id: 1,
    title: "Electric Bloom",
    artist: "Nova Vale",
    mood: "Focus",
    duration: 222,
    tempo: 92,
    root: 246.94,
    wave: "sawtooth",
    color: "linear-gradient(135deg, #4fd283, #2457ff 52%, #101114)",
  },
  {
    id: 2,
    title: "Midnight Signal",
    artist: "Rhea Stone",
    mood: "Late Night",
    duration: 198,
    tempo: 76,
    root: 220,
    wave: "triangle",
    color: "linear-gradient(135deg, #ff6f91, #293241 54%, #090a0d)",
  },
  {
    id: 3,
    title: "Sunset Arcade",
    artist: "Kaito Lane",
    mood: "Energy",
    duration: 214,
    tempo: 128,
    root: 261.63,
    wave: "square",
    color: "linear-gradient(135deg, #ffc857, #fb5607 50%, #1d1410)",
  },
  {
    id: 4,
    title: "Glass Rivers",
    artist: "Mira Sol",
    mood: "Chill",
    duration: 246,
    tempo: 84,
    root: 196,
    wave: "sine",
    color: "linear-gradient(135deg, #49c8c4, #6aa8ff 55%, #111419)",
  },
  {
    id: 5,
    title: "Paper Moons",
    artist: "The Satellites",
    mood: "Indie",
    duration: 205,
    tempo: 104,
    root: 293.66,
    wave: "triangle",
    color: "linear-gradient(135deg, #f4f5f7, #ff8fab 48%, #263238)",
  },
  {
    id: 6,
    title: "Citylight Fever",
    artist: "AM Harbor",
    mood: "Energy",
    duration: 233,
    tempo: 118,
    root: 329.63,
    wave: "sawtooth",
    color: "linear-gradient(135deg, #e9c46a, #e76f51 48%, #121212)",
  },
  {
    id: 7,
    title: "Soft Static",
    artist: "Juniper Sky",
    mood: "Chill",
    duration: 181,
    tempo: 72,
    root: 174.61,
    wave: "sine",
    color: "linear-gradient(135deg, #8ecae6, #bde0fe 50%, #20242b)",
  },
  {
    id: 8,
    title: "North Star Drive",
    artist: "Owen Hart",
    mood: "Focus",
    duration: 259,
    tempo: 96,
    root: 233.08,
    wave: "triangle",
    color: "linear-gradient(135deg, #2dd4bf, #0f766e 50%, #071513)",
  },
];

export const playlists = [
  { name: "Daily Mix", color: "#4fd283", ids: [1, 4, 8, 2] },
  { name: "Road Lights", color: "#ffc857", ids: [3, 6, 2, 5] },
  { name: "Deep Work", color: "#6aa8ff", ids: [8, 1, 7, 4] },
  { name: "After Hours", color: "#ff6f91", ids: [2, 7, 5, 4] },
];

export function getTrackById(id) {
  return tracks.find((track) => track.id === Number(id));
}

export function getPlaylistTracks(name) {
  const playlist = playlists.find((item) => item.name === name);
  return playlist ? playlist.ids.map(getTrackById).filter(Boolean) : [];
}
