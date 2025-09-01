// انتخاب المان های DOM
const sections = document.querySelectorAll("section");
const loadingScreen = document.querySelector(".loading");
const backgroundMusic = document.getElementById("background-music");

// متغیرهای بازی
let currentSection = 0;
let gameScore = 0;
let timeLeft = 60;
let gameInterval;
let gameTimer;
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

// متغیرهای راکت و توپ - اندازه راکت بزرگتر شده
const paddleHeight = 15;
const paddleWidth = 120;
let paddleX = (canvas.width - paddleWidth) / 2;
let ballX = canvas.width / 2;
let ballY = canvas.height - 30;
let ballSpeedX = 5;
let ballSpeedY = -5;
const ballRadius = 10;
let rightPressed = false;
let leftPressed = false;

// توابع کنترل برای موبایل
function moveLeft() {
  leftPressed = true;
}
function moveRight() {
  rightPressed = true;
}
function stopMove() {
  leftPressed = false;
  rightPressed = false;
}

// متغیرهای آجرها
const brickRowCount = 5;
const brickColumnCount = 3;
const brickWidth = 75;
const brickHeight = 20;
const brickPadding = 10;
const brickOffsetTop = 30;
const brickOffsetLeft = 30;
const bricks = [];

// مقداردهی اولیه آجرها
for (let c = 0; c < brickColumnCount; c++) {
  bricks[c] = [];
  for (let r = 0; r < brickRowCount; r++) {
    bricks[c][r] = { x: 0, y: 0, status: 1 };
  }
}

// توابع ترسیم المان های بازی
function drawBall() {
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#1a75fc";
  ctx.fill();
  ctx.closePath();
}

function drawPaddle() {
  ctx.beginPath();
  ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
  ctx.fillStyle = "#1a75fc";
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
        ctx.fillStyle = "#1a75fc";
        ctx.fill();
        ctx.closePath();
      }
    }
  }
}

// تشخیص برخورد
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
          // بررسی آیا همه آجرها شکسته شده اند
          if (gameScore === brickRowCount * brickColumnCount) {
            alert("آفرین! شما برنده شدید! امتیاز: " + gameScore);
            clearInterval(gameTimer);
            cancelAnimationFrame(gameInterval);
          }
        }
      }
    }
  }
}

// مقداردهی اولیه بازی
function initGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawBricks();
  drawBall();
  drawPaddle();
  collisionDetection();
  // برخورد با دیوارها
  if (
    ballX + ballSpeedX > canvas.width - ballRadius ||
    ballX + ballSpeedX < ballRadius
  ) {
    ballSpeedX = -ballSpeedX;
  }
  if (ballY + ballSpeedY < ballRadius) {
    ballSpeedY = -ballSpeedY;
  } else if (ballY + ballSpeedY > canvas.height - ballRadius) {
    // برخورد با راکت یا پایان بازی
    if (ballX > paddleX && ballX < paddleX + paddleWidth) {
      ballSpeedY = -ballSpeedY;
    } else {
      clearInterval(gameTimer);
      cancelAnimationFrame(gameInterval);
      alert("بازی تمام شد! امتیاز نهایی: " + gameScore);
      return;
    }
  }
  // حرکت راکت با صفحه کلید
  if (rightPressed && paddleX < canvas.width - paddleWidth) {
    paddleX += 10;
  } else if (leftPressed && paddleX > 0) {
    paddleX -= 10;
  }
  // حرکت توپ
  ballX += ballSpeedX;
  ballY += ballSpeedY;
  requestAnimationFrame(initGame);
}

// کنترلرهای صفحه کلید
function keyDownHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = true;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = true;
  }
}

function keyUpHandler(e) {
  if (e.key === "Right" || e.key === "ArrowRight") {
    rightPressed = false;
  } else if (e.key === "Left" || e.key === "ArrowLeft") {
    leftPressed = false;
  }
}

// کنترلرهای ماوس
function mouseMoveHandler(e) {
  const relativeX = e.clientX - canvas.getBoundingClientRect().left;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
}

