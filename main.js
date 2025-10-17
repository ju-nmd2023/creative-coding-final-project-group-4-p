function setup() {
  createCanvas(innerWidth, innerHeight);
  numRows = Math.floor(height / size);
  numCols = Math.floor(width / size);
  noStroke();
  frameRate(100);
  textAlign(CENTER, CENTER);
  textFont(Neue);
}

const size = 10;
const divider = 20;

let t = 0;
let t1 = 500;
let colors = [
  [195, 214, 176],
  [88, 53, 95],
  [80, 100, 150],
  [90, 100, 180],
];

function preload() {
  Neue = loadFont("assets/font.ttf");
}

function draw() {
  drawFirstLayer();
  drawSecondLayer();
  drawTitle();

  t += 0.03;
  t1 += 0.09;
}

function layerColor(layerPos, tOffset = 0) {
  let scaled = (layerPos + tOffset) * colors.length;
  let idx1 = Math.floor(scaled) % colors.length;
  let idx2 = (idx1 + 1) % colors.length;
  let amt = scaled - Math.floor(scaled);

  let c1 = color(colors[idx1][0], colors[idx1][1], colors[idx1][2]);
  let c2 = color(colors[idx2][0], colors[idx2][1], colors[idx2][2]);
  return lerpColor(c1, c2, amt);
}

function drawFirstLayer() {
  for (let y = 0; y < numRows; y++) {
    for (let x = 0; x < numCols; x++) {
      let angle = noise(x / divider, y / divider, t) * TWO_PI * 1.2;
      let dx = cos(angle) * size * 0.5;
      let dy = sin(angle) * size * 0.5;

      let c = layerColor(x / numCols, t * 0.05);
      fill(c, 150);
      ellipse(x * size + dx, y * size + dy, size * 0.7);
    }
  }
}

function drawSecondLayer() {
  for (let y = 0; y < numRows; y++) {
    for (let x = 0; x < numCols; x++) {
      let angle = noise(x / divider, y / divider, t1) * TWO_PI * 1.5;
      let dx = cos(angle) * size * 0.5;
      let dy = sin(angle) * size * 0.5;

      let c = layerColor(y / numRows, t1 * 0.03);
      fill(c, 150);
      ellipse(x * size + dx, y * size + dy, size * 0.7);
    }
  }
}

function drawTitle() {
  fill(0);
  textSize(width / 20);
  text("Last Night I dreamt I was ...", width / 2, height / 2);
}
