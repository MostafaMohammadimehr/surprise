const sections = document.querySelectorAll(".section");
const dots = document.querySelectorAll(".dot");
let current = 0;

function goToSection(index) {
  if (index < 0 || index >= sections.length) return;
  current = index;
  document.getElementById("container").style.transform = `translateY(-${
    index * 100
  }vh)`;
  dots.forEach((dot) => dot.classList.remove("active"));
  dots[index].classList.add("active");
}

// دکمه‌های کیبورد
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown") goToSection(current + 1);
  if (e.key === "ArrowUp") goToSection(current - 1);
});

// کلیک روی دات‌ها
dots.forEach((dot) => {
  dot.addEventListener("click", () => {
    goToSection(parseInt(dot.dataset.index));
  });
});

// لمس روی گوشی
let startY = 0;
document.addEventListener("touchstart", (e) => {
  startY = e.touches[0].clientY;
});
document.addEventListener("touchend", (e) => {
  let endY = e.changedTouches[0].clientY;
  if (startY - endY > 50) goToSection(current + 1); // swipe up
  if (endY - startY > 50) goToSection(current - 1); // swipe down
});

// اسکرول موس
let scrollTimeout;
document.addEventListener("wheel", (e) => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    if (e.deltaY > 0) {
      goToSection(current + 1); // اسکرول به پایین
    } else {
      goToSection(current - 1); // اسکرول به بالا
    }
  }, 100); // جلوگیری از پرش سریع
});
