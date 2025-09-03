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
document.addEventListener("DOMContentLoaded", function () {
  const audio = document.getElementById("backgroundMusic");
  const toggleButton = document.getElementById("toggleMusic");
  const volumeSlider = document.getElementById("volumeSlider");

  // تنظیمات اولیه
  audio.volume = 0.7;
  let userInteracted = false;

  // نمایش هشدار به کاربر
  setTimeout(function () {
    if (!userInteracted) {
      alert("باباجون ! لطفا صدا رو زیاد کن 😘♥️😍");
    }
  }, 3);

  // تلاش برای پخش خودکار
  function tryAutoPlay() {
    const playPromise = audio.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          // پخش موفقیت‌آمیز بود
          toggleButton.textContent = "🔊";
          userInteracted = true;
        })
        .catch((error) => {
          // پخش خودکار ناموفق بود
          console.log("پخش خودکار متوقف شد: نیاز به تعامل کاربر");
          toggleButton.textContent = "🔇";
        });
    }
  }

  // تأخیر قبل از پخش
  setTimeout(tryAutoPlay, 0);

  // کنترل دکمه خاموش/روشن کردن صدا
  toggleButton.addEventListener("click", function () {
    if (audio.paused) {
      audio
        .play()
        .then(() => {
          toggleButton.textContent = "🔊";
          userInteracted = true;
        })
        .catch((error) => {
          console.error("خطا در پخش صدا:", error);
        });
    } else {
      audio.pause();
      toggleButton.textContent = "🔇";
    }
  });

  // کنترل حجم صدا
  volumeSlider.addEventListener("input", function () {
    audio.volume = this.value;
    userInteracted = true;
  });

  // مدیریت حالت visibility صفحه
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      // صفحه مخفی شده است
      audio.pause();
    } else if (userInteracted) {
      // صفحه دوباره visible شده و کاربر قبلاً تعامل داشته
      audio.play().catch((error) => {
        console.error("خطا در پخش صدا:", error);
      });
    }
  });
});
