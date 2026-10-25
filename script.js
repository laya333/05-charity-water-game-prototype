// Log a message to the console to ensure the script is linked correctly
//console.log('JavaScript file is linked correctly.');

//Find the HTML elements that need to be updated
const titleScreen = document.getElementById("title-screen");
const instructionsScreen = document.getElementById("instructions-screen");
const learnScreen = document.getElementById("learn-screen");
const gameScreen = document.getElementById("game-screen");
const pauseScreen = document.getElementById("pause-screen");
const gameOverScreen = document.getElementById("game-over-screen");

const gameArea = document.getElementById("game-area");
const bucket = document.getElementById("bucket");
const bucketWater = document.getElementById("bucket-water");
const waterLevel = document.getElementById("water-level");

const scoreDisplay = document.getElementById("score");
const timerDisplay = document.getElementById("timer");
const streakDisplay = document.getElementById("streak");
const gameOverTitle = document.getElementById("game-over-title");
const confettiContainer = document.getElementById("confetti-container");

//Game variables
let score = 0;
let timeLeft = 60;
let streak = 0;
let bestStreak = 0;
let waterAmount = 0;

let bucketX = 0;
let droplets = [];
let keysPressed = {};

let gameState = "menu";
let animationId = null;
let lastFrameTime = 0;
let spawnElapsed = 0;
let secondElapsed = 0;

//Game settings
const BUCKET_WIDTH = 76;
const BUCKET_HEIGHT = 58;
const BUCKET_SPEED = 300;
const DROPLET_SPEED = 140;
const SPAWN_INTERVAL = 700;
const WINNING_SCORE = 20;

//Screen Navigation
function showScreen(screenToShow) {
  const screens = [
    titleScreen,
    instructionsScreen, 
    learnScreen, 
    gameScreen, 
    pauseScreen,
    gameOverScreen
  ];

  screens.forEach(function (screen) {
    screen.classList.add("hidden");
  });

  screenToShow.classList.remove("hidden");
}

function clearDroplets () {
  droplets.forEach(function (droplet) {
    droplet.element.remove();
  });

  droplets = [];
}

//Start and Reset Game
function startGame() {
  stopGameLoop();
  clearDroplets();

  score = 0;
  timeLeft = 60;
  waterAmount = 0;
  confettiContainer.replaceChildren();

  keysPressed = {};
  spawnElapsed = 0;
  secondElapsed = 0;
  lastFrameTime = 0;

  bucketX = (gameArea.clientWidth - BUCKET_WIDTH)/2;

  bucket.style.left = bucketX +"px";
  bucket.style.transform = "none";

  bucketWater.style.height = "0%";
  waterLevel.style.width = "0%";

  scoreDisplay.textContent = score;
  timerDisplay.textContent = timeLeft;
  streakDisplay.textContent = streak;

  gameState = "playing";
  showScreen(gameScreen);

  //Start the animation loop
  animationId = requestAnimationFrame(gameLoop);
}

function moveBucket(deltaTime) {
  if (keysPressed["ArrowLeft"] || keysPressed["a"] ||
    keysPressed["A"]) {
      bucketX -= BUCKET_SPEED * deltaTime;
    }
  
  if (keysPressed["ArrowRight"] || keysPressed["d"] ||
    keysPressed["D"]) {
      bucketX += BUCKET_SPEED * deltaTime;
    }

    //Keep the bucket inside the game area
    const maxX = gameArea.clientWidth - BUCKET_WIDTH;

    bucketX = Math.max(0, Math.min(bucketX, maxX));

    bucket.style.left = bucketX + "px";
}

//Create falling droplets
function spawnDroplet() {
  const element = document.createElement("div");

  // Most droplets are clean; some are dirty.
  const isClean = Math.random() < 0.7;

  element.classList.add(
    "droplet",
    isClean ? "clean" : "dirty"
  );

  // Choose a random horizontal position.
  const maxX = Math.max(0, gameArea.clientWidth - 18);
  const x = Math.random() * maxX;

  // Start below the clouds.
  const y = 95;

  element.style.left = x + "px";
  element.style.top = y + "px";

  gameArea.appendChild(element);

  droplets.push({
    element: element,
    x: x,
    y: y,
    clean: isClean
  });
}

//Score, streak, and water level
function updateScore(droplet) {
  if (droplet.clean) {
    // Clean water adds one point.
    score += 1;
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);

    // Increase the water level, up to 100%.
    waterAmount = Math.min(waterAmount + 8, 100);
  } else {
    // Dirty water subtracts two points.
    score -= 2;

    // Dirty water resets the current streak.
    streak = 0;
  }

  scoreDisplay.textContent = score;
  streakDisplay.textContent = streak;

  waterLevel.style.width = waterAmount + "%";
  bucketWater.style.height = waterAmount + "%";
}

