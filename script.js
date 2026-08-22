// =========================================================
// CACTUS CRAWLER — Core logic (cacti as PNG / monsters as emoji)
// =========================================================

// ---------- CURRENCIES & PROGRESS ----------
let water = 0;
let gold = 0;
let floor = 1;

// ---------- STATS (used by the quest system) ----------
let stats = {
  monstersDefeated: 0,
  floorsCleared: 1,
  totalGoldEarned: 0,
  chestsOpened: 0,
  slotSpins: 0
};

// ---------- CACTUS CHARACTERS (with PNG image paths) ----------
// Drop a matching PNG into the assets folder to change how each cactus looks.
// Every cactus tracks its own hydration — it dries out a little with every
// attack and needs to be refilled with water (in the Oasis tab) before it
// can fight again.
const CHARACTERS = {
  basic: {
    id: 'basic', name: 'Basic Cactus', img: 'assets/cactus.png',
    unlocked: true, reqFloor: 1, ability: null, abilityName: 'No Ability',
    abilityDesc: 'Reliable and balanced — no special ability.',
    waterPerClick: 1, waterUpgradeCost: 10,
    cactusPower: 1, powerUpgradeCost: 15,
    maxHydration: 100, hydration: 100, hydrationUpgradeCost: 40
  },
  ice: {
    id: 'ice', name: 'Ice Cactus', img: 'assets/ice_cactus.png',
    unlocked: false, reqFloor: 15, ability: 'freeze', abilityName: 'Frost Shock ❄️',
    abilityDesc: '25% chance to land a frost critical hit (x2 damage).',
    waterPerClick: 1, waterUpgradeCost: 10,
    cactusPower: 1, powerUpgradeCost: 15,
    maxHydration: 100, hydration: 100, hydrationUpgradeCost: 40
  },
  electro: {
    id: 'electro', name: 'Electro Cactus', img: 'assets/electro_cactus.png',
    unlocked: false, reqFloor: 25, ability: 'chain', abilityName: 'Chain Lightning ⚡',
    abilityDesc: '20% chance to immediately strike a second time.',
    waterPerClick: 1, waterUpgradeCost: 10,
    cactusPower: 1, powerUpgradeCost: 15,
    maxHydration: 100, hydration: 100, hydrationUpgradeCost: 40
  },
  fire: {
    id: 'fire', name: 'Fire Cactus', img: 'assets/fire_cactus.png',
    unlocked: false, reqFloor: 35, ability: 'burn', abilityName: 'Burn 🔥',
    abilityDesc: '30% chance to set the monster on fire.',
    waterPerClick: 1, waterUpgradeCost: 10,
    cactusPower: 1, powerUpgradeCost: 15,
    maxHydration: 100, hydration: 100, hydrationUpgradeCost: 40
  },
  trance: {
    id: 'trance', name: 'Trance Cactus', img: 'assets/trance_cactus.png',
    unlocked: false, reqFloor: 45, ability: 'trance', abilityName: 'Illusion Trance 🌀',
    abilityDesc: 'Warps the dungeon into a hypnotic illusion disc and dries out 20% slower.',
    waterPerClick: 1, waterUpgradeCost: 10,
    cactusPower: 1, powerUpgradeCost: 15,
    maxHydration: 100, hydration: 100, hydrationUpgradeCost: 40
  },
  robber: {
    id: 'robber', name: 'Robber Cactus', img: 'assets/robber_cactus.png',
    unlocked: false, reqFloor: 55, ability: 'robber', abilityName: 'Heist Strike 🥷',
    abilityDesc: 'Deals double damage, but defeated monsters drop no gold.',
    waterPerClick: 1, waterUpgradeCost: 10,
    cactusPower: 1, powerUpgradeCost: 15,
    maxHydration: 100, hydration: 100, hydrationUpgradeCost: 40
  }
};
let activeCharacterId = 'basic';
function getActive() { return CHARACTERS[activeCharacterId]; }

// ---------- MONSTER DATABASE (as emoji) ----------
const MONSTER_TYPES = [
  { name: "Desert Snail", emoji: "🐌", hpMul: 1.0, goldMul: 1.0 },
  { name: "Stone Golem", emoji: "🗿", hpMul: 1.5, goldMul: 1.4 },
  { name: "Shadow Dragon", emoji: "🐉", hpMul: 2.2, goldMul: 2.0 },
  { name: "Desert Fiend (BOSS)", emoji: "👹", hpMul: 3.5, goldMul: 3.5 }
];
let currentMonster = MONSTER_TYPES[0];
let monsterMaxHp = 20;
let monsterHp = 20;
let monsterInstanceId = 0;

// ---------- TEMPORARY BOOSTS (bought in the Oasis) ----------
let waterBoostMultiplier = 1;
let waterBoostEndTime = 0;
let powerBoostMultiplier = 1;
let powerBoostEndTime = 0;

