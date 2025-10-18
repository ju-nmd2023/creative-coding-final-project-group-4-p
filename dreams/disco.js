console.log("disco loaded!");
function preload() {
  handpose = ml5.handPose(modelLoaded);
  handImage = loadImage("assets/concertgoer.png");
  handImageTwo = loadImage("assets/concertgoerYellow.png");
  microphoneImage = loadImage("assets/microphoneCyanMag.png");
}

function setup() {
  window._renderer = createCanvas(innerWidth, innerHeight);
  frameRate(30);
  field = generateField();
  generateAgents();
  background(255, 255, 0);

  video = createCapture(VIDEO, videoLoaded);
  video.size(640, 480);
  video.hide();

  player = new Tone.Player("assets/popstar.mp3").toDestination();
  analyser = new Tone.Analyser("fft", 4096);

  player.connect(analyser);
  playButton = createButton("Play");
  playButton.position(innerWidth / 2, innerHeight / 2 - 300);
  playButton.mousePressed(toggleAudio);
  fogButton = createButton("Fog Machine");
  fogButton.position(innerWidth / 2, innerHeight / 2 - 100);
  fogButton.mousePressed(toggleFog);

  noiseBuffer = createGraphics(innerWidth, innerHeight);
}

let video;
let handpose;
let predictions = [];

let noiseBuffer;

const size = 10;
const divider = 20;
const numRows = 100;
const numCols = 150;
const layers = 50;
const sizeSquares = 120;
let hasDrawnSquares = false;
let counter = 0;
newSizeX = 265;
newSizeY = 235;

let bufferRedrawInterval = 6; // Redraw buffer every 6 frames (30fps / 6 = 5 times per second)
let frameCountForBuffer = 0;

const fieldSize = 50;
const maxCols = Math.ceil(innerWidth / fieldSize);
const maxRows = Math.ceil(innerHeight / fieldSize);
let field;
let agents = [];
let fogMachineOn = false;

let player;
let analyser;
let isPlaying = false;
let playButton;

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

// ---- VERA MOLNAR STAGE ----- //
function getRandomValue(pos, variance) {
  return pos + random(-variance, variance);
}

function drawLayers(x, y, size, layers) {
  noFill();
  stroke(0, 0, 0);
  const variance = size / 20;

  for (let i = 0; i < layers; i++) {
    const s = (size / layers) * i;
    const half = s / 2;

    beginShape();
    vertex(
      getRandomValue(x - half, variance),
      getRandomValue(y - half, variance)
    );
    vertex(
      getRandomValue(x + half, variance),
      getRandomValue(y - half, variance)
    );
    vertex(
      getRandomValue(x + half, variance),
      getRandomValue(y + half, variance)
    );
    vertex(
      getRandomValue(x - half, variance),
      getRandomValue(y + half, variance)
    );
    endShape(CLOSE);
  }
}

function drawStage() {
  push();
  translate(0, 600);
  randomSeed(1);
  for (let y = 0; y < 2; y++) {
    for (let x = 0; x < 12; x++) {
      drawLayers(
        sizeSquares / 2 + x * sizeSquares,
        sizeSquares / 2 + y * sizeSquares,
        sizeSquares,
        layers
      );
    }
  }
  pop();
}

// ------ NOISE BACKGROUND -------- //

function drawNoiseToBuffer() {
  noiseBuffer.noStroke();
  
  // Layer 1: Base rectangles (228, 189, 161 is close to your fill(228, 189, 161) in draw())
  noiseBuffer.push();
  noiseBuffer.fill(228, 189, 161);
  for (let y = 0; y < numRows; y++) {
    for (let x = 0; x < numCols; x++) {
      const value = noise(x / divider, y / divider) * size;
      noiseBuffer.rect(size / 2 + x * size, size / 2 + y * size, value);
    }
  }
  noiseBuffer.pop();

  // Layer 2: Pink ellipses
  noiseBuffer.push();
  noiseBuffer.fill(222, 61, 131);
  for (let y = 0; y < numRows; y++) {
    for (let x = 0; x < numCols; x++) {
      const value = noise(x / divider, y / divider) * size;
      noiseBuffer.ellipse(size / 4 + x * size, size / 4 + y * size, value * 2);
    }
  }
  noiseBuffer.pop();

  // Layer 3: Cyan rectangles
  noiseBuffer.push();
  noiseBuffer.fill(0, 184, 184);
  for (let y = 0; y < numRows; y++) {
    for (let x = 0; x < numCols; x++) {
      const value = noise(x / divider, y / divider) * size;
      noiseBuffer.rect(size / 16 + x * size, size / 16 + y * size, value);
    }
  }
  noiseBuffer.pop();

  // Layer 4: Light blue ellipses
  noiseBuffer.push();
  noiseBuffer.fill(168, 211, 227);
  for (let y = 0; y < numRows; y++) {
    for (let x = 0; x < numCols; x++) {
      const value = noise(x / divider, y / divider) * size + 2;
      noiseBuffer.ellipse(size / 132 + x * size, size / 132 + y * size, value);
    }
  }
  noiseBuffer.pop();

  counter += 0.02;
}

// -------- FOG MACHINE FLOW FIELD -----------//

function toggleFog() {
  fogMachineOn = !fogMachineOn;
}

