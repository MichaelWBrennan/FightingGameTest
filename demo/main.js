const timerEl = document.getElementById('timer');
const p1Fill = document.getElementById('p1-fill');
const p2Fill = document.getElementById('p2-fill');

let p1Health = 100;
let p2Health = 100;
let timer = 99;
let ticking = false;
let tickHandle = null;

function setHealth(player, value) {
  const clamped = Math.max(0, Math.min(100, value));
  if (player === 1) {
    p1Health = clamped;
    p1Fill.style.width = `${clamped}%`;
  } else {
    p2Health = clamped;
    p2Fill.style.width = `${clamped}%`;
  }
}

function setTimer(value) {
  timer = Math.max(0, Math.min(999, value));
  timerEl.textContent = String(timer).padStart(2, '0');
}

function startTimer() {
  if (ticking) return;
  ticking = true;
  tickHandle = setInterval(() => {
    if (timer <= 0) {
      stopTimer();
      return;
    }
    setTimer(timer - 1);
  }, 1000);
}

function stopTimer() {
  if (!ticking) return;
  ticking = false;
  if (tickHandle) clearInterval(tickHandle);
  tickHandle = null;
}

function resetTimer() {
  stopTimer();
  setTimer(99);
}

document.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const action = btn.getAttribute('data-action');
  switch (action) {
    case 'p1-minus': setHealth(1, p1Health - 10); break;
    case 'p1-plus': setHealth(1, p1Health + 10); break;
    case 'p2-minus': setHealth(2, p2Health - 10); break;
    case 'p2-plus': setHealth(2, p2Health + 10); break;
    case 'timer-reset': resetTimer(); break;
    case 'timer-toggle': ticking ? stopTimer() : startTimer(); break;
  }
});

// initial state
setHealth(1, 100);
setHealth(2, 100);
setTimer(99);

