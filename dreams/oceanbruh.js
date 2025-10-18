console.log("ocean loaded!");

let numRows, numCols;
const size = 20;
const divider = 18;

let t = 0.005;
let t2 = 0.0015;

let analyser;
let player;
let isPlaying = false;
let playButton;

let boat;
let boatX, boatY;

const numWaveRows = 10;
const rowHeight = 30;
let baseOceanY;
const maxWaveOffset = 50;

//wind
let Winc = 0.1;
let WflowScale = 10;
let Wcols, Wrows;
let WzOffset = 0;
let Wparticles = [];
let WflowFieldVectors = [];

let wave;
let wave2;

function preload() {
  boat = loadImage("assets/boat.png");
  wave = loadImage("assets/wave.png");
  wave2 = loadImage("assets/wavedarker.png");
  blueStroke = loadImage("assets/blueStroke.png");
  darkerStroke = loadImage("assets/darkerStroke.png")
  lighterStroke = loadImage ("assets/lighterStroke.png")
  darkestStroke = loadImage ("assets/darkestStroke.png");
  sun = loadImage ("assets/sunStroke.png");

}

function setup() {
  window._renderer = createCanvas(innerWidth, innerHeight);
  noStroke();
  frameRate(30);

  numRows = Math.floor(height / (2 * size));
  numCols = Math.floor(width / size);

  player = new Tone.Player("assets/jumbo.mp3").toDestination();
  player.loop = true;
  analyser = new Tone.Analyser("fft", 4096);
  player.connect(analyser);

  playButton = createButton("Play audio");
  playButton.position(20, 20);
  playButton.mousePressed(toggleAudio);

  boatX = width / 2;
  boatY = height / 2;
  baseOceanY = height;
  drawSky();
  setupWind();
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
//reference for wave drawing technique to vertically stack waves reactive to sound
// https://chatgpt.com/share/68f2c584-7a38-8009-a97e-4711ef4612b7
function draw() {
  // Clear the background and draw the sky first
  image(sun, 10, 10);
  drawSky(); 
  drawWaveBase();
  // Audio analysis
  let value = analyser.getValue();
  let waveAmplitude = 0; // Initialize waveAmplitude

  // First layer of 'waves'
  push();
  
  const visibleBars = 12; 
  let barWidth = width / visibleBars; 
  
  for (let i = 0; i < visibleBars; i++) {
    let v = map(value[i], -200, 0, 0, height / 2);
    
    // Sum bar heights (optional, kept for future use)
    waveAmplitude += v; 

    image(
      blueStroke,
      i * barWidth,
      height - v - 100, 
      barWidth, 
      v
    );
  }
  pop();
  
  // Second layer of 'waves' (slightly offset)
  push();
  
  for (let k = 0; k < visibleBars; k++) {
    let waveOffset = 70;
    let v = map(value[k], -200, 0, 0, height / 2);

    image(
      darkerStroke, 
      (k * barWidth) + waveOffset ,
      height - v, 
      barWidth, 
      v 
    );
  }
  pop();
  
  // Third layer of 'waves' (slightly offset)
  push();
  
  for (let g = 0; g < visibleBars; g++) {
    let v = map(value[g], -200, 0, 0, height / 2);
    let waveOffset = -70;
    image(
      lighterStroke,
      (g * barWidth) + waveOffset,
      height - v + 100, 
      barWidth, 
      v 
    );
  }
  pop();
  push();
  
  for (let b = 0; b < visibleBars; b++) {
    let v = map(value[b], -200, 0, 0, height / 2);
    let waveOffset = 70;
    image(
      darkestStroke,
      (b * barWidth) + waveOffset,
      height - v +200, 
      barWidth, 
      v 
    );
  }
  pop();

  

  drawWind();

  t += 0.03;
  t2 += 0.005;

  imageMode(CENTER);
  image(boat, boatX, boatY, 100, 100);
}

function drawSky() {
  //background(175, 220, 255);
  let size = 10;
  let divider = 10;
  let numRows = 200;
  let numCols = 200;

  let counter = 100;
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

function drawWaveBase() {
   fill(50, 80, 100);
   noStroke();

   let totalHeight = numWaveRows * rowHeight;
   rect(0, baseOceanY - totalHeight, width, height);
 }

// Ocean drawing, two layers

//Perlin Noise Sky

//base so waves dont blend with background

// WIND

function WindParticle() {
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
    let force = vectors[index];
    this.applyForce(force);
  };

  this.show = function () {
    stroke(255, 80);
    this.maxSpeed = random(13, 19);
    strokeWeight(1.5);
    line(
      this.position.x,
      this.position.y,
      this.previousPosition.x * 2,
      this.previousPosition.y * 2
    );
    //point(this.pos.x, this.pos.y);
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

function setupWind() {
  Wcols = floor(width / WflowScale);
  Wrows = floor(height / WflowScale);

  WflowFieldVectors = new Array(Wcols * Wrows);

  for (var i = 0; i < 250; i++) {
    Wparticles[i] = new WindParticle();
  }
}

function drawWind() {
  //noStroke();
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