// ---------- QUESTS ----------
function makeQuest(type, target, rewardGold, rewardWater) {
  return {
    id: type + '_' + target + '_' + Math.random().toString(36).slice(2, 7),
    type, target,
    rewardGold: rewardGold || 0,
    rewardWater: rewardWater || 0,
    completed: false
  };
}
let activeQuests = [
  makeQuest('monstersDefeated', 10, 50, 0),
  makeQuest('floorsCleared', 5, 80, 0),
  makeQuest('totalGoldEarned', 500, 0, 100),
  makeQuest('chestsOpened', 5, 60, 0),
  makeQuest('slotSpins', 10, 100, 0)
];

// ---------- DOM ELEMENTS ----------
const waterEl = document.getElementById('water');
const goldEl = document.getElementById('gold');
const powerEl = document.getElementById('power');
const cactusBtn = document.getElementById('cactus-clicker');

const monsterImg = document.getElementById('monster-img');
const monsterName = document.getElementById('monster-name');
const monsterBadge = document.getElementById('monster-type-badge');
const monsterHpEl = document.getElementById('monster-hp');
const monsterMaxHpEl = document.getElementById('monster-max-hp');
const monsterHpBar = document.getElementById('monster-hp-bar');
const monsterEntity = document.getElementById('monster-entity');
const rangeHint = document.getElementById('range-hint');
const dungeonZone = document.getElementById('dungeon-zone');
const arena = document.getElementById('arena');
const playerEntity = document.getElementById('player-entity');
const playerImg = document.getElementById('player-img');
const cratesLayer = document.getElementById('crates-layer');

const upgradeWaterBtn = document.getElementById('upgrade-water-btn');
const upgradePowerBtn = document.getElementById('upgrade-power-btn');
const spinSlotBtn = document.getElementById('spin-slot-btn');
const slotDisplay = document.getElementById('slot-display');
const openBoxBtn = document.getElementById('open-box-btn');
const randomEventItem = document.getElementById('random-event-item');
const soundToggleBtn = document.getElementById('sound-toggle-btn');
const activeCharNameEl = document.getElementById('active-char-name');
const activeCharAbilityEl = document.getElementById('active-char-ability');
const inventoryList = document.getElementById('inventory-list');
const oasisList = document.getElementById('oasis-list');
const questsList = document.getElementById('quests-list');

const hydrationBar = document.getElementById('hydration-bar');
const hydrationText = document.getElementById('hydration-text');
const quickRefillBtn = document.getElementById('quick-refill-btn');
const refillCostEl = document.getElementById('refill-cost');

// Helper function: visually turns an <img> into an emoji text field (for monsters)
function setMonsterEmoji(el, emojiStr) {
  if (!el) return;
  if (el.tagName === 'IMG') {
    let span = el.nextElementSibling;
    if (!span || !span.classList.contains('emoji-fallback')) {
      span = document.createElement('span');
      span.className = 'emoji-fallback';
      el.parentNode.insertBefore(span, el.nextSibling);
      el.style.display = 'none';
    }
    span.textContent = emojiStr;
    span.style.fontSize = "4rem";
    span.style.userSelect = 'none';
    span.style.display = 'inline-block';
  } else {
    el.textContent = emojiStr;
    el.style.fontSize = "4rem";
  }
}

// ---------- CANVAS PARTICLE SYSTEM ----------
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

let particles = [];
class Particle {
  constructor(x, y, color) {
    this.x = x; this.y = y; this.color = color;
    this.size = Math.random() * 6 + 2;
    this.speedX = (Math.random() - 0.5) * 8;
    this.speedY = (Math.random() - 0.5) * 8;
    this.alpha = 1;
  }
  update() { this.x += this.speedX; this.y += this.speedY; this.alpha -= 0.03; }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
function spawnParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) particles.push(new Particle(x, y, color));
}
function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  particles.forEach((p, index) => {
    p.update(); p.draw();
    if (p.alpha <= 0) particles.splice(index, 1);
  });
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ---------- AUDIO ----------
let audioCtx = null;
let muted = false;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}
function tone(freq, dur, type = 'square', vol = 0.15, delay = 0) {
  if (muted) return;
  ensureAudio();
  const t0 = audioCtx.currentTime + delay;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(gain).connect(audioCtx.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}
const sfx = {
  click: () => tone(520, 0.06, 'square', 0.08),
  hit: () => tone(160, 0.1, 'square', 0.15),
  ability: () => { tone(700, 0.08, 'sawtooth', 0.1); tone(950, 0.08, 'sawtooth', 0.1, 0.05); },
  death: () => { tone(300, 0.1, 'square', 0.15); tone(500, 0.12, 'square', 0.15, 0.08); tone(700, 0.16, 'square', 0.15, 0.16); },
  gold: () => { tone(660, 0.07, 'triangle', 0.12); tone(880, 0.09, 'triangle', 0.12, 0.06); },
  crate: () => { tone(400, 0.06, 'square', 0.1); tone(600, 0.08, 'square', 0.1, 0.05); },
  unlock: () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.12, i * 0.09)); },
  error: () => tone(120, 0.15, 'sawtooth', 0.1),
  upgrade: () => { tone(440, 0.06, 'triangle', 0.1); tone(660, 0.08, 'triangle', 0.1, 0.05); },
  splash: () => { tone(380, 0.06, 'sine', 0.12); tone(560, 0.08, 'sine', 0.12, 0.05); }
};

