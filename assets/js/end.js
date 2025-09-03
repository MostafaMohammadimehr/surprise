// ===== Confetti پیشرفته =====
const canvas = document.getElementById('confetti');
const ctx = canvas.getContext('2d');

function resizeCanvas(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const confettiCount = 200;
const confetti = [];

for(let i=0;i<confettiCount;i++){
    confetti.push({
        x: Math.random()*canvas.width,
        y: Math.random()*canvas.height - canvas.height,
        r: Math.random()*8 + 5,
        d: Math.random()*confettiCount,
        color: `hsl(${Math.random()*360}, 70%, 60%)`,
        tilt: Math.random()*10 - 10,
        tiltAngleIncrement: Math.random()*0.07 + 0.05,
        tiltAngle: 0
    });
}

function drawConfetti(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    confetti.forEach(c=>{
        ctx.beginPath();
        ctx.lineWidth = c.r;
        ctx.strokeStyle = c.color;
        ctx.moveTo(c.x + c.tilt + c.r/2, c.y);
        ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r/2);
        ctx.stroke();
    });
    updateConfetti();
}

function updateConfetti(){
    confetti.forEach(c=>{
        c.tiltAngle += c.tiltAngleIncrement;
        c.y += Math.cos(c.d) + 2 + c.r/2;
        c.tilt = Math.sin(c.tiltAngle)*15;

        if(c.y > canvas.height){
            c.x = Math.random()*canvas.width;
            c.y = -20;
            c.tilt = Math.random()*10 -10;
        }
    });
    requestAnimationFrame(drawConfetti);
}

drawConfetti();

// ===== دکمه بازگشت =====
document.getElementById('replayBtn').addEventListener('click', ()=>{
    window.location.href = "main.html";
});

document.addEventListener("DOMContentLoaded", function () {
  const audio = document.getElementById("backgroundMusic");
  const toggleButton = document.getElementById("toggleMusic");
  const volumeSlider = document.getElementById("volumeSlider");

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

