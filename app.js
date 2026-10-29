const canvas = document.querySelector("#stage");
const ctx = canvas.getContext("2d");
const step = document.querySelector("#step");
const duration = document.querySelector("#duration");
const stepValue = document.querySelector("#step-value");
const durationValue = document.querySelector("#duration-value");
const playButton = document.querySelector("#play");
const exportButton = document.querySelector("#export");
const resetButton = document.querySelector("#reset");
const status = document.querySelector("#status");

const initial = { x: canvas.width / 2, y: canvas.height / 2 + 20 };
const mascot = { ...initial };
let animationFrame = null;
let animationStart = 0;
let isPlaying = false;

function draw(time = 0, animated = isPlaying) {
  const { width, height } = canvas;
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#272a52");
  gradient.addColorStop(1, "#131629");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "#ffffff0c";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = 0; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

  const animate = animated;
  const bounce = animate ? Math.sin(time / 100) * 5 : 0;
  const travel = animate ? Math.sin(time / 500) * 90 : 0;
  const x = Math.max(65, Math.min(canvas.width - 65, mascot.x + travel));
  const y = mascot.y + bounce;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#080a1490";
  ctx.beginPath(); ctx.ellipse(0, 72 - bounce, 64, 13, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffcf70";
  ctx.beginPath(); ctx.arc(0, 0, 53, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#f29d62";
  ctx.beginPath(); ctx.arc(-42, -41, 22, 0, Math.PI * 2); ctx.arc(42, -41, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff4d8";
  ctx.beginPath(); ctx.arc(-17, -8, 8, 0, Math.PI * 2); ctx.arc(17, -8, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#25243c";
  ctx.beginPath(); ctx.arc(-15, -7, 4, 0, Math.PI * 2); ctx.arc(15, -7, 4, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#25243c"; ctx.lineWidth = 4; ctx.lineCap = "round";
  ctx.beginPath(); ctx.arc(0, 10, 17, .15, Math.PI - .15); ctx.stroke();
  ctx.restore();
}

function move(direction) {
  const distance = Number(step.value);
  const bounds = { x: 65, y: 65 };
  if (direction === "up") mascot.y -= distance;
  if (direction === "down") mascot.y += distance;
  if (direction === "left") mascot.x -= distance;
  if (direction === "right") mascot.x += distance;
  mascot.x = Math.max(bounds.x, Math.min(canvas.width - bounds.x, mascot.x));
  mascot.y = Math.max(bounds.y, Math.min(canvas.height - bounds.y, mascot.y));
  draw();
  status.textContent = `Posición: ${Math.round(mascot.x)}, ${Math.round(mascot.y)}`;
}

function frame(time) {
  const elapsed = time - animationStart;
  draw(time);
  if (elapsed < Number(duration.value) * 1000) animationFrame = requestAnimationFrame(frame);
  else stopAnimation();
}

function startAnimation() {
  if (isPlaying) return;
  isPlaying = true; playButton.textContent = "⏸ Reproducir"; status.textContent = "Reproduciendo animación...";
  animationStart = performance.now(); animationFrame = requestAnimationFrame(frame);
}

function stopAnimation() {
  isPlaying = false; playButton.textContent = "▶ Reproducir";
  if (animationFrame) cancelAnimationFrame(animationFrame);
  animationFrame = null; draw();
}

function reset() {
  stopAnimation(); Object.assign(mascot, initial); status.textContent = "Listo para animar."; draw();
}

function exportGif() {
  if (typeof GIF === "undefined") {
    status.textContent = "No se pudo cargar el exportador GIF.";
    return;
  }
  stopAnimation(); exportButton.disabled = true; status.textContent = "Generando GIF...";
  const gif = new GIF({
    workers: 2,
    quality: 10,
    width: canvas.width,
    height: canvas.height,
    workerScript: "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.worker.js",
  });
  const frames = 24;
  for (let i = 0; i < frames; i += 1) {
    draw(i * (Number(duration.value) * 1000 / frames), true);
    gif.addFrame(canvas, { copy: true, delay: (Number(duration.value) * 1000) / frames });
  }
  gif.on("finished", (blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = "giantuchi-animacion.gif"; link.click();
    URL.revokeObjectURL(url); exportButton.disabled = false; status.textContent = "GIF exportado con movimiento.";
    draw();
  });
  gif.render();
}

document.querySelectorAll(".move-button").forEach((button) => button.addEventListener("click", () => move(button.dataset.direction)));
document.addEventListener("keydown", (event) => {
  const keys = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
  if (keys[event.key]) { event.preventDefault(); move(keys[event.key]); }
  if (event.code === "Space") { event.preventDefault(); isPlaying ? stopAnimation() : startAnimation(); }
});
step.addEventListener("input", () => { stepValue.textContent = step.value; });
duration.addEventListener("input", () => { durationValue.textContent = duration.value; });
playButton.addEventListener("click", () => (isPlaying ? stopAnimation() : startAnimation()));
resetButton.addEventListener("click", reset);
exportButton.addEventListener("click", exportGif);

const gifScript = document.createElement("script");
gifScript.src = "https://cdn.jsdelivr.net/npm/gif.js@0.2.0/dist/gif.js";
gifScript.onload = () => { status.textContent = "Listo para animar y exportar."; };
gifScript.onerror = () => { status.textContent = "Abre con conexión a internet para exportar GIF."; };
document.head.appendChild(gifScript);
draw();
