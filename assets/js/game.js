(() => {
  const canvas = document.getElementById("game");
  const levelEl = document.getElementById("level");
  const ballsEl = document.getElementById("balls");
  const bestEl = document.getElementById("best");
  const restartBtn = document.getElementById("restart");
  const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  const ctx = canvas.getContext("2d");

  let W = 0,
    H = 0;
  let gridCols = 7,
    gridPad = 8,
    topMargin = 70,
    cellSize = 0;
  let level = 1,
    baseBallCount = 1,
    balls = [],
    aiming = false,
    aimStart = null,
    aimPoint = null,
    turnLaunched = false;
  let blocks = [],
    bonuses = [],
    returnedThisTurn = 0,
    anchorX = 0;
  let best = Number(localStorage.getItem("bb_best") || 0);
  bestEl.textContent = best;
  let timer = 0,
    timerInterval = null;

  const rnd = (a, b) => Math.random() * (b - a) + a;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  function resize() {
    const rect = canvas.getBoundingClientRect();
    W = Math.floor(rect.width * dpr);
    H = Math.floor(rect.height * dpr);
    canvas.width = W;
    canvas.height = H;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cellSize = Math.floor((rect.width - gridPad * 2) / gridCols);
    topMargin = Math.max(60, Math.floor(rect.height * 0.07));
    anchorX = rect.width / 2;
  }
  resize();
  window.addEventListener("resize", resize);

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
      if (--this.hp <= 0) this.dead = true;
    }
    draw() {
      roundRect(
        ctx,
        this.x + 3,
        this.y + 3,
        this.w,
        this.h,
        10,
        "#00000010",
        true,
        false
      );
      roundRect(
        ctx,
        this.x,
        this.y,
        this.w,
        this.h,
        10,
        getCSS("--brick"),
        true,
        false
      );
      ctx.fillStyle = getCSS("--brickText");
      ctx.font = `bold ${Math.floor(cellSize * 0.35)}px system-ui`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.hp, this.x + this.w / 2, this.y + this.h / 2);
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
      this.x += this.vx * dt;
      this.y += this.vy * dt;
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
          const left = this.x - bx,
            right = bx + bw - this.x,
            top = this.y - by,
            bottom = by + bh - this.y;
          const minH = Math.min(left, right, top, bottom);
          if (minH === left || minH === right) this.vx *= -1;
          else this.vy *= -1;
          b.hit();
        }
      }

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

      if (this.vy > 0 && this.y >= canvas.clientHeight - this.r) {
        this.y = canvas.clientHeight - this.r;
        this.vx = 0;
        this.vy = 0;
        this.resting = true;
        returnedThisTurn++;
        if (returnedThisTurn === 1) anchorX = this.x;
        if (returnedThisTurn === balls.length) endTurn();
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = getCSS("--ball");
      ctx.fill();
    }
  }

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

  function spawnRow() {
    const taken = new Set();
    const count = Math.floor(rnd(2, 1 + Math.min(gridCols, 3 + level * 0.35)));
    for (let i = 0; i < count; i++) {
      let c = Math.floor(rnd(0, gridCols));
      while (taken.has(c)) c = Math.floor(rnd(0, gridCols));
      taken.add(c);
      blocks.push(new Block(c, 0, level));
    }
    if (Math.random() < 0.8) {
      let c = Math.floor(rnd(0, gridCols));
      bonuses.push(new Bonus(c, 0));
    }
  }
  function dropRows() {
    for (const b of blocks) b.r++;
    for (const p of bonuses) p.r++;
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
    const speed = 520 / 60;
    for (let i = 0; i < count; i++) {
      const delay = i * 60;
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
    balls.length = 0;
    turnLaunched = false;
    clearInterval(timerInterval);
    alert(
      "بازی تموم شد!\nمرحله: " + (level - 1) + "\nزمان: " + timer + " ثانیه"
    );
  }

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
    let dx = p.x - aimStart.x,
      dy = p.y - aimStart.y;
    if (dy > -10) dy = -10;
    const len = Math.hypot(dx, dy) || 1;
    startTurn(dx / len, dy / len);
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
    timer = 0;
    spawnRow();
  });

  let last = performance.now();
  function loop(now) {
    const dt = Math.min(32, now - last);
    last = now;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    const gw = cellSize * gridCols,
      gx = gridPad,
      gy = topMargin;
    ctx.strokeStyle = getCSS("--border");
    ctx.lineWidth = 1;
    ctx.strokeRect(
      gx,
      gy,
      gw,
      Math.floor((canvas.clientHeight - topMargin) / cellSize) * cellSize
    );
    for (const b of blocks) b.draw();
    for (const p of bonuses) p.draw();
    if (aiming && aimStart && aimPoint) drawAimDots(aimStart, aimPoint);
    for (const ball of balls) ball.step(dt);
    for (const ball of balls) ball.draw();
    requestAnimationFrame(loop);
  }

  function drawAimDots(a, p) {
    let dx = p.x - a.x,
      dy = p.y - a.y;
    if (dy > -10) dy = -10;
    const len = Math.hypot(dx, dy) || 1;
    dx /= len;
    dy /= len;
    const step = 16;
    ctx.fillStyle = getCSS("--aim");
    for (let i = 1; i <= 20; i++) {
      const x = a.x + dx * step * i,
        y = a.y + dy * step * i;
      if (y < topMargin + 4) break;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  spawnRow();
  requestAnimationFrame(loop);
  timerInterval = setInterval(() => {
    timer++;
  }, 1000);
})();
