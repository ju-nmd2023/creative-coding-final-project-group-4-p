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

//handpose
let video;
let handpose;
let predictions = [];
let newAlpha = 100;

function preload() {
  handpose = ml5.handPose(modelLoaded);
  boat = loadImage("assets/monetBoat.png");
  wave = loadImage("assets/wave.png");
  wave2 = loadImage("assets/wavedarker.png");
  blueStroke = loadImage("assets/blueStroke.png");
  darkerStroke = loadImage("assets/darkerStroke.png")
  lighterStroke = loadImage ("assets/lighterStroke.png")
  darkestStroke = loadImage ("assets/darkestStroke.png");
  sun = loadImage ("assets/sunStroke.png");
  oceanBase = loadImage("assets/monetOcean.png");

}

function setup() {
  window._renderer = createCanvas(innerWidth, innerHeight);
  noStroke();
  frameRate(30);

  video = createCapture(VIDEO, videoLoaded);
  video.size(640,480);
  video.hide();

  numRows = Math.floor(height / (2 * size));
  numCols = Math.floor(width / size);

  player = new Tone.Player("assets/jumbo.mp3").toDestination();
  player.loop = true;
  analyser = new Tone.Analyser("fft", 4096);
  player.connect(analyser);

  playButton = createButton("Play");
  playButton.position(innerWidth / 2 - 30, innerHeight / 2 - 300);
  playButton.mousePressed(toggleAudio);

  boatX = width / 2;
  boatY = height / 2;
  baseOceanY = height;
  drawSky();
  setupWind();
}
// AUDIO
function toggleAudio() {
   Tone.start();

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

//handpose + troubleshooting
function videoLoaded(){
  console.log("Video loaded, starting handpose detection");
  handpose.detectStart(video, getHandsData);
}
function modelLoaded(){
  console.log("Handpose model loaded!");
}

function getHandsData(results){
  predictions = results;
}

// -------- HANDPOSE VOLUME LEFT HAND CONTROL ----------- //

// The following volume control function was coded with the help of Google Gemini 2.5 18/10/2025: https://gemini.google.com/share/08408638add5

function setVolumeFromHandDistance(predictions) {

  const leftHand = predictions.find(
    (hand) => hand.handedness === "Left"
  );

  if (leftHand && leftHand.keypoints) {
    const wrist = leftHand.keypoints.find(k => k.name === 'wrist');
    const middleFingerTip = leftHand.keypoints.find(k => k.name === 'middle_finger_tip');

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


      const clampedVolume = constrain(
        newVolume,
        MIN_VOLUME_DB,
        MAX_VOLUME_DB
      );


      player.volume.value = clampedVolume;

    
      
    }
  }
}

function setAlphaFromHandDistance(predictions) {

   const rightHand = predictions.find(
     (hand) => hand.handedness === "Right"
   );

   if (rightHand && rightHand.keypoints) {
     const wristRight = rightHand.keypoints.find(k => k.name === 'wrist');
     const middleFingerTipRight = rightHand.keypoints.find(k => k.name === 'middle_finger_tip');

     if (wristRight && middleFingerTipRight) {
       const distance = dist(
         wristRight.x,
         wristRight.y,
         middleFingerTipRight.x,
         middleFingerTipRight.y
       );

       const MIN_DIST = 30;  
       const MAX_DIST = 150; 
       const MIN_ALPHA = 20; 
       const MAX_ALPHA = 100; 


       newAlpha = map(
         distance,
         MIN_DIST,
         MAX_DIST,
         MIN_ALPHA,
         MAX_ALPHA
       );


    
      
     }
  }
 }



//reference for wave drawing technique to vertically stack waves reactive to sound
// https://chatgpt.com/share/68f2c584-7a38-8009-a97e-4711ef4612b7

function draw() {
  // Clear the background and draw the sky first
  setAlphaFromHandDistance(predictions);
  drawSky(); 
  // Audio analysis
  let value = analyser.getValue();
  let waveAmplitude = 0; // Initialize waveAmplitude

  // First layer of 'waves'
  push();
  
  const visibleBars = 12; 
  let barWidth = width / visibleBars; 

  setVolumeFromHandDistance(predictions);

  image(oceanBase,0,600, 1260, 867);
  image(oceanBase,850,600,1260, 867);

  image(video, innerWidth/2, 300, 320, 240);


  
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
  tint(255,255,255, newAlpha);
  image(sun, 10, 10);
  noTint();

  imageMode(CENTER);
  image(boat, boatX, boatY, 375, 281.5);
  
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