soundToggleBtn.addEventListener('click', () => {
  muted = !muted;
  soundToggleBtn.textContent = muted ? '🔇' : '🔊';
  ensureAudio();
  saveGame();
});
window.addEventListener('pointerdown', ensureAudio, { once: true });

// ---------- SAVE DATA ----------
const SAVE_KEY = 'cactuscrawler_save_v3';
function saveGame() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      water, gold, floor, activeCharacterId, muted,
      characters: CHARACTERS, stats, activeQuests
    }));
  } catch (e) {}
}
function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return;
    const d = JSON.parse(raw);
    water = d.water ?? 0;
    gold = d.gold ?? 0;
    floor = d.floor ?? 1;
    activeCharacterId = d.activeCharacterId || 'basic';
    muted = !!d.muted;
    if (d.characters) {
      Object.keys(d.characters).forEach(k => {
        if (CHARACTERS[k]) Object.assign(CHARACTERS[k], d.characters[k]);
      });
    }
    if (d.stats) Object.assign(stats, d.stats);
    if (Array.isArray(d.activeQuests) && d.activeQuests.length) activeQuests = d.activeQuests;
  } catch (e) {}
}

// ---------- UNLOCK CHECK ----------
function checkCharacterUnlocks() {
  Object.values(CHARACTERS).forEach(c => {
    if (!c.unlocked && floor >= c.reqFloor) {
      c.unlocked = true;
      createFloatingText(window.innerWidth / 2, window.innerHeight / 2, `NEW: ${c.name}! 🎉`, '#66fcf1');
      sfx.unlock();
    }
  });
}

// ---------- TABS SYSTEM ----------
document.getElementById('tab-upgrades-btn').addEventListener('click', (e) => switchTab(e, 'tab-upgrades'));
document.getElementById('tab-inventory-btn').addEventListener('click', (e) => switchTab(e, 'tab-inventory'));
document.getElementById('tab-oasis-btn').addEventListener('click', (e) => switchTab(e, 'tab-oasis'));
document.getElementById('tab-quests-btn').addEventListener('click', (e) => switchTab(e, 'tab-quests'));
document.getElementById('tab-gamble-btn').addEventListener('click', (e) => switchTab(e, 'tab-casino'));

function switchTab(e, tabId) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  e.currentTarget.classList.add('active');
  document.getElementById(tabId).classList.add('active');
  sfx.click();
}

// ---------- CLICKER ----------
cactusBtn.addEventListener('click', (e) => {
  const active = getActive();
  const gained = Math.max(1, Math.round(active.waterPerClick * waterBoostMultiplier));
  water += gained;
  createFloatingText(e.clientX, e.clientY, `+${gained} 💧`, '#66fcf1');
  spawnParticles(e.clientX, e.clientY, '#66fcf1', 8);
  sfx.click();
  updateUI();
});

// ---------- MOVEMENT ----------
const player = { x: 20, y: 120, speed: 150, facingLeft: false };
let monsterRatio = { x: 0.5, y: 0.5 };
const ATTACK_RANGE = 70;
const ATTACK_COOLDOWN = 450;
let lastAttackTime = 0;

const keys = { w: false, a: false, s: false, d: false };
const keyMap = { w: 'w', ArrowUp: 'w', a: 'a', ArrowLeft: 'a', s: 's', ArrowDown: 's', d: 'd', ArrowRight: 'd' };
window.addEventListener('keydown', (e) => { if (keyMap[e.key]) keys[keyMap[e.key]] = true; });
window.addEventListener('keyup', (e) => { if (keyMap[e.key]) keys[keyMap[e.key]] = false; });

const joystickBase = document.getElementById('joystick-base');
const joystickKnob = document.getElementById('joystick-knob');
const joystick = { active: false, x: 0, y: 0, radius: 40 };
let joystickCenter = { x: 0, y: 0 };

if (joystickBase) {
  joystickBase.addEventListener('pointerdown', (e) => {
    joystick.active = true;
    joystickBase.setPointerCapture(e.pointerId);
    const rect = joystickBase.getBoundingClientRect();
    joystickCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    updateJoystick(e);
  });
  joystickBase.addEventListener('pointermove', (e) => { if (joystick.active) updateJoystick(e); });
  joystickBase.addEventListener('pointerup', resetJoystick);
  joystickBase.addEventListener('pointercancel', resetJoystick);
}

function resetJoystick() {
  joystick.active = false; joystick.x = 0; joystick.y = 0;
  if (joystickKnob) joystickKnob.style.transform = 'translate(0px, 0px)';
}