//Move droplets and check collisions
function updateDroplets(deltaTime) {
  const bucketTop =
    gameArea.clientHeight - BUCKET_HEIGHT - 8;

  const bucketRight = bucketX + BUCKET_WIDTH;

  // Go backward so removing a droplet is safe.
  for (let i = droplets.length - 1; i >= 0; i--) {
    const droplet = droplets[i];

    // Move the droplet downward.
    droplet.y += DROPLET_SPEED * deltaTime;
    droplet.element.style.top = droplet.y + "px";

    const dropletLeft = droplet.x;
    const dropletRight = droplet.x + 18;
    const dropletBottom = droplet.y + 18;

    // Check whether the droplet overlaps the bucket.
    const overlapsBucket =
      dropletRight > bucketX &&
      dropletLeft < bucketRight &&
      dropletBottom >= bucketTop &&
      droplet.y <= bucketTop + BUCKET_HEIGHT;

    if (overlapsBucket) {
      updateScore(droplet);
      droplet.element.remove();
      droplets.splice(i, 1);
    } else if (droplet.y > gameArea.clientHeight) {
      // Remove droplets that fall off the screen.
      droplet.element.remove();
      droplets.splice(i, 1);
    }
  }
}

//Timer and game loop
function gameLoop(timestamp) {
  if (gameState !== "playing") {
    return;
  }

  // Work out how much time has passed since the previous animation frame.
  if (lastFrameTime === 0) {
    lastFrameTime = timestamp;
  }

  const deltaTime = Math.min(
    (timestamp - lastFrameTime) / 1000,
    0.05
  );

  lastFrameTime = timestamp;

  // Update the countdown.
  secondElapsed += deltaTime;

  if (secondElapsed >= 1) {
    const secondsPassed = Math.floor(secondElapsed);

    timeLeft -= secondsPassed;
    secondElapsed -= secondsPassed;

    timeLeft = Math.max(0, timeLeft);
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      endGame();
      return;
    }
  }

  // Spawn droplets at regular intervals.
  spawnElapsed += deltaTime * 1000;

  while (spawnElapsed >= SPAWN_INTERVAL) {
    spawnDroplet();
    spawnElapsed -= SPAWN_INTERVAL;
  }

  // Update the gameplay.
  moveBucket(deltaTime);
  updateDroplets(deltaTime);

  // Request the next frame.
  animationId = requestAnimationFrame(gameLoop);
}

function stopGameLoop() {
  if (animationId !== null) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  lastFrameTime = 0;
}

//Pause and resume game
function pauseGame() {
  if (gameState !== "playing") {
    return;
  }

  gameState = "paused";
  stopGameLoop();
  keysPressed = {};

  showScreen(pauseScreen);
}

function resumeGame() {
  if (gameState !== "paused") {
    return;
  }

  gameState = "playing";
  lastFrameTime = 0;

  showScreen(gameScreen);

  animationId = requestAnimationFrame(gameLoop);
}

//End game
function endGame() {
  gameState = "over";
  stopGameLoop();
  keysPressed = {};

  const won = score >= WINNING_SCORE;
  gameOverTitle.textContent = won ? "You Win!" : "Time's Up!";

  if (won) {
    streak += 1;
    bestStreak = Math.max(bestStreak, streak);
  } else {
    streak = 0;
  }

  streakDisplay.textContent = streak;
  document.getElementById("final-score").textContent = score;
  document.getElementById("best-streak").textContent = bestStreak;

  showScreen(gameOverScreen);

  if (won) {
    showConfetti();
  }
}

function showConfetti() {
  confettiContainer.replaceChildren();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return;
  }

  const colors = ["#ffc907", "#2e9df7", "#8bd1cb", "#ff902a"];

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement("span");
    piece.classList.add("confetti");
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.backgroundColor =
      colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDelay = Math.random() * 0.8 + "s";
    piece.addEventListener("animationend", function () {
      piece.remove();
    });

    confettiContainer.appendChild(piece);
  }
}

// ========================================
// RETURN TO MAIN MENU
// ========================================

function returnToMenu() {
  stopGameLoop();
  clearDroplets();

  keysPressed = {};
  gameState = "menu";

  showScreen(titleScreen);
}

//Button event listeners
document.getElementById("start-button")
  .addEventListener("click", startGame);

document.getElementById("instructions-button")
  .addEventListener("click", function () {
    showScreen(instructionsScreen);
  });

document.getElementById("learn-button")
  .addEventListener("click", function () {
    showScreen(learnScreen);
  });

document.getElementById("instructions-back")
  .addEventListener("click", returnToMenu);

document.getElementById("learn-back")
  .addEventListener("click", returnToMenu);

document.getElementById("pause-button")
  .addEventListener("click", pauseGame);

document.getElementById("resume-button")
  .addEventListener("click", resumeGame);

document.getElementById("restart-button")
  .addEventListener("click", startGame);

document.getElementById("pause-restart-button")
  .addEventListener("click", startGame);

document.getElementById("menu-button")
  .addEventListener("click", returnToMenu);

document.getElementById("pause-menu-button")
  .addEventListener("click", returnToMenu);

document.getElementById("play-again-button")
  .addEventListener("click", startGame);

document.getElementById("game-over-menu-button")
  .addEventListener("click", returnToMenu);

//Keyboard event listeners
document.addEventListener("keydown", function (event) {
  if (gameState !== "playing") {
    return;
  }

  if ([
    "ArrowLeft",
    "ArrowRight",
    "a",
    "A",
    "d",
    "D"
  ].includes(event.key)) {
    event.preventDefault();
    keysPressed[event.key] = true;
  }
});

document.addEventListener("keyup", function (event) {
  keysPressed[event.key] = false;
});

// Stop movement if the browser window loses focus.
window.addEventListener("blur", function () {
  keysPressed = {};
});
