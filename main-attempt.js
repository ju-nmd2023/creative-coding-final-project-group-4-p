let currentDreamScript = null;

document.getElementById("go-to-sleep").addEventListener("click", () => {
  document.getElementById("dream-buttons").style.display = "block";
});

document.querySelectorAll("#dream-buttons button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const dream = btn.dataset.dream;
    loadDream(dream);
  });
});

function loadDream(dreamName) {
  // Hide main page
  document.getElementById("main-page").style.display = "none";

  // Remove previous dream script
  if (currentDreamScript) {
    currentDreamScript.remove();
  }

  // Load dream script
  const script = document.createElement("script");
  script.src = `dreams/${dreamName}.js`;
  script.id = "dream-script";
  document.body.appendChild(script);
  currentDreamScript = script;
}

// Function to return to main page
function wakeUp() {
  // Remove dream canvas
  if (window._renderer) remove(); // p5.js canvas remove
  if (currentDreamScript) currentDreamScript.remove();

  // Show main page again
  document.getElementById("main-page").style.display = "block";
  document.getElementById("dream-buttons").style.display = "none";
}
