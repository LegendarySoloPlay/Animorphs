// LocalStorage keys
const storage = {
    coins: 'game_coins',
    owned: 'game_owned', // {table: [], deck: [], cardBack: [], accessories: []}
    selected: 'game_selected', // {table: '', deck: '', cardBack: '', accessories: []}
    settings: 'game_settings', // {musicVolume: 50, musicMute: false, sfxVolume: 50, sfxMute: false, hints: 'basic'}
    cardStats: 'game_cardStats' // { 'The Fool': {correct: 0, total: 0}, ... }
};

// Initial data
let coins = parseInt(localStorage.getItem(storage.coins)) || 0;
let owned = JSON.parse(localStorage.getItem(storage.owned)) || { table: [], deck: [], cardBack: [], accessories: [] };
let selected = JSON.parse(localStorage.getItem(storage.selected)) || { table: '', deck: '', cardBack: '', accessories: [] };
let settings = JSON.parse(localStorage.getItem(storage.settings)) || { musicVolume: 50, musicMute: false, sfxVolume: 50, sfxMute: false, hints: 'basic' };
let cardStats = JSON.parse(localStorage.getItem(storage.cardStats)) || {};

// Initialize cardStats if empty (assuming allCards is available from cardDatabase.js)
if (Object.keys(cardStats).length === 0 && typeof allCards !== 'undefined') {
    allCards.forEach(card => {
        cardStats[card.name] = { correct: 0, total: 0 };
    });
    localStorage.setItem(storage.cardStats, JSON.stringify(cardStats));
}

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

// Arrays for thank you responses
const poorResponses = ["Thanks, but I'm not sure...", "Hmm, that was okay."]; // 0-1 correct
const mediumResponses = ["Thanks, that helped a bit."]; // 2 correct
const goodResponses = ["Wow, that was spot on! Thanks!"]; // 3 correct

// Arrays for conclude button texts
const apologyResponse = ["Sorry about that", "Better luck next time"]; // 0-1
const neutralResponse = ["You're welcome", "Glad to help"]; // 2
const enthusiasticResponse = ["My pleasure!", "Come back soon!"]; // 3

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

// === Game state ===
let currentSpread = [];
let currentCategory = "";   // set from the question
let deck = []; // Global to access remaining deck
let completedCards = 0; // Track interpreted cards

// Game round state
let roundCustomers = 0;
const maxCustomers = 3;
let dailyEarnings = 0;
let dailyCorrect = 0;

// Position prefixes
const positionPrefixes = {
    past: ["In the past, ", "Previously, ", "Before now, "],
    present: ["Right now, ", "Currently, ", "At this moment, "],
    future: ["In the future, ", "Soon, ", "Ahead of you, "]
};

// Shuffle helper
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// Start game (updated to start round)
function startGame() {
    roundCustomers = 0;
    dailyEarnings = 0;
    dailyCorrect = 0;
    startNextCustomer();
}

// Start next customer
function startNextCustomer() {
    if (roundCustomers >= maxCustomers) {
        showEndDaySummary();
        return;
    }

    document.getElementById('main-screen').classList.add('hidden');
    document.getElementById('game-area').classList.remove('hidden');
    
    // Reset for new customer
    document.getElementById('table-area').classList.add('hidden');
    document.getElementById('speech-bubble').classList.remove('hidden');
    document.getElementById('start-reading-btn').classList.remove('hidden');
    document.getElementById('conclude-reading-btn').classList.add('hidden');
    document.getElementById('customer-placeholder').textContent = "Customer " + (roundCustomers + 1) + " Appears Here";
    
    // Show customer (placeholder)
    document.getElementById('customer-placeholder').textContent = "Customer " + (roundCustomers + 1) + " Appears Here";
    
    // Show speech bubble with random question
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById('customer-question').textContent = randomQuestion.text;
    currentCategory = randomQuestion.category; 
    
    const randomLabel = buttonLabels[Math.floor(Math.random() * buttonLabels.length)];
    const startBtn = document.getElementById('start-reading-btn');
    startBtn.textContent = randomLabel;
    
    startBtn.onclick = () => {
        try {
            if (typeof allCards === 'undefined' || allCards.length === 0) {
                throw new Error('allCards not loaded or empty. Check cardDatabase.js.');
            }
            
            // Hide speech bubble
            document.getElementById('speech-bubble').classList.add('hidden');
            
            // Show table screen (fixed ID)
            document.getElementById('table-area').classList.remove('hidden');
            
            // Reset completed cards counter
            completedCards = 0;
            
            // === SHUFFLE + REVERSE + DRAW 3 CARDS ===
            deck = [...allCards];
            
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
            currentSpread = deck.slice(0, 3).map((card, i) => ({
                ...card,
                position: ['past', 'present', 'future'][i]
            }));
            
            renderThreeCards();
        } catch (error) {
            console.error(error);
            alert('Error starting reading: ' + error.message);
        }
    };
    
    document.getElementById('speech-bubble').classList.remove('hidden');
}