function updateJoystick(e) {
  let dx = e.clientX - joystickCenter.x;
  let dy = e.clientY - joystickCenter.y;
  const dist = Math.min(Math.hypot(dx, dy), joystick.radius);
  const angle = Math.atan2(dy, dx);
  dx = Math.cos(angle) * dist;
  dy = Math.sin(angle) * dist;
  if (joystickKnob) joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  joystick.x = dx / joystick.radius;
  joystick.y = dy / joystick.radius;
}

let lastFrameTime = performance.now();
function gameLoop(now) {
  const dt = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  let vx = 0, vy = 0;
  if (keys.a) vx -= 1; if (keys.d) vx += 1;
  if (keys.w) vy -= 1; if (keys.s) vy += 1;

  if (vx === 0 && vy === 0 && joystick.active) {
    vx = joystick.x; vy = joystick.y;
  } else {
    const len = Math.hypot(vx, vy);
    if (len > 0) { vx /= len; vy /= len; }
  }

  if (vx !== 0 || vy !== 0) {
    const arenaRect = arena.getBoundingClientRect();
    player.x = Math.max(0, Math.min(arenaRect.width - 56, player.x + vx * player.speed * dt));
    player.y = Math.max(0, Math.min(arenaRect.height - 56, player.y + vy * player.speed * dt));
    player.facingLeft = vx < -0.1 ? true : (vx > 0.1 ? false : player.facingLeft);
  }

  if (playerEntity) {
    playerEntity.style.transform = `translate(${player.x}px, ${player.y}px)`;
    playerEntity.classList.toggle('flip', player.facingLeft);
  }

  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

function getMonsterPixelPos() {
  const arenaRect = arena.getBoundingClientRect();
  return { x: monsterRatio.x * (arenaRect.width - 56), y: monsterRatio.y * (arenaRect.height - 56) };
}
function positionMonster() {
  if (!monsterEntity) return;
  const pos = getMonsterPixelPos();
  monsterEntity.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
}
window.addEventListener('resize', positionMonster);

// Picks a random spot for the monster to spawn at, so you actually have to
// walk over to it instead of it always waiting in the same place.
function randomMonsterRatio() {
  return {
    x: 0.15 + Math.random() * 0.7,
    y: 0.28 + Math.random() * 0.55
  };
}

// ---------- COMBAT ----------
if (monsterEntity) {
  monsterEntity.addEventListener('pointerdown', (e) => { e.stopPropagation(); tryAttack(); });
}

function tryAttack() {
  if (monsterHp <= 0) return;
  const active = getActive();

  if (active.hydration <= 0) {
    rangeHint.textContent = 'Cactus dried out! Refill it in the Oasis.';
    rangeHint.classList.remove('hidden');
    sfx.error();
    setTimeout(() => {
      rangeHint.classList.add('hidden');
      rangeHint.textContent = 'Too far away!';
    }, 1200);
    return;
  }

  const mPos = getMonsterPixelPos();
  const dist = Math.hypot((player.x - mPos.x), (player.y - mPos.y));

  if (dist > ATTACK_RANGE) {
    rangeHint.textContent = 'Too far away!';
    rangeHint.classList.remove('hidden');
    sfx.error();
    setTimeout(() => rangeHint.classList.add('hidden'), 700);
    return;
  }

  const now = performance.now();
  if (now - lastAttackTime < ATTACK_COOLDOWN) return;
  lastAttackTime = now;

  performAttack();
}

function performAttack() {
  const active = getActive();
  const rect = monsterEntity.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const myMonsterId = monsterInstanceId;

  const basePower = active.cactusPower * powerBoostMultiplier;
  let damage = basePower;
  let labels = [];

  if (active.ability === 'freeze' && Math.random() < 0.25) {
    damage *= 2;
    labels.push('❄️ Frost Crit!');
    sfx.ability();
  }
  if (active.ability === 'robber') {
    damage *= 2;
  }
  damage = Math.max(1, Math.round(damage));

  if (active.ability === 'burn' && Math.random() < 0.30) {
    labels.push('🔥 Burned!');
    sfx.ability();
    burnDot(myMonsterId, Math.max(1, Math.ceil(basePower * 0.4)));
  }
  if (active.ability === 'chain' && Math.random() < 0.20) {
    labels.push('⚡ Chain Lightning!');
    sfx.ability();
    setTimeout(() => {
      if (monsterInstanceId === myMonsterId) dealDamage(Math.max(1, Math.round(basePower)), cx, cy);
    }, 150);
  }

  dealDamage(damage, cx, cy);
  labels.forEach((label, i) => setTimeout(() => createFloatingText(cx, cy - 40, label, '#f1c40f'), i * 120));

  // The equipped cactus dries out a little with every attack — the harder it
  // hits, the thirstier it gets. Refill it with water in the Oasis tab.
  let hydrationCost = Math.max(1, Math.round(damage / 4));
  if (active.ability === 'trance') hydrationCost = Math.max(1, Math.round(hydrationCost * 0.8));
  active.hydration = Math.max(0, active.hydration - hydrationCost);
  if (active.hydration === 0) {
    createFloatingText(cx, cy - 60, '🥀 Dried out!', '#e67e22');
  }

  dungeonZone.classList.add('shake');
  monsterEntity.classList.add('hit-flash');
  setTimeout(() => { dungeonZone.classList.remove('shake'); monsterEntity.classList.remove('hit-flash'); }, 120);
  sfx.hit();
  updateUI();
}

function burnDot(targetMonsterId, tickDamage) {
  let ticks = 0;
  const interval = setInterval(() => {
    ticks++;
    if (monsterInstanceId !== targetMonsterId || monsterHp <= 0 || ticks > 3) { clearInterval(interval); return; }
    const rect = monsterEntity.getBoundingClientRect();
    dealDamage(tickDamage, rect.left + rect.width / 2, rect.top + rect.height / 2, true);
  }, 500);
}

function dealDamage(amount, x, y, isDot = false) {
  if (monsterHp <= 0) return;
  monsterHp -= amount;
  createFloatingText(x, y, `-${amount}`, isDot ? '#ff9f43' : '#ff4757');
  spawnParticles(x, y, isDot ? '#ff9f43' : '#ff4757', isDot ? 6 : 12);

  if (monsterHp <= 0) {
    monsterHp = 0;
    monsterEntity.classList.add('hidden');
    stats.monstersDefeated++;

    const active = getActive();
    if (active.ability === 'robber') {
      createFloatingText(x, y - 30, `No loot this time! 🏃`, '#9fb3bf');
    } else {
      let reward = Math.floor(floor * 8 * currentMonster.goldMul);
      gold += reward;
      stats.totalGoldEarned += reward;
      createFloatingText(x, y - 30, `+${reward} GOLD! 🪙`, '#f1c40f');
    }
    sfx.death();
    checkQuests();

    // Room cleared -> unlock the reward chest
    spawnRoomChest();
  }
  updateUI();
}

function spawnMonster() {
  monsterInstanceId++;
  monsterEntity.classList.remove('hidden');

  if (floor % 5 === 0) {
    currentMonster = MONSTER_TYPES[3];
    monsterBadge.textContent = "BOSS";
  } else {
    currentMonster = MONSTER_TYPES[Math.floor(Math.random() * 3)];
    monsterBadge.textContent = "Room " + floor;
  }

  // Set the monster's emoji instead of an image
  setMonsterEmoji(monsterImg, currentMonster.emoji);
  monsterName.textContent = currentMonster.name;

  monsterMaxHp = Math.floor(20 * Math.pow(1.28, floor - 1) * currentMonster.hpMul);
  monsterHp = monsterMaxHp;

  monsterRatio = randomMonsterRatio();
  positionMonster();
}

// ---------- ROOM CHEST (emoji chest) ----------
function spawnRoomChest() {
  cratesLayer.innerHTML = '';
  const crate = document.createElement('div');
  crate.className = 'crate room-chest';
  crate.style.fontSize = '3rem';
  crate.style.cursor = 'pointer';
  crate.textContent = '📦';

  crate.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    openRoomChest(crate);
  });
  cratesLayer.appendChild(crate);
}

