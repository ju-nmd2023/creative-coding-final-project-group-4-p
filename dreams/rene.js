let ring;
let ringX, ringY;
let numRows, numCols;
const size = 20;
const divider = 18;
let t = 0.005;

let player;
let analyser;
let isPlaying = false;

let Winc = 0.1;
let WflowScale = 10;
let Wcols, Wrows;
let WzOffset = 0;
let Wparticles = [];
let WflowFieldVectors = [];
let newSizeX = 250;
let newSizeY = 250;

const grassBars = 2048;
<<<<<<< Updated upstream
<<<<<<< Updated upstream

//handpose
let video;
let handpose;
let predictions = [];
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes

// The following images were taken from a public domain work website https://www.cosmos.so/public-work/orb%201920s
function preload() {
  handpose = ml5.handPose(modelLoaded);
  ring = loadImage("assets/ring.png");
  flower1 = loadImage("assets/flower1.png");
  flower2 = loadImage("assets/flower2.png");
  flower3 = loadImage("assets/flower3.png");
}

function setup() {
  window._renderer = createCanvas(innerWidth, innerHeight);
  numRows = Math.floor(height / (2 * size));
  numCols = Math.floor(width / size);

  player = new Tone.Player("assets/okuku.mp3").toDestination();
  analyser = new Tone.Analyser("fft", 256);
  player.connect(analyser);
  ringX = width / 2;
  ringY = height / 1.3;

  playButton = createButton("Play");
  playButton.position(innerWidth / 2 - 30, innerHeight / 2 - 300);
  playButton.mousePressed(toggleAudio);

  video = createCapture(VIDEO, videoLoaded);
  video.size(640, 480);
  video.hide();

  drawSky();
  drawSkyGradient();
  setupStars();
}

// -------- HANDPOSE VOLUME LEFT HAND CONTROL ----------- //

// The following volume control function was coded with the help of Google Gemini 2.5 18/10/2025: https://gemini.google.com/share/08408638add5

function setVolumeFromHandDistance(predictions) {
  const leftHand = predictions.find((hand) => hand.handedness === "Left");

  if (leftHand && leftHand.keypoints) {
    const wrist = leftHand.keypoints.find((k) => k.name === "wrist");
    const middleFingerTip = leftHand.keypoints.find(
      (k) => k.name === "middle_finger_tip"
    );

    if (wrist && middleFingerTip) {
      const distance = dist(
        wrist.x,
        wrist.y,
        middleFingerTip.x,
        middleFingerTip.y
      );

      const MIN_DIST = 30;
      const MAX_DIST = 150;
      const MIN_VOLUME_DB = -40;
      const MAX_VOLUME_DB = 0;

      const newVolume = map(
        distance,
        MIN_DIST,
        MAX_DIST,
        MIN_VOLUME_DB,
        MAX_VOLUME_DB
      );

      const clampedVolume = constrain(newVolume, MIN_VOLUME_DB, MAX_VOLUME_DB);

      player.volume.value = clampedVolume;
    }
  }
}

function setSizeFromHandDistance(predictions) {
  const rightHand = predictions.find((hand) => hand.handedness === "Right");

  if (rightHand && rightHand.keypoints) {
    const wristRight = rightHand.keypoints.find((k) => k.name === "wrist");
    const middleFingerTipRight = rightHand.keypoints.find(
      (k) => k.name === "middle_finger_tip"
    );

    if (wristRight && middleFingerTipRight) {
      const distance = dist(
        wristRight.x,
        wristRight.y,
        middleFingerTipRight.x,
        middleFingerTipRight.y
      );

      const MIN_DIST = 30;
      const MAX_DIST = 150;
      const MIN_SIZE = 32;
      const MAX_SIZE = 256;

      newSizeX = map(distance, MIN_DIST, MAX_DIST, MIN_SIZE, MAX_SIZE);

      newSizeY = map(distance, MIN_DIST, MAX_DIST, MIN_SIZE, MAX_SIZE);
    }
  }
}

function videoLoaded() {
  console.log("Video loaded, starting handpose detection.");
  handpose.detectStart(video, getHandsData);
}
function modelLoaded() {
  console.log("Handpose Model Loaded!");
}

function getHandsData(results) {
  predictions = results;
}

function draw() {
  imageMode(CENTER);
  setSizeFromHandDistance(predictions);
  setVolumeFromHandDistance(predictions);

  drawStars();
  drawMountainLayer1();
  drawMountainLayer2();
  drawGrass2();
  drawGrass1();
  drawFlowers();
  drawRing();
  image(video, innerWidth / 2, 400, 320, 240);
}