function renderThreeCards() {
    console.log('Rendering cards...'); // Debug: Confirms this runs
    currentSpread.forEach((card, i) => {
        const slot = document.getElementById(`slot-${i+1}`);
        slot.innerHTML = `
            <strong>${card.name}</strong><br>
            ${card.reversed ? '(Reversed)' : '(Upright)'}
        `;
        slot.onclick = () => {
            console.log('Card clicked: index ' + i); // Debug: Confirms click fires
            showInterpretationPopup(i);
        };
    });
}

function showInterpretationPopup(index) {
    console.log('Showing popup for index ' + index); // Debug
    const card = currentSpread[index];
    const prefix = positionPrefixes[card.position][Math.floor(Math.random() * positionPrefixes[card.position].length)];

    document.getElementById('position-prefix').textContent = prefix;
    document.getElementById('magnified-name').textContent = card.name;
    document.getElementById('magnified-orientation').textContent = card.reversed ? 'Reversed' : 'Upright';
    document.getElementById('magnified-area').classList.remove('hidden');
    document.getElementById('interpretation-popup').classList.remove('hidden');

    // Build key e.g. "pastRelationshipsReversed"
    const baseKey = card.position + currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1);
    const key = card.reversed ? baseKey + "Reversed" : baseKey;

    console.log('Generated key: ' + key); // Debug key

    // Correct interpretation from THIS card
    let correctPool = card[key] || ["Generic correct meaning."]; // FIXED: Use card[key] instead of card.interpretations[key]
    console.log('Correct pool: ', correctPool); // Debug
    const correctText = correctPool[Math.floor(Math.random() * correctPool.length)];

    // Two distractors from the SAME key on RANDOM cards in REMAINING DECK
    let distractors = [];
    const remainingDeck = deck.slice(3); // After the spread
    if (remainingDeck.length >= 2) {
        // Pick two random indices
        const rand1 = Math.floor(Math.random() * remainingDeck.length);
        let rand2 = Math.floor(Math.random() * remainingDeck.length);
        while (rand2 === rand1) rand2 = Math.floor(Math.random() * remainingDeck.length);
        
        const otherCard1 = remainingDeck[rand1];
        const otherCard2 = remainingDeck[rand2];
        
        const pool1 = otherCard1[key] || ["Generic distractor 1."];
        const pool2 = otherCard2[key] || ["Generic distractor 2."];
        
        distractors.push(pool1[Math.floor(Math.random() * pool1.length)]);
        distractors.push(pool2[Math.floor(Math.random() * pool2.length)]);
    } else {
        distractors = ["Plausible but incorrect 1.", "Plausible but incorrect 2."];
    }
    console.log('Distractors: ', distractors); // Debug

    let options = [correctText, ...distractors];
    options = options.sort(() => Math.random() - 0.5); // random order
    console.log('Options: ', options); // Debug

    const optionsDiv = document.getElementById('interpretation-options');
    optionsDiv.innerHTML = '';
    options.forEach(text => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.onclick = () => {
            const isCorrect = text === correctText;
            alert(isCorrect ? "✅ Correct!" : "❌ Not quite right.");
            const slot = document.getElementById(`slot-${index+1}`);
            slot.classList.add(isCorrect ? 'highlight-correct' : 'highlight-incorrect');
            closeInterpretation();
            
            // Track if all interpreted
            completedCards++;
            if (completedCards === 3) {
                finishReading();
            }
        };
        optionsDiv.appendChild(btn);
    });
}