function openRoomChest(crateEl) {
  const rect = crateEl.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  crateEl.remove();

  const goldWin = Math.floor(20 + floor * 6);
  const waterWin = Math.floor(15 + floor * 4);
  gold += goldWin;
  water += waterWin;
  stats.totalGoldEarned += goldWin;
  stats.chestsOpened++;

  createFloatingText(cx, cy, `+${goldWin} 🪙 +${waterWin} 💧`, '#f1c40f');
  spawnParticles(cx, cy, '#f1c40f', 20);
  sfx.crate();

  // Enter the next floor
  floor++;
  stats.floorsCleared = floor;
  checkCharacterUnlocks();
  spawnMonster();
  checkQuests();
  updateUI();
  saveGame();
}

// ---------- UPGRADES ----------
upgradeWaterBtn.addEventListener('click', () => {
  const active = getActive();
  if (water >= active.waterUpgradeCost) {
    water -= active.waterUpgradeCost;
    active.waterPerClick++;
    active.waterUpgradeCost = Math.floor(active.waterUpgradeCost * 1.5);
    sfx.upgrade();
    updateUI();
    saveGame();
  }
});

upgradePowerBtn.addEventListener('click', () => {
  const active = getActive();
  if (gold >= active.powerUpgradeCost) {
    gold -= active.powerUpgradeCost;
    active.cactusPower++;
    active.powerUpgradeCost = Math.floor(active.powerUpgradeCost * 1.6);
    sfx.upgrade();
    updateUI();
    saveGame();
  }
});

// ---------- HYDRATION SYSTEM ----------
function refillHydration(id) {
  const c = CHARACTERS[id];
  if (!c) return;
  const cost = Math.ceil((c.maxHydration - c.hydration) * 0.6);
  if (c.hydration >= c.maxHydration || water < cost) return;
  water -= cost;
  c.hydration = c.maxHydration;
  sfx.splash();
  updateUI();
  saveGame();
}

