const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");
const HEIGHT = canvas.getAttribute('height');
const WIDTH = canvas.getAttribute('width');

ctx.strokeStyle = "red";

const CIRCLE_RADIUS = 15;
let GRAVITY = 0.3;
let JUMP_SPEED = 10;
let WALL_SPEED = 3;
let LASER_SPEED = 4;

let playing = false;
let jumping = false;
let score = 0;
let circle = {
  x: CIRCLE_RADIUS + 10,
  y: canvas.height / 2,
  vy: 0
};

let pipes = [];
let lasers = [];

const gravityConfig = document.getElementById("gravConfig");
gravityConfig.value = GRAVITY;
gravityConfig.addEventListener("input", e => GRAVITY = Number(e.target.value));

const jumpConfig = document.getElementById("jumpConfig");
jumpConfig.value = JUMP_SPEED;
jumpConfig.addEventListener("input", e => JUMP_SPEED = Number(e.target.value));

const speedConfig = document.getElementById("speedConfig");
speedConfig.value = WALL_SPEED;
speedConfig.addEventListener("input", e => WALL_SPEED = Number(e.target.value));

const laserConfig = document.getElementById("laserConfig");
laserConfig.value = LASER_SPEED;
laserConfig.addEventListener("input", e => LASER_SPEED = Number(e.target.value));

function init() {
  circle = {
    x: CIRCLE_RADIUS + 10,
    y: canvas.height / 2,
    vy: 0
  };
  score = 0;
  pipes = [];
  lasers = [];
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawCircle() {
  shouldJump();

  // Update circle position
  circle.y += circle.vy;
  circle.vy += GRAVITY;
  
  // Check for collision with bottom of screen
  if (circle.y + CIRCLE_RADIUS >= canvas.height) {
    circle.y = canvas.height - CIRCLE_RADIUS;
    circle.vy = 0;
  }

  if (circle.y - CIRCLE_RADIUS < 0) {
    circle.y = 0 + CIRCLE_RADIUS;
    circle.vy = 0;
  }

  // Draw circle
  ctx.fillStyle = "green";
  ctx.beginPath();
  ctx.arc(circle.x, circle.y, CIRCLE_RADIUS, 0, 2 * Math.PI);
  ctx.fill();
}

function drawRectangles() {
  // Draw rectangles
  for (let i = 0; i < pipes.length; i++) {
    const rect = pipes[i];
    ctx.fillStyle = rect.gap ? "brown" : "green";
    rect.x -= rect.speed;
    ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
  
  // Remove rectangles that have moved off the screen
  if (pipes.some(rect => rect.x + rect.width <= 0)) {
    incrementscore();
    pipes = pipes.filter(rect => rect.x + rect.width >= 0);
  }
}

function addRectangles() {
  const RECT_WIDTH = 50;
  const GAP_HEIGHT = CIRCLE_RADIUS*12;
  const gapTop = Math.floor(Math.random() * (HEIGHT - GAP_HEIGHT));
  pipes.push({ x: canvas.width, y: 0, width: RECT_WIDTH, height: gapTop, speed: WALL_SPEED });
  pipes.push({ x: canvas.width, y: gapTop + GAP_HEIGHT, width: RECT_WIDTH, height: HEIGHT - (gapTop + GAP_HEIGHT), speed: WALL_SPEED });
  
  pipes.push({ x: canvas.width + 5, y: gapTop, width: RECT_WIDTH - 10, height: GAP_HEIGHT, speed: WALL_SPEED, gap: true });
}

function drawLaser() {
  lasers.forEach(las => {
    las.x += LASER_SPEED;
    ctx.fillStyle = "red";
    ctx.fillRect(las.x, las.y, las.width, las.height);
  });
}

function checkCollisionPlayerPipe() {
  for (let i = 0; i < pipes.length; i++) {
    const rect = pipes[i];
    if (RectCircleColliding(circle, rect)) {
      stop();
      return;
    }
  }
}

function checkCollisionLaserPipe() {
  for (let i = pipes.length - 1; i > -1 ; i--) {
    for (let j = lasers.length - 1; j > -1 ; j--) {
      const rect = pipes[i];
      const laser = lasers[j];

      if (checkOverlap(rect, laser)) {
        if (rect.gap) {
          pipes.splice(i, 1);
        }
        lasers.splice(j,1);
      }
    }
  }
}

let end;
let start = 0;
function animate() {
  if (!playing) return;
  drawBackground();
  drawCircle();
  drawRectangles();
  checkCollisionPlayerPipe();
  checkCollisionLaserPipe();
  drawLaser();
  
  // Add rectangles at fixed interval
  if (frames % 100 === 0) {
    end = Date.now();
    console.log(`Execution time: ${end - start} ms`);
    start = Date.now();
    addRectangles();
  }
  
  frames++;
  requestAnimationFrame(animate);
}

let frames = 0;

function handleKeyDown(event) {
  if (event.code === "Space") {
    jump();
  }
  if (String.fromCharCode(event.keyCode) === "Q") {
    laser();
  }
  console.log(String.fromCharCode(event.keyCode));
}

function handleKeyUp(event) {
  if (event.code === "Space") {
    unjump();
  }
}

function laser() {
  lasers.push({
    x: circle.x + CIRCLE_RADIUS + 4,
    y: circle.y,
    height:10,
    width: 30
  })
}


let lastJumpFrame=-100;
function shouldJump(e) {
  if (!jumping) return;
  if (frames - lastJumpFrame < 30) return;
  lastJumpFrame = frames;
  circle.vy = -JUMP_SPEED;
}

function jump() {
  jumping = true;
}

function unjump() {
  jumping = false;
  lastJumpFrame =-100;
}

window.start = function start() {
  init();
  if (playing) return;
  playing = true;
  animate();
  
  // Add event listener for spacebar
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", handleKeyUp);
  window.addEventListener("noiseStart", jump);
  window.addEventListener("noiseStop", unjump);
  document.getElementById('start').blur();
}

window.stop = function stop() {
  playing = false;
}

function incrementscore() {
  score++;
  document.getElementById("score").innerHTML = score/2;
}


function RectCircleColliding(circle,rect){
  var distX = Math.abs(circle.x - rect.x-rect.width/2);
  var distY = Math.abs(circle.y - rect.y-rect.height/2);

  if (distX > (rect.width/2 + CIRCLE_RADIUS)) { return false; }
  if (distY > (rect.height/2 + CIRCLE_RADIUS)) { return false; }

  if (distX <= (rect.width/2)) { return true; } 
  if (distY <= (rect.height/2)) { return true; }

  var dx=distX-rect.width/2;
  var dy=distY-rect.height/2;
  return (dx*dx+dy*dy<=(CIRCLE_RADIUS*CIRCLE_RADIUS));
}

function checkOverlap(rect1, rect2) {
  // Calculate the x and y coordinates of the edges of each rectangle
  const rect1Left = rect1.x;
  const rect1Right = rect1.x + rect1.width;
  const rect1Top = rect1.y;
  const rect1Bottom = rect1.y + rect1.height;
  
  const rect2Left = rect2.x;
  const rect2Right = rect2.x + rect2.width;
  const rect2Top = rect2.y;
  const rect2Bottom = rect2.y + rect2.height;
  
  // Check if the rectangles overlap in the x and y axes
  const xOverlap = rect1Left < rect2Right && rect1Right > rect2Left;
  const yOverlap = rect1Top < rect2Bottom && rect1Bottom > rect2Top;
  
  // Return true if the rectangles overlap in both axes, false otherwise
  return xOverlap && yOverlap;
}