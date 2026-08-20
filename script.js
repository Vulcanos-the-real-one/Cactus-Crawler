/* ==========================================================================
   GAME STATE & CONFIGURATION
   ========================================================================== */
let water = 0;
let gold = 0;
let clickPower = 1;

let waterUpgradeCost = 10;
let powerUpgradeCost = 15;

let currentFloor = 1;
let monsterHp = 25;
let monsterMaxHp = 25;

// Player Position & Movement
let playerX = 40;
let playerY = 70;
let joystickActive = false;
let joystickVector = { x: 0, y: 0 };

// Active Character
let activeCharacter = {
  name: "Basis-Kaktus",
  ability: "Keine Fähigkeit",
  img: "assets/cactus.svg"
};

// Monster Types Configuration
const MONSTER_TYPES = [
  { name: "Wüsten-Schnecke", hp: 25, goldReward: 15, img: "assets/snail.svg" },
  { name: "Stein-Golem", hp: 60, goldReward: 35, img: "assets/golem.svg" },
  { name: "Schatten-Drache", hp: 150, goldReward: 100, img: "assets/dragon.svg" }
];
let currentMonster = MONSTER_TYPES[0];

/* ==========================================================================
   DOM ELEMENTS
   ========================================================================== */
const waterEl = document.getElementById('water');
const goldEl = document.getElementById('gold');
const powerEl = document.getElementById('power');
const floorEl = document.getElementById('floor');

const costWaterEl = document.getElementById('cost-water');
const costPowerEl = document.getElementById('cost-power');

const monsterNameEl = document.getElementById('monster-name');
const monsterHpEl = document.getElementById('monster-hp');
const monsterMaxHpEl = document.getElementById('monster-max-hp');
const monsterHpBarEl = document.getElementById('monster-hp-bar');
const monsterImgEl = document.getElementById('monster-img');

const playerEntityEl = document.getElementById('player-entity');
const monsterEntityEl = document.getElementById('monster-entity');
const cactusClickerEl = document.getElementById('cactus-clicker');

const activeCharNameEl = document.getElementById('active-char-name');
const activeCharAbilityEl = document.getElementById('active-char-ability');

/* ==========================================================================
   HELPER & DISPLAY UPDATES
   ========================================================================== */
function updateDisplays() {
  if (waterEl) waterEl.innerText = water;
  if (goldEl) goldEl.innerText = gold;
  if (powerEl) powerEl.innerText = clickPower;
  if (floorEl) floorEl.innerText = currentFloor;

  if (costWaterEl) costWaterEl.innerText = waterUpgradeCost;
  if (costPowerEl) costPowerEl.innerText = powerUpgradeCost;

  if (monsterHpEl) monsterHpEl.innerText = Math.max(0, monsterHp);
  if (monsterMaxHpEl) monsterMaxHpEl.innerText = monsterMaxHp;
  if (monsterHpBarEl) {
    const pct = Math.max(0, (monsterHp / monsterMaxHp) * 100);
    monsterHpBarEl.style.width = pct + "%";
  }

  if (activeCharNameEl) activeCharNameEl.innerText = activeCharacter.name;
  if (activeCharAbilityEl) activeCharAbilityEl.innerText = activeCharacter.ability;
}

/* ==========================================================================
   CLICKER & UPGRADES
   ========================================================================== */
if (cactusClickerEl) {
  cactusClickerEl.addEventListener('click', () => {
    water += clickPower;
    createClickParticle();
    updateDisplays();
  });
}

const upgradeWaterBtn = document.getElementById('upgrade-water-btn');
if (upgradeWaterBtn) {
  upgradeWaterBtn.addEventListener('click', () => {
    if (water >= waterUpgradeCost) {
      water -= waterUpgradeCost;
      clickPower += 1;
      waterUpgradeCost = Math.floor(waterUpgradeCost * 1.5);
      updateDisplays();
    }
  });
}

const upgradePowerBtn = document.getElementById('upgrade-power-btn');
if (upgradePowerBtn) {
  upgradePowerBtn.addEventListener('click', () => {
    if (gold >= powerUpgradeCost) {
      gold -= powerUpgradeCost;
      clickPower += 2;
      powerUpgradeCost = Math.floor(powerUpgradeCost * 1.6);
      updateDisplays();
    }
  });
}

/* ==========================================================================
   DUNGEON & COMBAT SYSTEM
   ========================================================================== */
function loadMonster() {
  const monsterIndex = (currentFloor - 1) % MONSTER_TYPES.length;
  currentMonster = MONSTER_TYPES[monsterIndex];
  
  monsterMaxHp = currentMonster.hp + (currentFloor - 1) * 20;
  monsterHp = monsterMaxHp;

  if (monsterNameEl) monsterNameEl.innerText = currentMonster.name;
  if (monsterImgEl) monsterImgEl.src = currentMonster.img;

  updateDisplays();
}

function attackMonster() {
  monsterHp -= clickPower;
  if (monsterHp <= 0) {
    gold += currentMonster.goldReward;
    currentFloor++;
    loadMonster();
  }
  updateDisplays();
}

// Auto-Attack loop based on proximity
setInterval(() => {
  // Arena Hitbox Logic
  if (playerX > 180 && playerX < 260) {
    attackMonster();
  }
}, 800);