function refillAllHydration() {
  const unlocked = Object.values(CHARACTERS).filter(c => c.unlocked);
  const totalMissing = unlocked.reduce((sum, c) => sum + (c.maxHydration - c.hydration), 0);
  const cost = Math.ceil(totalMissing * 0.5);
  if (totalMissing <= 0 || water < cost) return;
  water -= cost;
  unlocked.forEach(c => { c.hydration = c.maxHydration; });
  sfx.splash();
  updateUI();
  saveGame();
}

quickRefillBtn.addEventListener('click', () => refillHydration(activeCharacterId));

// ---------- OASIS SHOP ----------
function buyHydrationUpgrade() {
  const active = getActive();
  const cost = active.hydrationUpgradeCost || 40;
  if (gold < cost) return;
  gold -= cost;
  active.maxHydration += 20;
  active.hydration = Math.min(active.hydration + 20, active.maxHydration);
  active.hydrationUpgradeCost = Math.floor(cost * 1.7);
  sfx.upgrade();
  updateUI();
  saveGame();
}

function buyWaterSurge() {
  if (gold < 40 || Date.now() < waterBoostEndTime) return;
  gold -= 40;
  waterBoostMultiplier = 2;
  waterBoostEndTime = Date.now() + 30000;
  sfx.ability();
  updateUI();
  saveGame();
}

function buyPowerSpring() {
  if (gold < 60 || Date.now() < powerBoostEndTime) return;
  gold -= 60;
  powerBoostMultiplier = 1.5;
  powerBoostEndTime = Date.now() + 30000;
  sfx.ability();
  updateUI();
  saveGame();
}

function renderOasis() {
  oasisList.innerHTML = '';
  const active = getActive();

  // Refill active cactus
  const refillCost = Math.ceil((active.maxHydration - active.hydration) * 0.6);
  const refillBtn = document.createElement('button');
  refillBtn.className = 'btn-action btn-blue';
  refillBtn.disabled = active.hydration >= active.maxHydration || water < refillCost;
  refillBtn.innerHTML = `<span>💧 Refill ${active.name}</span><span>Cost: ${refillCost} 💧</span>`;
  refillBtn.addEventListener('click', () => refillHydration(activeCharacterId));
  oasisList.appendChild(refillBtn);

  // Refill every unlocked cactus at once
  const unlockedChars = Object.values(CHARACTERS).filter(c => c.unlocked);
  const totalMissing = unlockedChars.reduce((sum, c) => sum + (c.maxHydration - c.hydration), 0);
  const refillAllCost = Math.ceil(totalMissing * 0.5);
  const refillAllBtn = document.createElement('button');
  refillAllBtn.className = 'btn-action btn-blue';
  refillAllBtn.disabled = totalMissing <= 0 || water < refillAllCost;
  refillAllBtn.innerHTML = `<span>💧 Refill All Cacti</span><span>Cost: ${refillAllCost} 💧</span>`;
  refillAllBtn.addEventListener('click', refillAllHydration);
  oasisList.appendChild(refillAllBtn);

  // Permanent max hydration upgrade
  const hydCost = active.hydrationUpgradeCost || 40;
  const hydBtn = document.createElement('button');
  hydBtn.className = 'btn-action btn-gold';
  hydBtn.disabled = gold < hydCost;
  hydBtn.innerHTML = `<span>🌵 Max Hydration +20</span><span>Cost: ${hydCost} 🪙</span>`;
  hydBtn.addEventListener('click', buyHydrationUpgrade);
  oasisList.appendChild(hydBtn);

  // Water Surge boost
  const surgeActive = Date.now() < waterBoostEndTime;
  const surgeBtn = document.createElement('button');
  surgeBtn.className = 'btn-action';
  surgeBtn.disabled = surgeActive || gold < 40;
  surgeBtn.innerHTML = surgeActive
    ? `<span>💧 Water Surge Active</span><span>${Math.ceil((waterBoostEndTime - Date.now()) / 1000)}s left</span>`
    : `<span>💧 Water Surge (x2, 30s)</span><span>Cost: 40 🪙</span>`;
  surgeBtn.addEventListener('click', buyWaterSurge);
  oasisList.appendChild(surgeBtn);

  // Power Spring boost
  const powerActive = Date.now() < powerBoostEndTime;
  const powerBtn = document.createElement('button');
  powerBtn.className = 'btn-action btn-gold';
  powerBtn.disabled = powerActive || gold < 60;
  powerBtn.innerHTML = powerActive
    ? `<span>⚔️ Power Spring Active</span><span>${Math.ceil((powerBoostEndTime - Date.now()) / 1000)}s left</span>`
    : `<span>⚔️ Power Spring (+50% PWR, 30s)</span><span>Cost: 60 🪙</span>`;
  powerBtn.addEventListener('click', buyPowerSpring);
  oasisList.appendChild(powerBtn);
}

function tickBoosts() {
  let changed = false;
  if (waterBoostMultiplier !== 1 && Date.now() >= waterBoostEndTime) { waterBoostMultiplier = 1; changed = true; }
  if (powerBoostMultiplier !== 1 && Date.now() >= powerBoostEndTime) { powerBoostMultiplier = 1; changed = true; }
  if (changed || Date.now() < waterBoostEndTime || Date.now() < powerBoostEndTime) {
    renderOasis();
  }
}

