let currentScript;
document.addEventListener(
  "click",
  async () => {
    if (Tone.context.state !== "running") {
      await Tone.start();
      console.log("AudioContext started after user click");
    }
  },
  { once: true }
);

document.addEventListener("DOMContentLoaded", async () => {
  const sleepButton = document.getElementById("sleepButton");
  const intro = document.getElementById("intro");
  const dreamsSection = document.getElementById("dreams");
  const dreamButtons = document.getElementById("dreamButtons");

  // Load dream list
  const dreams = await fetch("data.json").then((r) => r.json());

  // On wake up
  sleepButton.addEventListener("click", () => {
    intro.classList.add("hidden");
    dreamsSection.classList.remove("hidden");

    dreams.forEach((dream, index) => {
      const btn = document.createElement("button");
      btn.textContent = dream.name.replace("I dreamt I was a ", "");
      btn.classList.add("dream-btn");
      btn.addEventListener("click", () => loadDream(dream));
      dreamButtons.appendChild(btn);
    });
  });
});

async function loadDream(dream) {
  console.log("Loading dream:", dream.file);

  // Stop any existing Tone playback
  Tone.Transport.stop();

  // Clear old p5 instance (if any)
  if (window._renderer) {
    window._renderer.remove();
  }

  // Remove old dream script
  if (currentScript) {
    currentScript.remove();
  }

  // Update text info
  document.getElementById("dreamName").textContent = dream.name;
  document.getElementById("dreamDescription").textContent =
    dream.description || "";

  // Load the new dream script dynamically
  currentScript = document.createElement("script");
  currentScript.src = dream.file;
  currentScript.onload = () => {
    if (dream.file.includes("ocean.js") && window.initOceanDream) {
      window.initOceanDream();
    }
  };
  document.body.appendChild(currentScript);
}
