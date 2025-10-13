let numRows, numCols;
const size = 6.5;
const divider = 10;

let t = 0.005;
let t2 = 0.0015;

let analyser;
let player;
let isPlaying = false;
let playButton;

let boat;
let boatX, boatY;

function preload() {
  boat = loadImage("assets/boat.png");
}

function setup() {
  window._renderer = createCanvas(innerWidth, innerHeight);
  noStroke();
  frameRate(30);

  numRows = Math.floor(height / (2 * size));
  numCols = Math.floor(width / size);

  player = new Tone.Player("assets/jumbo.mp3").toDestination();
  analyser = new Tone.Analyser("fft", 4096);
  player.connect(analyser);

  playButton = createButton("Play audio");
  playButton.position(20, 20);
  playButton.mousePressed(toggleAudio);

  boatX = width / 2;
  boatY = height / 2;
}
// AUDIO
async function toggleAudio() {
  await Tone.start();

  if (!isPlaying) {
    player.start();
    playButton.html("Pause");
    isPlaying = true;
  } else {
    player.stop();
    playButton.html("Play audio");
    isPlaying = false;
  }
}

function draw() {
  background(10, 15, 25);
  let frequencyValues = analyser.getValue();
  let waveAmplitude = 0;
  if (frequencyValues && frequencyValues.length > 0) {
    for (let i = 0; i < 32; i++) {
      waveAmplitude += frequencyValues[i];
    }
    waveAmplitude /= 32;
    waveAmplitude = map(waveAmplitude, -120, -30, 0, 150, true);
  }

  drawSky();
  drawWaveBase(waveAmplitude);

  drawFirstLayer(waveAmplitude);
  drawSecondLayer(waveAmplitude);

  t += 0.01;
  t2 += 0.03;

  //boat
  let col = Math.floor(boatX / size);
  let topRows = 3;
  let sumY = 0;

  for (let y = 0; y < topRows; y++) {
    let depth = map(y, 0, numRows, 1, 0);
    let waveY = y * size + sin(t + col * 0.1) * waveAmplitude * 0.3 * depth;
    sumY += waveY;
  }

  let avgWaveY = sumY / topRows;
  boatY = height / 2 + avgWaveY;
  imageMode(CENTER);
  image(boat, boatX, boatY, 100, 100);
}

// Ocean drawing, two layers
function drawFirstLayer(amplitude) {
  fill(30, 70, 160, 220);
  for (let y = 0; y < numRows; y++) {
    let depth = map(y, 0, numRows, 1, 0);

    for (let x = 0; x < numCols; x++) {
      let angle = noise(x / divider, y / divider, t) * TWO_PI * 0.5;
      let dx = cos(angle) * size * 0.5;
      let dy = sin(angle) * size * 0.5;

      let waveY = y * size + sin(t + x * 0.1) * amplitude * 0.3 * depth;
      //let yOffset = y * size + sin(t + x * 0.1) * amplitude * 0.3;
      ellipse(x * size + dx, waveY + dy + height / 2, size * 0.8);
    }
  }
}

function drawSecondLayer(amplitude) {
  noStroke();

  for (let y = 0; y < numRows; y++) {
    let depth = map(y, 0, numRows, 1, 0);

    let brightness = map(depth, 0, 1, 50, 255);
    fill(0, 150 + brightness * 0.2, 255, 160 * depth + 50);

    for (let x = 0; x < numCols; x++) {
      let angle = noise(x / divider, y / divider, t2) * TWO_PI * 1.2;
      let dx = cos(angle) * size * 0.5;
      let dy = sin(angle) * size * 0.5;
      let waveY = y * size + cos(t2 + x * 0.1) * amplitude * 0.2 * depth;

      //let yOffset = y * size + cos(t2 + x * 0.1) * amplitude * 0.2;
      ellipse(x * size + dx, waveY + dy + height / 2, size * 0.8);
    }
  }
}

//Perlin Noise Sky
function drawSky() {
  background(175, 220, 255);
  let size = 10;
  let divider = 10;
  let numRows = 200;
  let numCols = 200;

  let counter = 100;
  //background(255, 255, 255);
  noStroke();

  for (let y = 0; y < numRows; y++) {
    fill(180, 210, 255, 180);
    for (let x = 0; x < numCols; x++) {
      ellipse(x * size, y * size, size);
      fill(130, 170, 230, 210);
      const value = noise(x / divider, y / divider) * size;
      ellipse(size / 2 + x * size, size / 2 + y * size, value);
    }
  }
  counter += 0.1;
}

//base so waves dont blend with background
function drawWaveBase(amplitude) {
  fill(25, 50, 80);
  noStroke();

  for (let y = 0; y < numRows; y++) {
    let depth = map(y, 0, numRows, 1, 0);

    beginShape();
    for (let x = 0; x < numCols; x++) {
      let angle = noise(x / divider, y / divider, t) * TWO_PI * 0.5;
      let dx = cos(angle) * size * 0.5;
      let dy = sin(angle) * size * 0.5;

      let waveY = y * size + sin(t + x * 0.1) * amplitude * 0.3 * depth;

      vertex(x * size + dx, waveY + dy + height / 2);
    }
    vertex(width, height);
    vertex(0, height);
    endShape(CLOSE);
  }
}
