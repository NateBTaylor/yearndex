const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxhkOZilew9VzeX8f-YhRz2XlgNZwsDB2SCogL4V-fNFu8TSPqn9Gtcjt91Re_N-Mva/exec";

const loadingEl = document.getElementById('loading');

async function fetchSongs() {
    loadingEl.style.display = 'block';
    try {
        const res = await fetch(SCRIPT_URL);
        const data = await res.json();
        songs = data;
        renderSongs();
    } catch (err) {
        loadingEl.textContent = 'Failed to load songs. Try again later.';
    } finally {
        loadingEl.style.display = 'none';
    }
}

function renderSongs(animated=true) {
  const container = document.getElementById("songs-list");

    // Keep previous positions for animation
  const oldPositions = {};
  if (animated) {
    container.querySelectorAll(".song").forEach(el => {
      oldPositions[el.id] = el.getBoundingClientRect().top;
    });
  }

  container.innerHTML = "";

  // sort by votes descending
  songs.sort((a, b) => b.votes - a.votes);

  songs.forEach((song, index) => {
    const songDiv = document.createElement("div");
    songDiv.classList.add("song");
    songDiv.id = song.id;

    const rankHTML = index < 3 ? `<span class="top-three">${index + 1}</span>` : `<span>${index + 1}</span>`;

    songDiv.innerHTML = `
      <div class="song-left">
        <div class="song-title">${rankHTML}. ${song.name}</div>
        <div class="song-artist">${song.artist}</div>
      </div>
      <div class="vote-controls song-right" style="position:relative">
        <button onclick="vote('${song.id}', 1)">▲</button>
        <span class="vote-count">${song.votes}</span>
        <button onclick="vote('${song.id}', -1)">▼</button>
      </div>
    `;
    container.appendChild(songDiv);
  });

  if (animated) {
    const newPositions = {};
    container.querySelectorAll(".song").forEach(el => {
        newPositions[el.id] = el.getBoundingClientRect().top;
    });

    container.querySelectorAll(".song").forEach(el => {
        const id = el.id;
        const oldTop = oldPositions[id];
        const newTop = newPositions[id];
        if (oldTop !== undefined && oldTop !== newTop) {
        const delta = oldTop - newTop;
        el.style.transform = `translateY(${delta}px)`;
        el.classList.add("moving");
        requestAnimationFrame(() => {
            el.style.transform = "";
        });
        el.addEventListener("transitionend", () => el.classList.remove("moving"), { once: true });
        }
    });
  }
}


async function vote(id, value) {
    const votedSongs = JSON.parse(localStorage.getItem("votedSongs") || "{}");
    if (votedSongs[id]) {
        alert("You already voted on this song!");
        return;
    }

    // Optimistic UI update
    const song = songs.find(s => s.id === id);
    if (!song) return;
    song.votes += value;

    votedSongs[id] = true;
    localStorage.setItem("votedSongs", JSON.stringify(votedSongs));

    renderSongs();  // update display instantly

    // Send vote to backend asynchronously
    try {
        fetch(SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "vote", id, value })
        })
    } catch (err) {
        console.error("Vote error:", err);
    }
}


// Add new song
async function addSong(name, artist) {
  if (!name || !artist) {
    alert("Please fill in all inputs");
    return;
  }

  const duplicate = songs.find(
    s =>
      s.name.toLowerCase() === name.toLowerCase() &&
      s.artist.toLowerCase() === artist.toLowerCase()
  );

  if (duplicate) {
    alert("That song is already in The Yearndex.");
    return;
  }


  // optimistic UI: create a placeholder song object
  const newId = `temp-${Date.now()}`;
  const newSong = { id: newId, name, votes: 0, artist };
  songs.push(newSong);
  renderSongs();

  const response = await fetch(SCRIPT_URL, {  // Replace with your Apps Script URL
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "addSong", name, artist }),
    });
    fetchSongs()
}

// Event listener for adding song
document.getElementById("submit-song").addEventListener("click", () => {
  const songName = document.getElementById("new-song").value.trim();
  const songArtist = document.getElementById("new-artist").value.trim();
  addSong(songName, songArtist);
  document.getElementById("new-song").value = "";
  document.getElementById("new-artist").value = "";
});


const randomButton = document.getElementById("random-button");

randomButton.addEventListener("click", () => {
  if (!songs || songs.length === 0) return;

  // Pick a random song
  const randomIndex = Math.floor(Math.random() * songs.length);
  const song = songs[randomIndex];

  // Smooth scroll to it
  const songElement = document.getElementById(song.id);
  if (songElement) {
    songElement.classList.add("highlight");
    songElement.scrollIntoView({ behavior: "smooth", block: "center" });

    // Subtle flash highlight
    setTimeout(() => {
      songElement.classList.remove("highlight");
    }, 2000);
  }
});

// Call fetchSongs on page load
fetchSongs();