/* ==========================================================================
   JOYSTICK & MOVEMENT
   ========================================================================== */
const joystickBase = document.getElementById('joystick-base');
const joystickKnob = document.getElementById('joystick-knob');

if (joystickBase && joystickKnob) {
  const handleMove = (clientX, clientY) => {
    const rect = joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;
    const distance = Math.min(Math.hypot(deltaX, deltaY), 40);

    const angle = Math.atan2(deltaY, deltaX);
    const knobX = Math.cos(angle) * distance;
    const knobY = Math.sin(angle) * distance;

    joystickKnob.style.transform = `translate(${knobX}px, ${knobY}px)`;

    joystickVector.x = knobX / 40;
    joystickVector.y = knobY / 40;
  };

  joystickBase.addEventListener('touchstart', (e) => {
    joystickActive = true;
    handleMove(e.touches[0].clientX, e.touches[0].clientY);
  });

  window.addEventListener('touchmove', (e) => {
    if (joystickActive) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  });

  window.addEventListener('touchend', () => {
    joystickActive = false;
    joystickKnob.style.transform = `translate(0px, 0px)`;
    joystickVector = { x: 0, y: 0 };
  });
}

// Movement Loop
function updatePlayerPosition() {
  if (joystickActive) {
    playerX += joystickVector.x * 3;
    playerX = Math.max(20, Math.min(280, playerX));

    if (playerEntityEl) {
      playerEntityEl.style.left = playerX + "px";
    }
  }
  requestAnimationFrame(updatePlayerPosition);
}
requestAnimationFrame(updatePlayerPosition);

/* ==========================================================================
   TAB NAVIGATION SYSTEM
   ========================================================================== */
function switchTab(tabName) {
  const tabs = ['upgrades', 'inventory', 'casino'];
  
  tabs.forEach(t => {
    const btn = document.getElementById(`tab-${t}-btn`);
    const content = document.getElementById(`tab-${t}`);
    
    if (btn) btn.classList.remove('active');
    if (content) content.classList.remove('active');
  });

  const activeBtn = document.getElementById(`tab-${tabName}-btn`);
  const activeContent = document.getElementById(`tab-${tabName}`);

  if (activeBtn) activeBtn.classList.add('active');
  if (activeContent) activeContent.classList.add('active');
}

document.getElementById('tab-upgrades-btn')?.addEventListener('click', () => switchTab('upgrades'));
document.getElementById('tab-inventory-btn')?.addEventListener('click', () => switchTab('inventory'));
document.getElementById('tab-gamble-btn')?.addEventListener('click', () => switchTab('casino'));

/* ==========================================================================
   CASINO / SLOT MACHINE
   ========================================================================== */
const spinBtn = document.getElementById('spin-slot-btn');
const slot1 = document.getElementById('slot1');
const slot2 = document.getElementById('slot2');
const slot3 = document.getElementById('slot3');
const statusText = document.getElementById('casino-status');

const slotSymbols = ['🌵', '💧', '🪙', '⭐', '💀'];

if (spinBtn) {
  spinBtn.addEventListener('click', () => {
    if (gold < 50) {
      if (statusText) statusText.innerText = "Nicht genug Gold! (50 🪙 nötig)";
      return;
    }

    gold -= 50;
    updateDisplays();

    if (slot1) slot1.classList.add('spinning');
    if (slot2) slot2.classList.add('spinning');
    if (slot3) slot3.classList.add('spinning');
    spinBtn.disabled = true;
    if (statusText) statusText.innerText = "Dreht...";

    let counter = 0;
    const interval = setInterval(() => {
      if (slot1) slot1.innerText = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      if (slot2) slot2.innerText = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      if (slot3) slot3.innerText = slotSymbols[Math.floor(Math.random() * slotSymbols.length)];
      counter++;

      if (counter > 15) {
        clearInterval(interval);
        if (slot1) slot1.classList.remove('spinning');
        if (slot2) slot2.classList.remove('spinning');
        if (slot3) slot3.classList.remove('spinning');
        spinBtn.disabled = false;

        const res1 = slot1?.innerText;
        const res2 = slot2?.innerText;
        const res3 = slot3?.innerText;

        if (res1 === res2 && res2 === res3) {
          gold += 300;
          if (statusText) statusText.innerText = "JACKPOT! +300 Gold 🪙";
        } else if (res1 === res2 || res2 === res3 || res1 === res3) {
          gold += 75;
          if (statusText) statusText.innerText = "Kleiner Gewinn! +75 Gold 🪙";
        } else {
          if (statusText) statusText.innerText = "Niete! Versuch es gleich nochmal.";
        }
        updateDisplays();
      }
    }, 100);
  });
}

/* ==========================================================================
   PARTICLE EFFECTS
   ========================================================================== */
function createClickParticle() {
  const particle = document.createElement('div');
  particle.innerText = "+1 💧";
  particle.className = "floating-particle";
  particle.style.position = "absolute";
  particle.style.left = (Math.random() * 40 + 30) + "%";
  particle.style.top = "50%";
  particle.style.color = "#00ffff";
  particle.style.fontWeight = "bold";
  particle.style.pointerEvents = "none";
  
  const area = document.getElementById('click-area');
  if (area) {
    area.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
  }
}

/* ==========================================================================
   INITIALIZATION
   ========================================================================== */
loadMonster();
updateDisplays();
