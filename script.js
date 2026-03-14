// LocalStorage keys
const storage = {
    coins: 'game_coins',
    owned: 'game_owned', // {table: [], deck: [], cardBack: [], accessories: []}
    selected: 'game_selected', // {table: '', deck: '', cardBack: '', accessories: []}
    settings: 'game_settings' // {musicVolume: 50, musicMute: false, sfxVolume: 50, sfxMute: false, hints: 'basic'}
};

// Initial data
let coins = parseInt(localStorage.getItem(storage.coins)) || 0;
let owned = JSON.parse(localStorage.getItem(storage.owned)) || { table: [], deck: [], cardBack: [], accessories: [] };
let selected = JSON.parse(localStorage.getItem(storage.selected)) || { table: '', deck: '', cardBack: '', accessories: [] };
let settings = JSON.parse(localStorage.getItem(storage.settings)) || { musicVolume: 50, musicMute: false, sfxVolume: 50, sfxMute: false, hints: 'basic' };

// Categories
const categories = ['table', 'deck', 'card-back', 'accessories'];
const singleSelect = ['table', 'deck', 'card-back']; // Radio for these

// Item data (10 per category, costs: 8 free, 2 at 5)
const items = {};
categories.forEach(cat => {
    items[cat.replace('-', '')] = Array.from({length: 10}, (_, i) => ({
        id: `item-${i + 1}`,
        name: `Item ${i + 1}`,
        cost: i < 8 ? 0 : 5
    }));
});

// Customer questions array (populate with more later)
const questions = [
    { text: "Tell me about my career.", category: "money" },
    { text: "What's in store for my love life?", category: "relationships" },
    { text: "How's my health looking?", category: "health" },
    { text: "Advice on a big decision?", category: "general" }, // Placeholder
    { text: "Will I come into money soon?", category: "money" }, // Placeholder
    // Add more here...
];

// Button labels for starting reading
const buttonLabels = ["Shuffle", "Split the Deck", "Begin", "Begin Reading", "Smile Knowingly", "Nod", "Close Your Eyes"];

// Show loading for 2.5s, then main screen
window.addEventListener('load', () => {
    setTimeout(() => {
        document.getElementById('loading-screen').style.display = 'none';
        document.getElementById('main-screen').classList.remove('hidden');
    }, 2500);
});

// Button events
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('shop-btn').addEventListener('click', openShop);
document.getElementById('settings-btn').addEventListener('click', openSettings);
document.getElementById('stats-btn').addEventListener('click', openStats);

// NEW: Store the current question category for later interpretation filtering
let currentQuestionCategory = "";

// Updated button listener (replaces the old one inside startGame)
function startGame() {
    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('game-area').classList.remove('hidden');
    
    document.getElementById('customer-placeholder').textContent = "Customer Appears Here";
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById('customer-question').textContent = randomQuestion.text;
    currentQuestionCategory = randomQuestion.category;   // ← saved for later
    
    const randomLabel = buttonLabels[Math.floor(Math.random() * buttonLabels.length)];
    const startBtn = document.getElementById('start-reading-btn');
    startBtn.textContent = randomLabel;
    
    // NEW click handler – this is the only part that changed
    startBtn.onclick = () => {
        // Hide speech bubble
        document.getElementById('speech-bubble').classList.add('hidden');
        
        // Show table screen (sits on top)
        document.getElementById('table-screen').classList.remove('hidden');
        
        // === SHUFFLE + REVERSE + DRAW 3 CARDS ===
        let deck = [...allCards];
        
        // Fisher-Yates shuffle
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        
        // Randomly reverse ~35% of the deck
        deck.forEach(card => {
            card.reversed = Math.random() < 0.35;
        });
        
        // Draw top 3 and display
        for (let i = 0; i < 3; i++) {
            const card = deck[i];
            const slot = document.getElementById(`slot-${i+1}`);
            slot.innerHTML = `
                <strong>${card.name}</strong><br>
                ${card.reversed ? '(Reversed)' : '(Upright)'}
            `;
        }
    };
    
    document.getElementById('speech-bubble').classList.remove('hidden');
}

// ... rest of your script.js (shop, settings, etc.) stays exactly the same ...

// Shop functions
function openShop() {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('shop-modal').classList.remove('hidden');
    document.getElementById('coins-amount').textContent = coins;
    initShopTabs();
    showTab('table'); // Default tab

    document.getElementById('purchase-coins-btn').addEventListener('click', () => alert('Coming soon - In-app purchases'));
    document.getElementById('save-shop-btn').addEventListener('click', saveShopAndClose);
}

