const canvas = document.getElementById("confetti");
const ctx = canvas.getContext("2d");

let W = window.innerWidth;
let H = window.innerHeight;
canvas.width = W;
canvas.height = H;

const confettiCount = 4000; // تعداد کاغذهای محدود
let confetti = [];
const colors = [
  "#f94144",
  "#f3722c",
  "#f9c74f",
  "#90be6d",
  "#577590",
  "#43aa8b",
  "#4d908e",
  "#277da1",
  "#7209b7",
  "#f72585",
];

// ایجاد کاغذها
for (let i = 0; i < confettiCount; i++) {
  confetti.push({
    x: Math.random() * W,
    y: Math.random() * H - H,
    r: Math.random() * 6 + 2,
    d: Math.random() * confettiCount,
    color: colors[Math.floor(Math.random() * colors.length)],
    tilt: Math.random() * 10 - 10,
    tiltAngleIncrement: Math.random() * 0.07 + 0.05,
    tiltAngle: 0,
  });
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  confetti.forEach((c) => {
    ctx.beginPath();
    ctx.lineWidth = c.r;
    ctx.strokeStyle = c.color;
    ctx.moveTo(c.x + c.tilt + c.r / 2, c.y);
    ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r / 2);
    ctx.stroke();
  });
  update();
}

function update() {
  // حرکت کاغذها
  confetti.forEach((c, i) => {
    c.tiltAngle += c.tiltAngleIncrement;
    c.y += (Math.cos(c.d) + 3 + c.r / 2) * 2;
    c.x += Math.sin(c.d);
    c.tilt = Math.sin(c.tiltAngle) * 15;
  });

  // حذف کاغذهایی که از پایین صفحه رد شدن
  confetti = confetti.filter((c) => c.y < H + 20);

  // اگر همه تموم شدن، انیمیشن را متوقف کن
  if (confetti.length === 0) {
    clearInterval(drawInterval);
  }
}

// اجرا با فاصله زمانی
const drawInterval = setInterval(draw, 15);

window.addEventListener("resize", () => {
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W;
  canvas.height = H;
});

// اضافه کردن افکت confetti با کلیک
document.addEventListener("click", function () {
  // اضافه کردن confetti جدید با کلیک
  for (let i = 0; i < 100; i++) {
    confetti.push({
      x: Math.random() * W,
      y: H,
      r: Math.random() * 6 + 2,
      d: Math.random() * confettiCount,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      tiltAngle: 0,
    });
  }
});

// همچنین confetti هنگام لود صفحه
window.addEventListener("load", function () {
  for (let i = 0; i < 200; i++) {
    confetti.push({
      x: Math.random() * W,
      y: H,
      r: Math.random() * 6 + 2,
      d: Math.random() * confettiCount,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.random() * 10 - 10,
      tiltAngleIncrement: Math.random() * 0.07 + 0.05,
      tiltAngle: 0,
    });
  }
});
