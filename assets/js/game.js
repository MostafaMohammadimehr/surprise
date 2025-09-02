/* بازی توپ و بلاک – نسخه‌ی ساده و ریسپانسیو
   ویژگی‌ها:
   - هدف‌گیری با ماوس/تاچ + نمایش نقطه‌چین
   - پرتاب چند توپ با تاخیر کوتاه
   - بلاک‌های عدددار که هر راند یک ردیف پایین می‌آیند
   - دایره‌ی سبز که توپ اضافه می‌دهد
   - پایان بازی وقتی بلاک‌ها به پایین برسند
*/

(() => {
  const canvas = document.getElementById("game");
  const levelEl = document.getElementById("level");
  const ballsEl = document.getElementById("balls");
  const bestEl = document.getElementById("best");
  const restartBtn = document.getElementById("restart");
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1)); // وضوح
  const ctx = canvas.getContext("2d");

  // حالت‌ها
  let W = 0,
    H = 0;
  let gridCols = 7; // تعداد ستون‌ها
  let gridPad = 8; // فاصله داخلی
  let topMargin = 70; // فضای بالای شبکه (برای دید بهتر)
  let cellSize = 0;

  let level = 1;
  let baseBallCount = 1;
  let balls = [];
  let aiming = false;
  let aimStart = null;
  let aimPoint = null;
  let turnLaunched = false;
  let blocks = [];
  let bonuses = []; // دایره‌های سبز
  let returnedThisTurn = 0;
  let anchorX = 0; // محل شروع توپ‌ها (ته صفحه)
  let best = Number(localStorage.getItem("bb_best") || 0);
  bestEl.textContent = best;

  const rnd = (a, b) => Math.random() * (b - a) + a;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function resize() {
    // بوم با نسبت داخل CSS بزرگ/کوچک می‌شود؛ اینجا رزولوشن واقعی را تنظیم می‌کنیم
    const rect = canvas.getBoundingClientRect();
    W = Math.floor(rect.width * dpr);
    H = Math.floor(rect.height * dpr);
    canvas.width = W;
    canvas.height = H;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // تا مقیاس‌گذاری نقاشی همخوان باشد

    // اندازه‌ی سلول‌ها
    const usableW = rect.width - gridPad * 2;
    cellSize = Math.floor(usableW / gridCols);
    topMargin = Math.max(60, Math.floor(rect.height * 0.07));
    anchorX = rect.width / 2;
  }
  resize();
  window.addEventListener("resize", resize);

  // مدل‌ها
  class Block {
    constructor(c, r, hp) {
      this.c = c;
      this.r = r;
      this.hp = hp;
      this.dead = false;
    }
    get x() {
      return gridPad + this.c * cellSize;
    }
    get y() {
      return topMargin + this.r * cellSize;
    }
    get w() {
      return cellSize - 6;
    }
    get h() {
      return cellSize - 6;
    }
    hit() {
      this.hp--;
      if (this.hp <= 0) this.dead = true;
    }
    draw() {
      const x = this.x,
        y = this.y,
        w = this.w,
        h = this.h;
      // بدنه
      roundRect(ctx, x + 3, y + 3, w, h, 10, "#00000010", true, false);
      roundRect(ctx, x, y, w, h, 10, getCSS("--brick"), true, false);
      // عدد
      ctx.fillStyle = getCSS("--brickText");
      ctx.font = `bold ${Math.floor(cellSize * 0.35)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.hp, x + w / 2, y + h / 2);
    }
  }

  class Bonus {
    constructor(c, r) {
      this.c = c;
      this.r = r;
      this.dead = false;
    }
    get x() {
      return gridPad + this.c * cellSize + cellSize / 2;
    }
    get y() {
      return topMargin + this.r * cellSize + cellSize / 2;
    }
    get radius() {
      return Math.max(10, cellSize * 0.22);
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = getCSS("--bonus");
      ctx.fill();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
    }
  }

  class Ball {
    constructor(x, y, vx, vy) {
      this.x = x;
      this.y = y;
      this.vx = vx;
      this.vy = vy;
      this.r = 6;
      this.resting = false;
    }
    step(dt) {
      if (this.resting) return;

      // حرکت
      this.x += this.vx * dt;
      this.y += this.vy * dt;

      // دیوارها
      if (this.x < this.r) {
        this.x = this.r;
        this.vx *= -1;
      }
      if (this.x > canvas.clientWidth - this.r) {
        this.x = canvas.clientWidth - this.r;
        this.vx *= -1;
      }
      if (this.y < topMargin + this.r * 0.5) {
        this.y = topMargin + this.r * 0.5;
        this.vy *= -1;
      }

      // برخورد با بلاک‌ها (AABB ساده)
      for (const b of blocks) {
        if (b.dead) continue;
        const bx = b.x,
          by = b.y,
          bw = b.w,
          bh = b.h;
        if (
          this.x > bx &&
          this.x < bx + bw &&
          this.y > by &&
          this.y < by + bh
        ) {
          // تشخیص ساده‌ی سمت برخورد
          const left = this.x - bx;
          const right = bx + bw - this.x;
          const top = this.y - by;
          const bottom = by + bh - this.y;
          const minH = Math.min(left, right, top, bottom);
          if (minH === left || minH === right) this.vx *= -1;
          else this.vy *= -1;
          b.hit();
        }
      }

      // برخورد با بونس
      for (const p of bonuses) {
        if (p.dead) continue;
        const dx = this.x - p.x,
          dy = this.y - p.y;
        if (Math.hypot(dx, dy) < this.r + p.radius) {
          p.dead = true;
          baseBallCount++;
          ballsEl.textContent = baseBallCount;
        }
      }

      // فرود به پایین
      if (this.vy > 0 && this.y >= canvas.clientHeight - this.r) {
        this.y = canvas.clientHeight - this.r;
        this.vx = 0;
        this.vy = 0;
        this.resting = true;
        returnedThisTurn++;
        // اولین توپی که برگردد، مبدا پرتاب بعدی را مشخص می‌کند
        if (returnedThisTurn === 1) anchorX = this.x;
        if (returnedThisTurn === balls.length) {
          endTurn();
        }
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = getCSS("--ball");
      ctx.fill();
    }
  }

  // ابزارها
  function getCSS(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }
  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    const rr = Math.min(r, Math.min(w, h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill === true ? getCSS("--panel") : fill;
      ctx.fill();
    }
    if (stroke) {
      ctx.strokeStyle = stroke === true ? "#000" : stroke;
      ctx.stroke();
    }
  }

  // تولید ردیف جدید
  function spawnRow() {
    // بلاک‌ها
    const taken = new Set();
    const count = Math.floor(rnd(2, 1 + Math.min(gridCols, 3 + level * 0.35)));
    for (let i = 0; i < count; i++) {
      let c = Math.floor(rnd(0, gridCols));
      while (taken.has(c)) c = Math.floor(rnd(0, gridCols));
      taken.add(c);
      blocks.push(new Block(c, 0, level));
    }
    // یک بونس سبز اختیاری
    if (Math.random() < 0.8) {
      let c = Math.floor(rnd(0, gridCols));
      bonuses.push(new Bonus(c, 0));
    }
  }

  function dropRows() {
    for (const b of blocks) b.r++;
    for (const p of bonuses) p.r++;
    // اگر بلاکی به پایین برسد => گیم‌اور
    const lastRowY =
      topMargin +
      (Math.floor((canvas.clientHeight - topMargin) / cellSize) - 1) * cellSize;
    for (const b of blocks) {
      if (b.dead) continue;
      if (b.y + b.h >= canvas.clientHeight - 2) {
        gameOver();
        return;
      }
    }
  }

  function startTurn(vx, vy) {
    returnedThisTurn = 0;
    balls = [];
    turnLaunched = true;
    const count = baseBallCount;
    const speed = 520 / 60; // px per frame تقریبی
    for (let i = 0; i < count; i++) {
      const delay = i * 60; // میلی‌ثانیه
      setTimeout(() => {
        balls.push(
          new Ball(anchorX, canvas.clientHeight - 8, vx * speed, vy * speed)
        );
      }, delay);
    }
  }

  function endTurn() {
    turnLaunched = false;
    level++;
    levelEl.textContent = level;
    // پاکسازی
    blocks = blocks.filter((b) => !b.dead);
    bonuses = bonuses.filter((p) => !p.dead);
    dropRows();
    spawnRow();
  }

  function gameOver() {
    document.body.classList.add("game-over");
    best = Math.max(best, level - 1);
    localStorage.setItem("bb_best", best);
    bestEl.textContent = best;
    // توقف همه توپ‌ها
    balls.length = 0;
    turnLaunched = false;
  }

  // ورودی‌ها
  function clientPos(e) {
    if (e.touches && e.touches[0])
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: e.clientX, y: e.clientY };
  }
  function toCanvas(p) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: clamp(p.x - rect.left, 0, rect.width),
      y: clamp(p.y - rect.top, 0, rect.height),
    };
  }

  canvas.addEventListener("pointerdown", (e) => {
    if (turnLaunched) return;
    aiming = true;
    canvas.setPointerCapture(e.pointerId);
    aimStart = { x: anchorX, y: canvas.getBoundingClientRect().height - 8 };
    aimPoint = toCanvas(clientPos(e));
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!aiming || turnLaunched) return;
    aimPoint = toCanvas(clientPos(e));
  });
  canvas.addEventListener("pointerup", (e) => {
    if (!aiming || turnLaunched) return;
    aiming = false;
    const p = toCanvas(clientPos(e));
    // بردار سرعت
    let dx = p.x - aimStart.x;
    let dy = p.y - aimStart.y;
    // فقط به بالا
    if (dy > -10) dy = -10;
    const len = Math.hypot(dx, dy) || 1;
    const vx = dx / len;
    const vy = dy / len;
    startTurn(vx, vy);
  });

  restartBtn.addEventListener("click", () => {
    document.body.classList.remove("game-over");
    level = 1;
    baseBallCount = 1;
    levelEl.textContent = level;
    ballsEl.textContent = baseBallCount;
    balls.length = 0;
    blocks.length = 0;
    bonuses.length = 0;
    spawnRow();
  });

  // حلقه‌ی بازی
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(32, now - last); // ms
    last = now;

    // پس‌زمینه بوم
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // شبکه‌ی راهنما
    ctx.strokeStyle = getCSS("--border");
    ctx.lineWidth = 1;
    const gw = cellSize * gridCols;
    const gx = gridPad,
      gy = topMargin;
    ctx.strokeRect(
      gx,
      gy,
      gw,
      Math.floor((canvas.clientHeight - topMargin) / cellSize) * cellSize
    );

    // رسم بلاک‌ها و بونس‌ها
    for (const b of blocks) b.draw();
    for (const p of bonuses) p.draw();

    // نشانه‌گیری
    if (aiming && aimStart && aimPoint) {
      drawAimDots(aimStart, aimPoint);
      // مبدا نشانه را نیز نشان بده
      ctx.beginPath();
      ctx.arc(aimStart.x, aimStart.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = getCSS("--ball");
      ctx.fill();
    }

    // توپ‌ها
    for (const ball of balls) ball.step(dt);
    for (const ball of balls) ball.draw();

    requestAnimationFrame(loop);
  }

  function drawAimDots(a, p) {
    let dx = p.x - a.x,
      dy = p.y - a.y;
    if (dy > -10) dy = -10; // مجبوراً رو به بالا
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const step = 16;
    ctx.fillStyle = getCSS("--aim");
    for (let i = 1; i <= 20; i++) {
      const x = a.x + dx * step * i;
      const y = a.y + dy * step * i;
      if (y < topMargin + 4) break;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // شروع بازی
  spawnRow();
  requestAnimationFrame(loop);
})();