// ---------- QUEST SYSTEM ----------
function questLabel(q) {
  const labels = {
    monstersDefeated: `Defeat ${q.target} monsters`,
    floorsCleared: `Reach floor ${q.target}`,
    totalGoldEarned: `Earn a total of ${q.target} gold`,
    chestsOpened: `Open ${q.target} treasure chests`,
    slotSpins: `Spin the slot machine ${q.target} times`
  };
  return labels[q.type] || 'Unknown quest';
}

function generateNextQuest(type, prevTarget) {
  let newTarget, rewardGold = 0, rewardWater = 0;
  switch (type) {
    case 'monstersDefeated': newTarget = prevTarget + 25; rewardGold = newTarget * 3; break;
    case 'floorsCleared': newTarget = prevTarget + 10; rewardGold = newTarget * 15; break;
    case 'totalGoldEarned': newTarget = Math.round(prevTarget * 1.8); rewardWater = Math.round(newTarget * 0.3); break;
    case 'chestsOpened': newTarget = prevTarget + 5; rewardGold = newTarget * 12; break;
    case 'slotSpins': newTarget = prevTarget + 10; rewardGold = newTarget * 8; break;
    default: newTarget = prevTarget + 10; rewardGold = 50;
  }
  return makeQuest(type, newTarget, rewardGold, rewardWater);
}

function checkQuests() {
  activeQuests.forEach((q, idx) => {
    if (q.completed) return;
    if ((stats[q.type] || 0) >= q.target) {
      q.completed = true;
      gold += q.rewardGold || 0;
      water += q.rewardWater || 0;
      createFloatingText(window.innerWidth / 2, window.innerHeight / 2, `✅ Quest complete!`, '#66fcf1');
      sfx.unlock();
      setTimeout(() => {
        activeQuests[idx] = generateNextQuest(q.type, q.target);
        renderQuests();
        saveGame();
      }, 1400);
      updateUI();
    }
  });
}

function renderQuests() {
  questsList.innerHTML = '';
  activeQuests.forEach(q => {
    const progress = Math.min(stats[q.type] || 0, q.target);
    const percent = Math.min(100, (progress / q.target) * 100);
    const card = document.createElement('div');
    card.className = 'quest-card' + (q.completed ? ' completed' : '');
    card.innerHTML = `
      <div class="quest-desc">${q.completed ? '✅ ' : ''}${questLabel(q)}</div>
      <div class="quest-bar-container"><div class="quest-bar" style="width:${percent}%"></div></div>
      <div class="quest-progress">${progress} / ${q.target}</div>
      <div class="quest-reward">Reward: ${q.rewardGold ? '+' + q.rewardGold + ' 🪙 ' : ''}${q.rewardWater ? '+' + q.rewardWater + ' 💧' : ''}</div>
    `;
    questsList.appendChild(card);
  });
}

// ---------- BACKGROUND / TRANCE MODE ----------
function updateBackgroundMode() {
  arena.classList.toggle('trance-mode', activeCharacterId === 'trance');
}

// ---------- INVENTORY (uses c.img for cactus PNGs again) ----------
function renderInventory() {
  inventoryList.innerHTML = '';
  Object.values(CHARACTERS).forEach(c => {
    const isEquipped = c.id === activeCharacterId;
    const card = document.createElement('div');
    card.className = 'inv-card' + (c.unlocked ? '' : ' locked') + (isEquipped ? ' equipped' : '');

    const img = document.createElement('img');
    img.className = 'inv-img';
    img.src = c.img;
    img.alt = c.name;

    const info = document.createElement('div');
    info.className = 'inv-info';
    info.innerHTML = `
      <div class="inv-name">${c.unlocked ? c.name : '🔒 From floor ' + c.reqFloor}</div>
      <div class="inv-ability">${c.unlocked ? c.abilityDesc : 'Reach floor ' + c.reqFloor + ' to unlock this cactus!'}</div>
      ${c.unlocked ? `<div class="inv-stats">PWR ${c.cactusPower} · 💧 ${c.waterPerClick}/click · 🌵 ${c.hydration}/${c.maxHydration}</div>` : ''}
    `;

    const btn = document.createElement('button');
    btn.className = 'btn-action inv-equip-btn';
    btn.disabled = !c.unlocked || isEquipped;
    btn.textContent = isEquipped ? 'Equipped' : (c.unlocked ? 'Equip' : '🔒');
    btn.addEventListener('click', () => equipCharacter(c.id));

    card.append(img, info, btn);
    inventoryList.appendChild(card);
  });
}

function equipCharacter(id) {
  const c = CHARACTERS[id];
  if (!c || !c.unlocked || id === activeCharacterId) return;
  activeCharacterId = id;

  playerImg.src = c.img;
  cactusBtn.src = c.img;
  updateBackgroundMode();

  sfx.click();
  updateUI();
  saveGame();
}

