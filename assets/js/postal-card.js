// ===== Confetti setup =====
const canvas = document.getElementById('confetti');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let confettiPieces = [];
const colors = ['#FF6B6B','#FFD93D','#6BCB77','#4D96FF','#FF61A6','#845EC2','#00C9A7','#F9F871'];

function createConfetti() {
    for (let i = 0; i < 9950; i++) {
        confettiPieces.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height - canvas.height,
            r: Math.random() * 6 + 4,
            d: Math.random() * 30 + 10,
            color: colors[Math.floor(Math.random() * colors.length)],
            tilt: Math.floor(Math.random() * 1000) - 10,
            tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
            tiltAngle: 0
        });
    }
}

function drawConfetti() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    confettiPieces.forEach((p, i) => {
        ctx.beginPath();
        ctx.lineWidth = p.r / 2;
        ctx.strokeStyle = p.color;
        ctx.moveTo(p.x + p.tilt + p.r/4, p.y);
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r/4);
        ctx.stroke();
    });
    updateConfetti();
}

function updateConfetti() {
    confettiPieces.forEach((p, i) => {
        p.tiltAngle += p.tiltAngleIncremental;
        p.y += (Math.cos(p.d) + 3 + p.r/2)/2;
        p.x += Math.sin(0.01);
        p.tilt = Math.sin(p.tiltAngle) * 15;

        if (p.y > canvas.height) {
            confettiPieces[i] = {
                x: Math.random() * canvas.width,
                y: -20,
                r: p.r,
                d: p.d,
                color: colors[Math.floor(Math.random() * colors.length)],
                tilt: Math.floor(Math.random() * 10) - 10,
                tiltAngleIncremental: p.tiltAngleIncremental,
                tiltAngle: 0
            };
        }
    });
    requestAnimationFrame(drawConfetti);
}

// ===== Event for buttons =====
function a() {
    createConfetti();
    drawConfetti();
    setTimeout(()=> confettiPieces=[], 99999999000000000); // بعد 5 ثانیه توقف کنه
}
a();

document.addEventListener("DOMContentLoaded", function () {
  const audio = document.getElementById("backgroundMusic");
  const toggleButton = document.getElementById("toggleMusic");
  const volumeSlider = document.getElementById("volumeSlider");

  // تنظیمات اولیه
  audio.volume = 1;
  let userInteracted = false;

  

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