// کنترلرهای لمسی برای موبایل
function touchMoveHandler(e) {
  e.preventDefault();
  const relativeX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
  if (relativeX > 0 && relativeX < canvas.width) {
    paddleX = relativeX - paddleWidth / 2;
  }
}

// توابع کنترل بازی
function startGame() {
  showLoading(() => {
    switchSection(1);
    resetGame();
    gameInterval = requestAnimationFrame(initGame);
    startGameTimer();
  }, 500);
}

function restartGame() {
  showLoading(() => {
    resetGame();
    gameInterval = requestAnimationFrame(initGame);
    timeLeft = 60;
    document.getElementById("time").textContent = timeLeft;
    startGameTimer();
  }, 500);
}

function startGameTimer() {
  clearInterval(gameTimer);
  gameTimer = setInterval(() => {
    timeLeft--;
    document.getElementById("time").textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(gameTimer);
      cancelAnimationFrame(gameInterval);
      alert("زمان به پایان رسید! امتیاز شما: " + gameScore);
    }
  }, 1000);
}

function resetGame() {
  gameScore = 0;
  document.getElementById("score").textContent = gameScore;
  ballX = canvas.width / 2;
  ballY = canvas.height - 30;
  ballSpeedX = 5;
  ballSpeedY = -5;
  paddleX = (canvas.width - paddleWidth) / 2;
  for (let c = 0; c < brickColumnCount; c++) {
    for (let r = 0; r < brickRowCount; r++) {
      bricks[c][r].status = 1;
    }
  }
  clearInterval(gameTimer);
  cancelAnimationFrame(gameInterval);
}

// پیمایش بین بخش ها
function nextSection() {
  showLoading(() => {
    if (currentSection < sections.length - 1) {
      switchSection(currentSection + 1);
      if (currentSection === 3) {
        createConfetti();
      }
    }
  }, 800);
}

function switchSection(index) {
  sections[currentSection].classList.remove("active");
  currentSection = index;
  sections[currentSection].classList.add("active");
}

function showFinalMessage() {
  showLoading(() => {
    switchSection(4);
  }, 800);
}

function restartFromBeginning() {
  showLoading(() => {
    switchSection(0);
  }, 800);
}

// صفحه لودینگ بهینه شده - فقط هنگام نیاز نشان داده می شود
function showLoading(callback, delay = 800) {
  loadingScreen.style.display = "flex";
  setTimeout(() => {
    loadingScreen.style.display = "none";
    callback();
  }, delay);
}

// افکت کاغذ رنگی
function createConfetti() {
  const confettiContainer = document.getElementById("confetti-container");
  confettiContainer.innerHTML = "";
  for (let i = 0; i < 100; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.backgroundColor = `hsl(${Math.random() * 360},100%,50%)`;
    confetti.style.animationDelay = Math.random() * 5 + "s";
    confettiContainer.appendChild(confetti);
  }
}

// مقداردهی اولیه صفحه
window.onload = function () {
  setTimeout(() => {
    loadingScreen.style.display = "none";
  }, 2000);
  // افزودن نشانگر اسکرول
  const scrollIndicator = document.createElement("div");
  scrollIndicator.classList.add("scroll-indicator");
  const upArrow = document.createElement("div");
  upArrow.classList.add("scroll-arrow");
  upArrow.textContent = "↑";
  upArrow.onclick = () => window.scrollBy(0, -100);
  const downArrow = document.createElement("div");
  downArrow.classList.add("scroll-arrow");
  downArrow.textContent = "↓";
  downArrow.onclick = () => window.scrollBy(0, 100);
  scrollIndicator.appendChild(upArrow);
  scrollIndicator.appendChild(downArrow);
  document.body.appendChild(scrollIndicator);
  // مقداردهی اولیه کانواس بازی
  canvas.width = 400;
  canvas.height = 400;
  // افزودن event listener برای کنترل بازی
  document.addEventListener("keydown", keyDownHandler);
  document.addEventListener("keyup", keyUpHandler);
  document.addEventListener("mousemove", mouseMoveHandler);
  canvas.addEventListener("touchmove", touchMoveHandler, { passive: false });
};