function drawSky() {
  background(175, 220, 255);
  let size = 10;
  let divider = 10;
  let numRows = 200;
  let numCols = 200;

  let counter = 100;
  noStroke();

  for (let y = 0; y < numRows; y++) {
    fill(0, 180);
    for (let x = 0; x < numCols; x++) {
      ellipse(x * size, y * size, size);
      fill(8, 44, 79, 210);
      const value = noise(x / divider, y / divider) * size;
      ellipse(size / 2 + x * size, size / 2 + y * size, value);
    }
  }
  counter += 0.1;
}
function StarsParticle() {
  this.position = createVector(random(width), random(height));
  this.previousPosition = this.position.copy();
  this.velocity = createVector(0, 0);

  this.acceleration = createVector(0, 0);

  this.update = function () {
    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  };

  this.applyForce = function (force) {
    this.acceleration.add(force);
  };

  this.follow = function (vectors) {
    let x = floor(this.position.x / WflowScale);
    let y = floor(this.position.y / WflowScale);
    let index = x + y * Wcols;
    if (vectors[index]) this.applyForce(vectors[index]);
  };
  this.alpha = random(100, 255);

  this.show = function () {
    noStroke();
    fill(255, 255, 255, this.alpha);
    circle(this.position.x, this.position.y, random(1, 3));

    this.updatePreviousPosition();
  };

  this.updatePreviousPosition = function () {
    this.previousPosition.x = this.position.x;
    this.previousPosition.y = this.position.y;
  };
  this.edges = function () {
    if (this.position.x > width) {
      this.position.x = 0;
      this.updatePreviousPosition();
    }

    if (this.position.x < 0) {
      this.position.x = width;
      this.updatePreviousPosition();
    }

    if (this.position.y > height) {
      this.position.y = 0;
      this.updatePreviousPosition();
    }
    if (this.position.y < 0) {
      this.position.y = height;
      this.updatePreviousPosition();
    }
  };
}

function setupStars() {
  Wcols = floor(width / WflowScale);
  Wrows = floor(height / WflowScale);

  WflowFieldVectors = new Array(Wcols * Wrows);

  for (var i = 0; i < 50; i++) {
    Wparticles[i] = new StarsParticle();
  }
}

function drawStars() {
  noStroke();
  let WyOffset = 0;
  for (let y = 0; y < Wrows; y++) {
    let WxOffset = 0;
    for (let x = 0; x < Wcols; x++) {
      let index = x + y * Wcols;
      let angle = noise(WxOffset, WyOffset, WzOffset) * TWO_PI * 1.1;
      let v = p5.Vector.fromAngle(angle);

      v.setMag(3);
      WflowFieldVectors[index] = v;
      WxOffset += Winc;
      stroke(0, 50);
    }
    WyOffset += 0.05;
    WzOffset += 0.0009;
  }

  for (var i = 0; i < Wparticles.length; i++) {
    Wparticles[i].follow(WflowFieldVectors);
    Wparticles[i].update();
    Wparticles[i].edges();
    Wparticles[i].show();
  }
}

function drawMountainLayer1() {
  noStroke();
  fill(25, 50, 80);
  beginShape();
  let baseHeight = height * 0.35;

  for (let x = 0; x <= width; x++) {
    let y = baseHeight + noise(x * 0.008, t) * 200;
    vertex(x, y);
  }

  vertex(width, 0);
  vertex(0, 0);
  endShape(CLOSE);
}
function drawMountainLayer2() {
  noStroke();
  fill(50, 80, 120);
  beginShape();
  let baseHeight = height * 0.18;

  for (let x = 0; x <= width; x++) {
    let y = baseHeight + noise(x * 0.01, t) * 200;
    vertex(x, y);
  }

  vertex(width, 0);
  vertex(0, 0);
  endShape(CLOSE);
}

// Utilized the same audio functionality as disco.js
// Got help from chatGPT to fix issues with bar width display of grass https://chatgpt.com/share/68f3c23e-253c-8009-b1b9-7f367017f9fb

function drawGrass1() {
  let spectrum = analyser.getValue();
  let barWidth = (width / spectrum.length) * 2.1;

  noStroke();
  fill(92, 124, 57, 180);
  for (let i = 0; i < spectrum.length; i++) {
    let audioLevel = map(spectrum[i], -100, 0, 10, height / 2);
    rect(i * barWidth * 0.85, 0, barWidth, audioLevel);
  }
}

function drawGrass2() {
  let spectrum = analyser.getValue();
  let barWidth = (width / spectrum.length) * 2.4;

  noStroke();
  fill(60, 90, 35, 150);
  for (let i = 0; i < spectrum.length; i++) {
    let audioLevel = map(spectrum[i], -100, 0, 10, height / 3);
    rect(i * barWidth * 0.8, 0, barWidth, audioLevel);
  }
}

// referenced ChatGPT for the structure of the flipped flowers and their for loop https://chatgpt.com/share/68f3bdd3-f3f4-8009-b353-bc8125bd6d17
function drawFlowers() {
  let totalFlowers = 12;
  let flowerImages = [flower1, flower2, flower3];
  let spacing = width / totalFlowers;
  let yPos = height * 0.05;

  imageMode(CENTER);

  for (let i = 0; i < totalFlowers; i++) {
    let xPos = spacing / 2 + i * spacing;
    let img = flowerImages[i % flowerImages.length];
    push();
    translate(xPos, yPos);
    scale(1, -1);
    image(img, 0, 0, 100, 140);
    pop();
  }
}

function toggleAudio() {
  if (!isPlaying) {
    player.start();
    playButton.html("Pause");
    isPlaying = true;
  } else {
    player.stop();
    playButton.html("Play");
    isPlaying = false;
  }
}

function drawRing() {
  imageMode(CENTER);
  push();
  translate(ringX, ringY);
  scale(1, -1);
  image(ring, 0, 0, newSizeX, newSizeY);
  pop();
}

function drawSkyGradient() {
  noFill();
  for (let y = 0; y < height; y++) {
    let inter = map(y, 0, height, 0, 1);
    let c = lerpColor(color(0, 60, 120, 70), color(175, 220, 255, 220), inter);
    stroke(c);
    line(0, y, width, y);
  }
}
