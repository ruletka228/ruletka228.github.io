let canvas = document.getElementById('wheel');
let ctx = canvas.getContext('2d');

let segments = [];
let segmentColors = [];
let angle = 0;
let velocity = 0;
let spinning = false;

let customChances = {}; // { "🍕": 3, "🍔": 1 }
let wheelPool = [];
const pointerOffset = 270;

function renderWheel() {
  let input = document.getElementById('input').value;
  segments = input.split(',').map(s => s.trim()).filter(s => s);
  if (segments.length === 0) return;
  segmentColors = segments.map(s => isColor(s) ? s : getRandomColor());

  wheelPool = [];
  segments.forEach(seg => {
    const weight = customChances[seg] || 1;
    for (let i = 0; i < weight; i++) wheelPool.push(seg);
  });

  angle = 0;
  drawRotatedWheel(angle);
}

function drawRotatedWheel(currentAngleDegrees) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate(currentAngleDegrees * Math.PI / 180);
  ctx.translate(-canvas.width / 2, -canvas.height / 2);
  drawWheel();
  ctx.restore();
}

function drawWheel() {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 200;
  if (segments.length === 0) return;
  const anglePerSegment = (2 * Math.PI) / segments.length;

  for (let i = 0; i < segments.length; i++) {
    const startAngle = i * anglePerSegment;
    const endAngle = startAngle + anglePerSegment;

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.fillStyle = segmentColors[i] || '#ccc';
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.fill();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(startAngle + anglePerSegment / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = 'black';
    ctx.font = '20px sans-serif';
    ctx.fillText(segments[i], radius - 10, 8);
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(centerX, centerY, 10, 0, 2 * Math.PI);
  ctx.fillStyle = "#000";
  ctx.fill();
}

function getRandomColor() {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

function isColor(str) {
  const s = new Option().style;
  s.color = str;
  return s.color !== '';
}

function spinWheel() {
  if (spinning || segments.length === 0) return;

  let target = segments[Math.floor(Math.random() * segments.length)];
  if (wheelPool.length > 0) {
    target = wheelPool[Math.floor(Math.random() * wheelPool.length)];
  }

  const anglePerSegment = 360 / segments.length;
  const targetIndex = segments.indexOf(target);
  const stopAngle = 360 * 10 + (360 - (targetIndex + 0.5) * anglePerSegment + pointerOffset) % 360;

  const duration = 7000; // 7 секунд
  const frameRate = 60;
  const totalFrames = Math.round(duration / (1000 / frameRate));
  let currentFrame = 0;
  const startAngle = angle % 360;
  const spinAudio = new Audio('spin.mp3');
  spinAudio.loop = true;
  spinAudio.play();

  spinning = true;

  function smoothStep(start, end, t) {
    t = Math.max(0, Math.min(1, t));
    t = t * t * (3 - 2 * t);
    return start + (end - start) * t;
  }

  function animatePrecise() {
    if (currentFrame <= totalFrames) {
      const t = currentFrame / totalFrames;
      angle = smoothStep(startAngle, stopAngle, t);
      drawRotatedWheel(angle);
      currentFrame++;
      requestAnimationFrame(animatePrecise);
    } else {
      spinAudio.pause();
      spinAudio.currentTime = 0;
      new Audio('win.mp3').play();
      spinning = false;
      document.getElementById('result').innerHTML = `🎯 <span style="color: limegreen; font-size: 22px;">Выпало:</span> ${target}`;
      addToHistory(target);
    }
  }

  animatePrecise();
}

renderWheel();

// === История: Очистка ===
function clearHistory() {
  const ul = document.getElementById('history');
  if (ul) ul.innerHTML = '';
}

// === Переключение темы ===
function toggleTheme() {
  document.body.classList.toggle('light');
}

// === Физика мышки ===
let isDragging = false;
let lastAngle = 0;
let lastTime = 0;
let dragVelocity = 0;

canvas.addEventListener('mousedown', (e) => {
  if (spinning) return;
  isDragging = true;
  lastAngle = getMouseAngle(e);
  lastTime = performance.now();
});

canvas.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  const currentAngle = getMouseAngle(e);
  const delta = currentAngle - lastAngle;
  angle += delta * 180 / Math.PI;
  lastAngle = currentAngle;

  const now = performance.now();
  const dt = now - lastTime;
  dragVelocity = (delta * 180 / Math.PI) / dt * 16;
  lastTime = now;

  drawRotatedWheel(angle);
});

canvas.addEventListener('mouseup', () => {
  if (!isDragging) return;
  isDragging = false;
  if (Math.abs(dragVelocity) > 0.5) {
    velocity = dragVelocity;
    spinWheel();
  }
});

canvas.addEventListener('mouseleave', () => {
  if (isDragging) canvas.dispatchEvent(new Event('mouseup'));
});

function getMouseAngle(e) {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left - canvas.width / 2;
  const y = e.clientY - rect.top - canvas.height / 2;
  return Math.atan2(y, x);
}

function addToHistory(value) {
  const ul = document.getElementById('history');
  if (!ul) return;
  const li = document.createElement('li');
  li.textContent = value;
  ul.prepend(li);
  while (ul.children.length > 50) {
    ul.removeChild(ul.lastChild);
  }
}

// === UI обработчики ===
document.querySelector('button[onclick="renderWheel()"').onclick = () => renderWheel();
document.querySelector('button[onclick="spinWheel()"').onclick = () => spinWheel();
document.querySelector('button[onclick="spinWheelAgain()"')?.addEventListener('click', () => spinWheel());



// === Меню подкрутки шансов ===
function toggleCheatMenu() {
  const password = "7421";
  if (!window._cheatUnlocked) {
    const attempt = prompt("Введите пароль:");
    if (attempt !== password) {
      alert("Неверный пароль");
      return;
    }
    window._cheatUnlocked = true;
  }
  let menu = document.getElementById('cheat-menu');
  if (menu) return menu.remove();

  menu = document.createElement('div');
  menu.id = 'cheat-menu';
  Object.assign(menu.style, {
    position: 'fixed', top: '50px', right: '20px', background: '#111', color: '#fff',
    padding: '20px', border: '2px solid lime', zIndex: '9999'
  });

  const input = document.createElement('textarea');
  input.placeholder = '🍕=3, 🍔=1, 🌭=2';
  input.style.width = '200px';
  input.style.height = '100px';
  input.value = Object.entries(customChances).map(([k, v]) => `${k}=${v}`).join(', ');

  const btn = document.createElement('button');
  btn.textContent = '✅ Применить';
  btn.onclick = () => {
    const parsed = input.value.split(',').map(p => p.trim().split('='));
    customChances = {};
    parsed.forEach(([key, val]) => {
      if (key && val && !isNaN(+val)) customChances[key.trim()] = +val;
    });
    renderWheel();
  };

  const close = document.createElement('button');
  close.textContent = '❌';
  close.onclick = () => menu.remove();

  menu.append(input, document.createElement('br'), btn, close);
  document.body.appendChild(menu);
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Numpad7') toggleCheatMenu();
});
