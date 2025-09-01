// DOM Elements
const sections = document.querySelectorAll("section");
const loadingScreen = document.querySelector(".loading");
const backgroundMusic = document.getElementById("background-music");

// Game Variables
let currentSection = 0;
let gameScore = 0;
let timeLeft = 60;
let gameInterval;
let gameTimer;
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// Paddle and Ball
const paddleHeight = 10;
const paddleWidth = 75;
let paddleX = (canvas.width - paddleWidth) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height - 30;
let ballSpeedX = 5;
let ballSpeedY = -5;
const ballRadius = 10;

// Bricks
const brickRowCount = 5;
const brickColumnCount = 3;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;
const bricks = [];

for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

// Initialize the game
function initGame() {
  // Draw elements
  drawBricks();
  drawBall();
  drawPaddle();

  // Collision detection
  collisionDetection();

  // Wall collisions
  if (
    ballX + ballSpeedX > canvas.width - ballRadius ||
    ballX + ballSpeedX < ballRadius
  ) {
    ballSpeedX = -ballSpeedX;
  }
  if (ballY + ballSpeedY < ballRadius) {
    ballSpeedY = -ballSpeedY;
  } else if (ballY + ballSpeedY > canvas.height - ballRadius) {
    if (ballX > paddleX && ballX < paddleX + paddleWidth) {
      ballSpeedY = -ballSpeedY;
    } else {
      // Game over
      clearInterval(gameInterval);
      clearInterval(gameTimer);
      alert(" بازی تمام شد! امتیاز نهایی: " + gameScore);
    }
  }

  // Move paddle with mouse
  canvas.addEventListener("mousemove", (e) => {
    const relativeX = e.clientX - canvas.getBoundingClientRect().left;
    if (relativeX > 0 && relativeX < canvas.width) {
      paddleX = relativeX - paddleWidth / 2;
    }
  });

  // Move ball
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  requestAnimationFrame(initGame);
}

// Draw game elements
function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#0095DD";
  ctx.fill();
  ctx.closePath();
}

function drawBricks() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      if (bricks[c][r].status === 1) {
        const brickX = r * (brickWidth + brickPadding) + brickOffsetLeft;
        const brickY = c * (brickHeight + brickPadding) + brickOffsetTop;
        bricks[c][r].x = brickX;
        bricks[c][r].y = brickY;
        ctx.beginPath();
        ctx.rect(brickX, brickY, brickWidth, brickHeight);
        ctx.fillStyle = "#0095DD";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

function collisionDetection() {
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      const b = bricks[c][r];
      if (b.status === 1) {
        if (
          ballX > b.x &&
          ballX < b.x + brickWidth &&
          ballY > b.y &&
          ballY < b.y + brickHeight
        ) {
          ballSpeedY = -ballSpeedY;
          b.status = 0;
          gameScore++;
          document.getElementById("score").textContent = gameScore;
        }
      }
    }
  }
}

// Game control functions
function startGame() {
  // Show loading then switch to game
  showLoading(() => {
    switchSection(1);
    resetGame();
    gameInterval = setInterval(initGame, 10);

    // Start timer
    gameTimer = setInterval(() => {
      timeLeft--;
      document.getElementById("time").textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(gameTimer);
        clearInterval(gameInterval);
        alert("زمان به پایان رسید! امتیاز شما: " + gameScore);
      }
    }, 1000);
  });
}

function restartGame() {
  showLoading(() => {
    resetGame();
    gameInterval = setInterval(initGame, 10);

    // Reset and start timer
    timeLeft = 60;
    document.getElementById("time").textContent = timeLeft;

    gameTimer = setInterval(() => {
      timeLeft--;
      document.getElementById("time").textContent = timeLeft;

      if (timeLeft <= 0) {
        clearInterval(gameTimer);
        clearInterval(gameInterval);
        alert("زمان به پایان رسید! امتیاز شما: " + gameScore);
      }
    }, 1000);
  });
}

function resetGame() {
  // Reset game state
  gameScore = 0;
  document.getElementById("score").textContent = gameScore;

  // Reset ball and paddle
  ballX = canvas.width / 2;
  ballY = canvas.height - 30;
  ballSpeedX = 5;
  ballSpeedY = -5;
  paddleX = (canvas.width - paddleWidth) / 2;

  // Reset bricks
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r].status = 1;
    }
  }

  // Clear intervals if they exist
  clearInterval(gameInterval);
  clearInterval(gameTimer);
}

// Section navigation
function nextSection() {
  showLoading(() => {
    if (currentSection < sections.length - 1) {
      switchSection(currentSection + 1);

      // If going to final section, create confetti
      if (currentSection === 3) {
        createConfetti();
      }
    }
  });
}

function switchSection(index) {
  sections[currentSection].classList.remove("active");
  currentSection = index;
  sections[currentSection].classList.add("active");
}

function showFinalMessage() {
  showLoading(() => {
    switchSection(4);
  });
}

// Loading screen
function showLoading(callback) {
  loadingScreen.style.display = "flex";
  setTimeout(() => {
    loadingScreen.style.display = "none";
    callback();
  }, 1500);
}

// Confetti effect
function createConfetti() {
  const confettiContainer = document.getElementById("confetti-container");
  confettiContainer.innerHTML = "";

  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
    confetti.style.animationDelay = Math.random() * 5 + "s";
    confettiContainer.appendChild(confetti);
  }
}

// Initialize page
window.onload = function () {
  // Hide loading after page load
  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 2000);

  // Add scroll indicator
  const scrollIndicator = document.createElement("div");
  scrollIndicator.style.position = "fixed";
  scrollIndicator.style.right = "10px";
  scrollIndicator.style.top = "50%";
  scrollIndicator.style.transform = "translateY(-50%)";
  scrollIndicator.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
  scrollIndicator.style.padding = "10px 5px";
  scrollIndicator.style.borderRadius = "20px";
  scrollIndicator.style.zIndex = "100";

  const upArrow = document.createElement("div");
  upArrow.textContent = "↑";
  upArrow.style.fontSize = "24px";
  upArrow.style.cursor = "pointer";
  upArrow.onclick = () => window.scrollBy(0, -100);
  
  const downArrow = document.createElement("div");
  downArrow.textContent = "↓";
  downArrow.style.fontSize = "24px";
  downArrow.style.cursor = "pointer";
  downArrow.onclick = () => window.scrollBy(0, 100);

  scrollIndicator.appendChild(upArrow);
  scrollIndicator.appendChild(downArrow);
  document.body.appendChild(scrollIndicator);
};