// ---------- GAMBLING (with emoji slots) ----------
spinSlotBtn.addEventListener('click', () => {
  if (gold < 50) return;
  gold -= 50;
  stats.slotSpins++;

  const icons = ['🌵', '💎', '💀', '7️⃣'];
  const r1 = icons[Math.floor(Math.random() * icons.length)];
  const r2 = icons[Math.floor(Math.random() * icons.length)];
  const r3 = icons[Math.floor(Math.random() * icons.length)];

  slotDisplay.innerHTML = `<span style="font-size:2rem; margin:0 5px;">${r1}</span> <span style="font-size:2rem; margin:0 5px;">${r2}</span> <span style="font-size:2rem; margin:0 5px;">${r3}</span>`;
  sfx.click();

  if (r1 === r2 && r2 === r3) {
    gold += 500;
    stats.totalGoldEarned += 500;
    sfx.unlock();
    alert("JACKPOT! +500 Gold! 🎉");
  } else if (r1 === r2 || r2 === r3 || r1 === r3) {
    gold += 75;
    stats.totalGoldEarned += 75;
    sfx.gold();
  }
  checkQuests();
  updateUI();
  saveGame();
});

openBoxBtn.addEventListener('click', () => {
  if (water < 100) return;
  water -= 100;

  if (Math.random() > 0.5) {
    let winGold = Math.floor(gold * 0.5) + 20;
    gold += winGold;
    stats.totalGoldEarned += winGold;
    sfx.gold();
    alert(`You win! You found ${winGold} gold!`);
  } else {
    sfx.error();
    alert("Bust! Just some dust... 💨");
  }
  updateUI();
  saveGame();
});

// ---------- RANDOM EVENT ----------
function triggerRandomEvent() {
  randomEventItem.classList.remove('hidden');
  randomEventItem.textContent = "✨🎁✨";
  randomEventItem.style.fontSize = "2rem";
  setTimeout(() => randomEventItem.classList.add('hidden'), 4000);
}
setInterval(() => { if (Math.random() < 0.4) triggerRandomEvent(); }, 12000);

randomEventItem.addEventListener('click', (e) => {
  let bonus = floor * 15;
  gold += bonus;
  stats.totalGoldEarned += bonus;
  createFloatingText(e.clientX, e.clientY, `+${bonus} GOLD! ✨`, '#f1c40f');
  spawnParticles(e.clientX, e.clientY, '#f1c40f', 20);
  randomEventItem.classList.add('hidden');
  sfx.gold();
  updateUI();
  saveGame();
});

// ---------- FLOATING TEXT ----------
function createFloatingText(x, y, text, color = '#66fcf1') {
  const el = document.createElement('div');
  el.className = 'floating-text';
  el.textContent = text;
  el.style.left = `${x - 20}px`;
  el.style.top = `${y - 20}px`;
  el.style.color = color;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 700);
}

// ---------- UI UPDATE ----------
function updateUI() {
  const active = getActive();

  waterEl.textContent = water;
  goldEl.textContent = gold;
  powerEl.textContent = active.cactusPower;

  document.getElementById('cost-water').textContent = active.waterUpgradeCost;
  document.getElementById('cost-power').textContent = active.powerUpgradeCost;

  upgradeWaterBtn.disabled = water < active.waterUpgradeCost;
  upgradePowerBtn.disabled = gold < active.powerUpgradeCost;
  spinSlotBtn.disabled = gold < 50;
  openBoxBtn.disabled = water < 100;

  activeCharNameEl.textContent = active.name;
  activeCharAbilityEl.textContent = active.abilityName;

  // Hydration bar for the equipped cactus
  const hydPercent = Math.max(0, (active.hydration / active.maxHydration) * 100);
  hydrationBar.style.width = hydPercent + '%';
  hydrationBar.classList.toggle('low', hydPercent <= 25);
  hydrationText.textContent = `${active.hydration}/${active.maxHydration}`;
  const refillCostNow = Math.ceil((active.maxHydration - active.hydration) * 0.6);
  refillCostEl.textContent = refillCostNow;
  quickRefillBtn.disabled = active.hydration >= active.maxHydration || water < refillCostNow;

  document.getElementById('floor').textContent = floor;
  monsterHpEl.textContent = monsterHp;
  monsterMaxHpEl.textContent = monsterMaxHp;

  let hpPercent = Math.max(0, (monsterHp / monsterMaxHp) * 100);
  monsterHpBar.style.width = hpPercent + '%';

  soundToggleBtn.textContent = muted ? '🔇' : '🔊';

  renderInventory();
  renderOasis();
  renderQuests();
}

// ---------- INITIALIZATION ----------
loadGame();
checkCharacterUnlocks();
playerImg.src = getActive().img;
cactusBtn.src = getActive().img;
updateBackgroundMode();
spawnMonster();
updateUI();

setInterval(saveGame, 10000);
setInterval(tickBoosts, 1000);
window.addEventListener('beforeunload', saveGame);