function closeInterpretation() {
    document.getElementById('magnified-area').classList.add('hidden');
    document.getElementById('interpretation-popup').classList.add('hidden');
}

// New finishReading()
function finishReading() {
    // Update card stats
    currentSpread.forEach(card => {
        const stat = cardStats[card.name];
        if (stat) {
            stat.total++;
            if (document.getElementById(`slot-${currentSpread.indexOf(card)+1}`).classList.contains('highlight-correct')) {
                stat.correct++;
            }
        }
    });
    localStorage.setItem(storage.cardStats, JSON.stringify(cardStats));
    
    // Calculate correct count
    const correctCount = document.querySelectorAll('.highlight-correct').length;
    
    // Earnings based on hints setting
    let coinsPerCorrect;
    switch (settings.hints) {
        case 'none': coinsPerCorrect = 9; break;
        case 'basic': coinsPerCorrect = 6; break;
        case 'advanced': coinsPerCorrect = 3; break;
        default: coinsPerCorrect = 6;
    }
    const readingEarnings = correctCount * coinsPerCorrect;
    coins += readingEarnings;
    dailyEarnings += readingEarnings;
    dailyCorrect += correctCount;
    localStorage.setItem(storage.coins, coins);
    
    // Hide table, show thank you bubble
    document.getElementById('table-area').classList.add('hidden');
    document.getElementById('speech-bubble').classList.remove('hidden');
    document.getElementById('start-reading-btn').classList.add('hidden');
    document.getElementById('conclude-reading-btn').classList.remove('hidden');
    
    // Thank you text
    let responseArray;
    if (correctCount <= 1) responseArray = poorResponses;
    else if (correctCount === 2) responseArray = mediumResponses;
    else responseArray = goodResponses;
    document.getElementById('customer-question').textContent = responseArray[Math.floor(Math.random() * responseArray.length)];
    
    // Conclude button text
    let buttonArray;
    if (correctCount <= 1) buttonArray = apologyResponse;
    else if (correctCount === 2) buttonArray = neutralResponse;
    else buttonArray = enthusiasticResponse;
    document.getElementById('conclude-reading-btn').textContent = buttonArray[Math.floor(Math.random() * buttonArray.length)];
}

// Conclude button onclick
document.getElementById('conclude-reading-btn').onclick = () => {
    // Hide customer and bubble
    document.getElementById('speech-bubble').classList.add('hidden');
    document.getElementById('customer-placeholder').textContent = "";
    
    // Alert earnings
    alert(`You earned ${dailyEarnings} coins this reading!`);
    
    // Delay 2.5s, next customer
    setTimeout(() => {
        roundCustomers++;
        startNextCustomer();
    }, 2500);
};

// New showEndDaySummary()
function showEndDaySummary() {
    const averageCorrect = (dailyCorrect / (maxCustomers * 3) * 100).toFixed(1);
    const summary = `You earned ${dailyEarnings} coins today! Average correct interpretations: ${averageCorrect}% per reading.`;
    document.getElementById('day-summary').textContent = summary;
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('end-day-modal').classList.remove('hidden');
}

// New startNewRound()
function startNewRound() {
    closeEndDay();
    startGame();
}

// New closeEndDay(backToMain = false)
function closeEndDay(backToMain = false) {
    document.getElementById('end-day-modal').classList.add('hidden');
    document.getElementById('modal-overlay').classList.add('hidden');
    if (backToMain) {
        document.getElementById('game-area').classList.add('hidden');
        document.getElementById('main-screen').classList.remove('hidden');
    }
}

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