function closeShop() {
    saveShopAndClose();
}

function initShopTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showTab(btn.dataset.tab);
        });
    });
}

function showTab(tabId) {
    const content = document.getElementById('shop-content');
    content.innerHTML = ''; // Clear
    const tabContent = document.createElement('div');
    tabContent.classList.add('tab-content', 'active');
    const grid = document.createElement('div');
    grid.classList.add('items-grid');

    const catKey = tabId.replace('-', '');
    items[catKey].forEach(item => {
        const box = document.createElement('div');
        box.classList.add('item-box');
        box.textContent = item.name;

        const isOwned = owned[catKey].includes(item.id);
        const isAffordable = coins >= item.cost || isOwned;

        if (!isOwned) { // Only show cost if not owned
            const costSpan = document.createElement('span');
            costSpan.classList.add('item-cost');
            costSpan.textContent = `${item.cost} coins`;
            box.appendChild(costSpan);
        }

        if (!isAffordable) {
            box.classList.add('greyed');
        } else if (!isOwned) {
            // Click to buy
            box.addEventListener('click', () => buyItem(catKey, item));
        } else {
            // Show selection input
            const input = document.createElement('input');
            input.type = singleSelect.includes(catKey) ? 'radio' : 'checkbox';
            input.name = tabId; // For radio group
            input.classList.add('item-checkbox');
            input.checked = singleSelect.includes(catKey) ? selected[catKey] === item.id : selected[catKey].includes(item.id);
            input.addEventListener('change', () => updateSelection(catKey, item.id, input.checked));
            box.appendChild(input);
        }

        grid.appendChild(box);
    });

    tabContent.appendChild(grid);
    content.appendChild(tabContent);
}

function buyItem(category, item) {
    if (coins >= item.cost) {
        coins -= item.cost;
        owned[category].push(item.id);
        // Automatically select the new item
        if (singleSelect.includes(category)) {
            selected[category] = item.id;
        } else {
            selected[category].push(item.id);
        }
        document.getElementById('coins-amount').textContent = coins;
        showTab(category.replace('card', 'card-')); // Refresh tab
    } else {
        alert('Not enough coins!');
    }
}

function updateSelection(category, itemId, checked) {
    if (singleSelect.includes(category)) {
        selected[category] = checked ? itemId : '';
    } else {
        if (checked) {
            selected[category].push(itemId);
        } else {
            selected[category] = selected[category].filter(id => id !== itemId);
        }
    }
}

function saveShop() {
    localStorage.setItem(storage.coins, coins);
    localStorage.setItem(storage.owned, JSON.stringify(owned));
    localStorage.setItem(storage.selected, JSON.stringify(selected));
}

function saveShopAndClose() {
    saveShop();
    closeModal('shop-modal');
}

// Settings functions
function openSettings() {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('settings-modal').classList.remove('hidden');

    document.getElementById('music-volume').value = settings.musicVolume;
    document.getElementById('sfx-volume').value = settings.sfxVolume;
    document.getElementById('hints-level').value = settings.hints;

    const muteBtns = document.querySelectorAll('.mute-btn');
    muteBtns.forEach(btn => {
        const type = btn.dataset.type;
        btn.textContent = settings[`${type}Mute`] ? 'Unmute' : 'Mute';
        btn.addEventListener('click', () => toggleMute(type));
    });

    document.getElementById('music-volume').addEventListener('input', e => settings.musicVolume = e.target.value);
    document.getElementById('sfx-volume').addEventListener('input', e => settings.sfxVolume = e.target.value);
    document.getElementById('hints-level').addEventListener('change', e => settings.hints = e.target.value);
    document.getElementById('save-settings-btn').addEventListener('click', saveSettingsAndClose);
}

function closeSettings() {
    saveSettingsAndClose();
}

function toggleMute(type) {
    settings[`${type}Mute`] = !settings[`${type}Mute`];
    const btn = document.querySelector(`.mute-btn[data-type="${type}"]`);
    btn.textContent = settings[`${type}Mute`] ? 'Unmute' : 'Mute';
}

function saveSettings() {
    localStorage.setItem(storage.settings, JSON.stringify(settings));
}

function saveSettingsAndClose() {
    saveSettings();
    closeModal('settings-modal');
}

// Stats functions
function openStats() {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('stats-modal').classList.remove('hidden');
}

function closeStats() {
    closeModal('stats-modal');
}

// General close modal
function closeModal(id) {
    document.getElementById('modal-overlay').classList.add('hidden');
    document.getElementById(id).classList.add('hidden');
}