class Agent {
  constructor(x, y, maxSpeed, maxForce) {
    this.position = createVector(x, y);
    this.lastPosition = createVector(x, y);
    this.acceleration = createVector(0, 0);
    this.velocity = createVector(0, 0);
    this.maxSpeed = maxSpeed;
    this.maxForce = maxForce;
  }

  follow(desiredDirection) {
    desiredDirection = desiredDirection.copy();
    desiredDirection.mult(this.maxSpeed);
    let steer = p5.Vector.sub(desiredDirection, this.velocity);
    steer.limit(this.maxForce);
    this.applyForce(steer);
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    this.lastPosition = this.position.copy();

    this.velocity.add(this.acceleration);
    this.velocity.limit(this.maxSpeed);
    this.position.add(this.velocity);
    this.acceleration.mult(0);
  }

  checkBorders() {
    if (this.position.x < 0) {
      this.position.x = innerWidth;
      this.lastPosition.x = innerWidth;
    } else if (this.position.x > innerWidth) {
      this.position.x = 0;
      this.lastPosition.x = 0;
    }
    if (this.position.y < 0) {
      this.position.y = innerHeight;
      this.lastPosition.y = innerHeight;
    } else if (this.position.y > innerHeight) {
      this.position.y = 0;
      this.lastPosition.y = 0;
    }
  }

  draw() {
    push();
    stroke(255, 255, 255, 10);
    strokeWeight(50);
    line(
      this.lastPosition.x,
      this.lastPosition.y,
      this.position.x,
      this.position.y
    );
    pop();
  }
}

function generateField() {
  let field = [];
  noiseSeed(Math.random() * 100);
  for (let x = 0; x < maxCols; x++) {
    field.push([]);
    for (let y = 0; y < maxRows; y++) {
      const value = noise(x / divider, y / divider) * Math.PI * 2;
      field[x].push(p5.Vector.fromAngle(value));
    }
  }
  return field;
}

function generateAgents() {
  for (let i = 0; i < 200; i++) {
    let agent = new Agent(
      Math.random() * innerWidth,
      Math.random() * innerHeight,
      4,
      0.1
    );
    agents.push(agent);
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

function setSizeFromHandDistance(predictions) {

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
       const MIN_SIZE = 32; 
       const MAX_SIZE = 256; 


       newSizeX = map(
         distance,
         MIN_DIST,
         MAX_DIST,
         MIN_SIZE,
         MAX_SIZE
       );

       newSizeY = map(
        distance,
        MIN_DIST,
        MAX_DIST,
        MIN_SIZE,
        MAX_SIZE
      );

    
      
     }
  }
 }


let hasDrawnNoise = false;

function draw() {
  noStroke();
  push();
  fill(228, 189, 161);

  if (frameCountForBuffer % bufferRedrawInterval === 0) {
    drawNoiseToBuffer();
  }
  
  // Display the buffer in every frame
  image(noiseBuffer, 0, 0); 
  
  // Increment the counter for the buffer check
  frameCountForBuffer++;

  //image(noiseBuffer, 0, 0);

  drawStage();

  let textX = innerWidth / 8;
  let textY = innerHeight / 8;
  let offsetText = textWidth("I DREAMT I WAS A ") + 5;
  stroke(90);
  textSize(50);
  push();
  fill(255, 255, 255);
  text("I DREAMT I WAS A", textX, textY);
  pop();

  setSizeFromHandDistance(predictions);
  image(microphoneImage, innerWidth / 2 + 200, 450, newSizeX,newSizeY);



    //The following color changing code was done with the help of ChatGPT https://chatgpt.com/s/t_68dd9816de84819191fdb89c0ed53a7d

  let colorNoise = noise(counter * 0.5);
  let anyoneColor = map(colorNoise, 0, 1, 0, 255);
  fill(anyoneColor);
  text("POPSTAR!", textX + offsetText, textY);
  counter += 0.02;

  image(video, innerWidth / 4 + 200, 300, 320, 240);
  setVolumeFromHandDistance(predictions);

  

    let value = analyser.getValue();
    push();
    fill(74, 74, 74, 255);

    
    const visibleBars = 12; 
   

    
    let barWidth = width / visibleBars;

    
    for (let i = 0; i < visibleBars; i++) {
      let v = map(value[i], -200, 0, 0, height / 2);

      image(
        handImage,
        i * barWidth,
        height - v - 100, 
        barWidth, 
        v
      );
    }
    pop();
    push();
    fill(54, 54, 54, 255);
    for (let k = 0; k < visibleBars; k++) {
      let v = map(value[k], -200, 0, 0, height / 2);

      image(
        handImageTwo,
        k * barWidth,
        height - v, 
        barWidth, 
        v 
      );
    }
    pop();

    if (fogMachineOn) {
      for (let agent of agents) {
        push();
        noStroke();
        const x = Math.min(
          Math.floor(agent.position.x / fieldSize),
          maxCols - 1
        );
        const y = Math.min(
          Math.floor(agent.position.y / fieldSize),
          maxRows - 1
        );
        const desiredDirection = field[x][y];
        agent.follow(desiredDirection);
        agent.update();
        agent.checkBorders();
        agent.draw();
        pop();
      }
    }
  }

