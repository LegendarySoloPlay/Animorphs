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
let interpretedCards = []; // Track which cards have been interpreted (by index)

// Game round state
let roundCustomers = 0;
const maxCustomers = 3;
let dailyEarnings = 0;
let dailyCorrect = 0;
let currentReadingEarnings = 0; // Track earnings for current reading only
let currentReadingCorrect = 0; // Track correct count for current reading only

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

// Reset card slots for new reading
function resetCardSlots() {
    for (let i = 1; i <= 3; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (slot) {
            slot.innerHTML = '';
            slot.classList.remove('highlight-correct', 'highlight-incorrect');
            slot.onclick = null; // Remove click handlers
        }
    }
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
   generateCustomer();
    
    // Reset card slots
    resetCardSlots();
    
    // Reset interpreted cards tracking
    interpretedCards = [];
    
    // Reset current reading earnings tracking
    currentReadingEarnings = 0;
    currentReadingCorrect = 0;
    
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById('customer-question').textContent = randomQuestion.text;
    currentCategory = randomQuestion.category; 
    
    const randomLabel = buttonLabels[Math.floor(Math.random() * buttonLabels.length)];
    const startBtn = document.getElementById('start-reading-btn');
    startBtn.textContent = randomLabel;
    
    // Remove any existing onclick handlers and set new one
    startBtn.onclick = startReading;
    
    document.getElementById('speech-bubble').classList.remove('hidden');
}

// Start reading function (extracted from onclick for clarity)
function startReading() {
    try {
        if (typeof allCards === 'undefined' || allCards.length === 0) {
            throw new Error('allCards not loaded or empty. Check cardDatabase.js.');
        }
        
        // Hide speech bubble
        document.getElementById('speech-bubble').classList.add('hidden');
        
        // Show table screen
        document.getElementById('table-area').classList.remove('hidden');
        
        // Reset interpreted cards tracking
        interpretedCards = [];
        
        // Reset current reading earnings
        currentReadingEarnings = 0;
        currentReadingCorrect = 0;
        
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
}

function renderThreeCards() {
    console.log('Rendering cards...');
    currentSpread.forEach((card, i) => {
        const slot = document.getElementById(`slot-${i+1}`);
        slot.innerHTML = `
            <strong>${card.name}</strong><br>
            ${card.reversed ? '(Reversed)' : '(Upright)'}
        `;
        slot.onclick = () => {
            // Only allow clicking if card hasn't been interpreted yet
            if (!interpretedCards.includes(i)) {
                console.log('Card clicked: index ' + i);
                showInterpretationPopup(i);
            } else {
                console.log('Card already interpreted, ignoring click');
            }
        };
    });
}

function showInterpretationPopup(index) {
    console.log('Showing popup for index ' + index);
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

    console.log('Generated key: ' + key);

    // Correct interpretation from THIS card
    let correctPool = card[key] || ["Generic correct meaning."];
    console.log('Correct pool: ', correctPool);
    const correctText = correctPool[Math.floor(Math.random() * correctPool.length)];

    // Two distractors from the SAME key on RANDOM cards in REMAINING DECK
    let distractors = [];
    const remainingDeck = deck.slice(3);
    if (remainingDeck.length >= 2) {
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
    console.log('Distractors: ', distractors);

    let options = [correctText, ...distractors];
    options = options.sort(() => Math.random() - 0.5);
    console.log('Options: ', options);

    const optionsDiv = document.getElementById('interpretation-options');
    optionsDiv.innerHTML = '';
    options.forEach(text => {
        const btn = document.createElement('button');
        btn.textContent = text;
        btn.onclick = () => {
            const isCorrect = text === correctText;
            
            // Show feedback
            alert(isCorrect ? "✅ Correct!" : "❌ Not quite right.");
            
            // Apply highlight to the card slot
            const slot = document.getElementById(`slot-${index+1}`);
            slot.classList.add(isCorrect ? 'highlight-correct' : 'highlight-incorrect');
            
            // Track that this card has been interpreted
            interpretedCards.push(index);
            
            // Update current reading stats
            if (isCorrect) {
                currentReadingCorrect++;
                
                // Calculate earnings based on hints setting
                let coinsPerCorrect;
                switch (settings.hints) {
                    case 'none': coinsPerCorrect = 9; break;
                    case 'basic': coinsPerCorrect = 6; break;
                    case 'advanced': coinsPerCorrect = 3; break;
                    default: coinsPerCorrect = 6;
                }
                currentReadingEarnings += coinsPerCorrect;
            }
            
            closeInterpretation();
            
            // Check if all cards have been interpreted
            if (interpretedCards.length === 3) {
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
    currentSpread.forEach((card, index) => {
        const stat = cardStats[card.name];
        if (stat) {
            stat.total++;
            if (document.getElementById(`slot-${index+1}`).classList.contains('highlight-correct')) {
                stat.correct++;
            }
        }
    });
    localStorage.setItem(storage.cardStats, JSON.stringify(cardStats));
    
    // Add current reading earnings to totals
    coins += currentReadingEarnings;
    dailyEarnings += currentReadingEarnings;
    dailyCorrect += currentReadingCorrect;
    localStorage.setItem(storage.coins, coins);
    
    // Hide table, show thank you bubble
    document.getElementById('table-area').classList.add('hidden');
    document.getElementById('speech-bubble').classList.remove('hidden');
    document.getElementById('start-reading-btn').classList.add('hidden');
    document.getElementById('conclude-reading-btn').classList.remove('hidden');
    
    // Thank you text based on correct count
    let responseArray;
    if (currentReadingCorrect <= 1) responseArray = poorResponses;
    else if (currentReadingCorrect === 2) responseArray = mediumResponses;
    else responseArray = goodResponses;
    document.getElementById('customer-question').textContent = responseArray[Math.floor(Math.random() * responseArray.length)];
    
    // Conclude button text based on correct count
    let buttonArray;
    if (currentReadingCorrect <= 1) buttonArray = apologyResponse;
    else if (currentReadingCorrect === 2) buttonArray = neutralResponse;
    else buttonArray = enthusiasticResponse;
    document.getElementById('conclude-reading-btn').textContent = buttonArray[Math.floor(Math.random() * buttonArray.length)];
}

// Conclude button onclick
document.getElementById('conclude-reading-btn').onclick = () => {
    // Hide customer and bubble
    document.getElementById('speech-bubble').classList.add('hidden');
    
    // Alert earnings for this reading only
    alert(`You earned ${currentReadingEarnings} coins from this customer!`);
    
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

// Shop functions (unchanged)
function openShop() {
    document.getElementById('modal-overlay').classList.remove('hidden');
    document.getElementById('shop-modal').classList.remove('hidden');
    document.getElementById('coins-amount').textContent = coins;
    initShopTabs();
    showTab('table');

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
    content.innerHTML = '';
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

        if (!isOwned) {
            const costSpan = document.createElement('span');
            costSpan.classList.add('item-cost');
            costSpan.textContent = `${item.cost} coins`;
            box.appendChild(costSpan);
        }

        if (!isAffordable) {
            box.classList.add('greyed');
        } else if (!isOwned) {
            box.addEventListener('click', () => buyItem(catKey, item));
        } else {
            const input = document.createElement('input');
            input.type = singleSelect.includes(catKey) ? 'radio' : 'checkbox';
            input.name = tabId;
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
        if (singleSelect.includes(category)) {
            selected[category] = item.id;
        } else {
            selected[category].push(item.id);
        }
        document.getElementById('coins-amount').textContent = coins;
        showTab(category.replace('card', 'card-'));
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

function generateCustomer() {
    // First, determine gender (50/50 chance)
    const gender = Math.random() < 0.5 ? 'male' : 'female';

    const size = Math.random() < 0.5 ? 'thick' : 'thin';

     const eyebrowShape = Math.random() < 0.5 ? 'Neutral1' : 'Neutral2';
    
    // Initialize customer object to store all attributes
    const customer = {
        gender: gender,
        size: size,
        skinTone: null,
        eyeColor: null,
        eyes: null,
        eyebrowShape: eyebrowShape,
        eyebrowWeight: null,
        nose: null,
        mouth: null,
        hairTop: null,
        hairBack: null,
        hairSides: null,
        hairColor: null,
        ears: null,
        glasses: null,
        freckles: null,
        frecklePattern: null,
        earrings: null,
        headscarf: null,
        necklace: null,
        shirt: null,
        shirtTone: null, // light, medium, or dark base
        shirtHue: null,   // random hue rotation value
        jacket: null,
    };
    
    // SKIN TONE - Using weighted distribution
    const skinToneRoll = Math.random() * 100;
    if (skinToneRoll < 45) {
        customer.skinTone = 'Tone1';
    } else if (skinToneRoll < 61) { // 45 + 16
        customer.skinTone = 'Tone2';
    } else if (skinToneRoll < 77) { // 61 + 16
        customer.skinTone = 'Tone3';
    } else if (skinToneRoll < 93) { // 77 + 16
        customer.skinTone = 'Tone4';
    } else {
        customer.skinTone = 'Tone5';
    }
    
const eyeColorRoll = Math.random() * 100;
    if (eyeColorRoll < 10) { // 20
        customer.eyeColor = 'Black';
    } else if (eyeColorRoll < 50) { 
        customer.eyeColor = 'Brown';
    } else if (eyeColorRoll < 60) { 
        customer.eyeColor = 'Blue1';
    } else if (eyeColorRoll < 70) { 
        customer.eyeColor = 'Blue2';
    } else if (eyeColorRoll < 80) { 
        customer.eyeColor = 'Gold';
    } else if (eyeColorRoll < 90) { 
        customer.eyeColor = 'Green';
    } else if (eyeColorRoll < 96) { 
        customer.eyeColor = 'Grey';
    } else { 
        customer.eyeColor = 'Lavender';
    }

    // EYES - Gendered options
    if (gender === 'male') {
        const maleEyeOptions = [
            'maleEyes1',
            'maleEyes2',
            'maleEyes3',
            'maleEyes4',
            'maleEyesClosed',
        ];
        customer.eyes = maleEyeOptions[Math.floor(Math.random() * maleEyeOptions.length)];
    } else {
        const femaleEyeOptions = [
            'femaleEyes1',
            'femaleEyes2',
            'femaleEyes3',
            'femaleEyes4',
            'femaleEyesClosed',
        ];
        customer.eyes = femaleEyeOptions[Math.floor(Math.random() * femaleEyeOptions.length)];
    }
    
    // EYEBROWS - 70/30 split based on gender
    if (gender === 'male') {
        // Males: 70% thick, 30% thin
        customer.eyebrowWeight = Math.random() < 0.7 ? 'thick' : 'thin';
    } else {
        // Females: 30% thick, 70% thin (opposite)
        customer.eyebrowWeight = Math.random() < 0.3 ? 'thick' : 'thin';
    }
    
    // NOSE - generic options
        const noseOptions = [
            'nose1',
            'nose2',
            'nose3',
            'nose4',
            'nose5',
            'nose6',
            'nose7'            
        ];
        customer.nose = noseOptions[Math.floor(Math.random() * noseOptions.length)];
    
    
    // MOUTH - generic options
         const mouthOptions = [
            'neutral1',
            'neutral2',
            'neutral3',
            'neutral4',
            'neutral5'           
        ];
        customer.mouth = mouthOptions[Math.floor(Math.random() * mouthOptions.length)];
    
    // EARS - Default ears (will be hidden if headscarf is present)
    customer.ears = `ears1${customer.skinTone}`;
    
// HAIR COLOR - Gendered percentages
if (gender === 'male') {
    const hairColorRoll = Math.random() * 100;
    if (hairColorRoll < 20) { // 20
        customer.hairColor = 'Black';
    } else if (hairColorRoll < 40) { // 20 + 20
        customer.hairColor = 'Brown1';
    } else if (hairColorRoll < 60) { // 40 + 20
        customer.hairColor = 'Brown2';
    } else if (hairColorRoll < 80) { // 60 + 20
        customer.hairColor = 'Blonde';
    } else if (hairColorRoll < 90) { // 80 + 10
        customer.hairColor = 'Red';
    } else if (hairColorRoll < 96) { // 90 + 6
        customer.hairColor = 'Grey';
    } else if (hairColorRoll < 97) { // 96 + 1
        customer.hairColor = 'Green';
    } else if (hairColorRoll < 98) { // 97 + 1
        customer.hairColor = 'Blue';
    } else if (hairColorRoll < 99) { // 98 + 1
        customer.hairColor = 'Pink';
    } else { // 99 + 1
        customer.hairColor = 'Purple';
    }
} else { // female
    const hairColorRoll = Math.random() * 100;
    if (hairColorRoll < 18) { // 18
        customer.hairColor = 'Black';
    } else if (hairColorRoll < 37) { // 18 + 19
        customer.hairColor = 'Brown1';
    } else if (hairColorRoll < 55) { // 37 + 18
        customer.hairColor = 'Brown2';
    } else if (hairColorRoll < 74) { // 55 + 19
        customer.hairColor = 'Blonde';
    } else if (hairColorRoll < 84) { // 74 + 10
        customer.hairColor = 'Red';
    } else if (hairColorRoll < 90) { // 84 + 6
        customer.hairColor = 'Grey';
    } else if (hairColorRoll < 92) { // 90 + 2
        customer.hairColor = 'Green';
    } else if (hairColorRoll < 94) { // 92 + 2
        customer.hairColor = 'Blue';
    } else if (hairColorRoll < 97) { // 94 + 3
        customer.hairColor = 'Pink';
    } else { // 97 + 3
        customer.hairColor = 'Purple';
    }
}

    // GLASSES - 20% chance for both genders
    if (Math.random() < 0.2) {
        if (gender === 'male') {
            const maleGlassesOptions = [
                'clearRound',
                'clearSquare',
                'shadedRound',
                'shadedSquare',
                'slightShadeRound',
                'slightShadeSquare',
                'yellowRound'
            ];
            customer.glasses = maleGlassesOptions[Math.floor(Math.random() * maleGlassesOptions.length)];
        } else {
            const femaleGlassesOptions = [
                'clearRound',
                'clearSquare',
                'shadedRound',
                'shadedSquare',
                'slightShadeRound',
                'slightShadeSquare',
                'yellowRound',
                'pinkRound'
            ];
            customer.glasses = femaleGlassesOptions[Math.floor(Math.random() * femaleGlassesOptions.length)];
        }
    }
    
    // FRECKLES - 10% chance for both genders
    if (Math.random() < 0.1) {
        customer.freckles = true;
    }

    if (customer.freckles) {
        const frecklesOptions = [
                'bodyFreckles1',
                'bodyFreckles2',
                'cheekFreckles1',
                'cheekFreckles2',
                'noseFreckles1',
                'noseFreckles2'
            ];
            customer.frecklePattern = frecklesOptions[Math.floor(Math.random() * frecklesOptions.length)];
    }
    
    // EARRINGS - Gendered percentages (will be hidden if headscarf is present)
    if (gender === 'male') {
        if (Math.random() < 0.1) { // 10% chance
            const maleEarringOptions = [
                'maleCrossbar',
                'maleHoops',
                'maleKeyholes',
                'maleMoons',
                'maleStuds'
            ];
            customer.earrings = maleEarringOptions[Math.floor(Math.random() * maleEarringOptions.length)];
        }
    } else { // female
        if (Math.random() < 0.7) { // 70% chance
            const femaleEarringOptions = [
                'femaleCrossbar',
                'femaleHoops',
                'femaleKeyholes',
                'femaleMoons',
                'femaleStuds',
                'femaleCherries',
                'femaleClouds',
                'femaleDaisies',
                'femaleDangle',
                'femaleGold',
                'femaleHearts',
                'femaleMushrooms',
                'femaleStrawberries'
            ];
            customer.earrings = femaleEarringOptions[Math.floor(Math.random() * femaleEarringOptions.length)];
        }
    }
    
    // Headscarf - 2% of female characters only
    const hasHeadscarf = (gender === 'female' && Math.random() < 0.02);
    if (hasHeadscarf) {
        const headscarfOptions = [
            'headscarfBeige',
            'headscarfBlack',
            'headscarfBlue',
            'headscarfCoral',
            'headscarfGrey',
            'headscarfPurple',
            'headscarfRed'
        ];
        customer.headscarf = headscarfOptions[Math.floor(Math.random() * headscarfOptions.length)];
    } else {
        // Only select hair if no headscarf
        selectHairCombo(customer, gender);
    }
    
    // NECKLACE - Gendered percentages
    if (gender === 'male') {
        if (Math.random() < 0.1) { // 10% chance
            const maleNecklaceOptions = [
                'MaleDogTags',
                'MaleGoldPendant',
                'MaleSteelChain'
            ];
            customer.necklace = maleNecklaceOptions[Math.floor(Math.random() * maleNecklaceOptions.length)];
        }
    } else { // female
        if (Math.random() < 0.7) { // 70% chance
            const femaleNecklaceOptions = [
                'FemaleColouredBeads',
                'FemalePearls',
                'FemaleChoker',
                'FemaleChokerCombo',
                'FemaleDaisy',
                'FemaleDogTags',
                'FemaleGoldPendant',
                'FemalePendants',
                'FemaleSteelChain',
            ];
            customer.necklace = femaleNecklaceOptions[Math.floor(Math.random() * femaleNecklaceOptions.length)];
        }
    }
    
    // OUTFIT - Shirt and Jacket layers with CSS color rotation

    // Choose actual shirt style (gendered)
    if (gender === 'male') {
        const maleShirtOptions = [
            'buttonup1',
            'buttonup2',
            'buttonup3',
            'buttonup4',
            'darkShirt',
            'lightShirt',
            'mediumShirt',
            'darkSweaterCollar',
            'mutedSweaterCollar',
            'sweater1',
            'sweater2',
            'sweater3',
            'sweater4'
        ];
        customer.shirt = maleShirtOptions[Math.floor(Math.random() * maleShirtOptions.length)];
    } else {
        const femaleShirtOptions = [
            'buttonup2',
            'darkShirt',
            'lightShirt',
            'mediumShirt',
            'darkSweaterCollar',
            'mutedSweaterCollar',
            'sweater3',
            'darkStraps',
            'mediumStraps',
            'lightStraps',
            'darkScoopNeck',
            'mediumScoopNeck',
            'lightScoopNeck',
            'darkOffShoulder',
            'mediumOffShoulder',
            'lightOffShoulder'
        ];
        customer.shirt = femaleShirtOptions[Math.floor(Math.random() * femaleShirtOptions.length)];
    }
    
    // Generate random hue rotation for shirt (0-360 degrees)
    customer.shirtHue = Math.floor(Math.random() * 360);
    
    // 50/50 chance for jacket
    if (Math.random() < 0.5) {
        
        if (gender === 'male') {
            const maleJacketOptions = [
                'Bomber1',
                'Bomber2',
                'Bomber3',
                'Cardigan1',
                'Cardigan2',
                'Cardigan3',
                'Denim1',
                'Denim2',
                'Denim3',
                'Furlined1',
                'Furlined2',
                'Furlined3',
                'Plaid1',
                'Plaid2',
                'Plaid3',
            ];
            customer.jacket = maleJacketOptions[Math.floor(Math.random() * maleJacketOptions.length)];
        } else {
            const femaleJacketOptions = [
                'Bomber1',
                'Bomber2',
                'Bomber3',
                'Cardigan1',
                'Cardigan2',
                'Cardigan3',
                'Denim1',
                'Denim2',
                'Denim3',
                'Furlined1',
                'Furlined2',
                'Furlined3',
                'Plaid1',
                'Plaid2',
                'Plaid3',
            ];
            customer.jacket = femaleJacketOptions[Math.floor(Math.random() * femaleJacketOptions.length)];
        }
    }
    
    // Update the HTML elements with the chosen images
    updateCustomerDisplay(customer);
    
    return customer;
}

function updateCustomerDisplay(customer) {
    // Update skin tone base
    document.getElementById('customer-base').src = `assets/Customer Customiser/Skin Tone/${customer.size}${customer.skinTone}.png`;
    
    // Update eyes
    if (customer.eyes) {
        document.getElementById('customer-eyes').src = `assets/Customer Customiser/Eyes/${customer.eyes}${customer.eyeColor}.png`;
    }
    
    // Update eyebrows
    if (customer.eyebrowShape && customer.eyebrowWeight) {
        document.getElementById('customer-eyebrows').src = `assets/Customer Customiser/Eyebrows/${customer.eyebrowWeight}${customer.eyebrowShape}.png`;
    }
    
    // Update nose
    if (customer.nose) {
        document.getElementById('customer-nose').src = `assets/Customer Customiser/Nose/${customer.nose}.png`;
    }
    
    // Update mouth
    if (customer.mouth) {
        document.getElementById('customer-mouth').src = `assets/Customer Customiser/Mouth/${customer.mouth}.png`;
    }
    
    // Check if headscarf is present
    if (customer.headscarf) {
        // headscarf present - hide ears, all hair layers, and earrings
        document.getElementById('customer-ears').style.display = 'none';
        document.getElementById('customer-hair-top').style.display = 'none';
        document.getElementById('customer-hair-back').style.display = 'none';
        document.getElementById('customer-hair-sides').style.display = 'none';
        document.getElementById('customer-earrings').style.display = 'none';
        
        // Show headscarf
        document.getElementById('customer-headscarf').src = `assets/Customer Customiser/Headscarf/${customer.headscarf}.png`;
        document.getElementById('customer-headscarf').style.display = 'block';
    } else {
        // No headscarf - show ears and hair
        if (customer.ears) {
            document.getElementById('customer-ears').src = `assets/Customer Customiser/Ears/${customer.ears}.png`;
            document.getElementById('customer-ears').style.display = 'block';
        }
        
        // Update hair layers with color
        if (customer.hairTop && customer.hairColor) {
            document.getElementById('customer-hair-top').src = `assets/Customer Customiser/HairTop/${customer.hairTop}_${customer.hairColor}.png`;
            document.getElementById('customer-hair-top').style.display = 'block';
        }
        
        if (customer.hairBack && customer.hairColor) {
            document.getElementById('customer-hair-back').src = `assets/Customer Customiser/HairBack/${customer.hairBack}_${customer.hairColor}.png`;
            document.getElementById('customer-hair-back').style.display = 'block';
        } else {
            document.getElementById('customer-hair-back').style.display = 'none';
        }
        
        if (customer.hairSides && customer.hairColor) {
            document.getElementById('customer-hair-sides').src = `assets/Customer Customiser/HairSides/${customer.hairSides}_${customer.hairColor}.png`;
            document.getElementById('customer-hair-sides').style.display = 'block';
        } else {
            document.getElementById('customer-hair-sides').style.display = 'none';
        }
        
        // Show earrings if present (only when no headscarf)
        if (customer.earrings) {
            document.getElementById('customer-earrings').src = `assets/Customer Customiser/Earrings/${customer.earrings}.png`;
            document.getElementById('customer-earrings').style.display = 'block';
        } else {
            document.getElementById('customer-earrings').style.display = 'none';
        }
        
        document.getElementById('customer-headscarf').style.display = 'none';
    }
    
    // Update glasses if present
    if (customer.glasses) {
        document.getElementById('customer-glasses').src = `assets/Customer Customiser/Glasses/${customer.glasses}.png`;
        document.getElementById('customer-glasses').style.display = 'block';
    } else {
        document.getElementById('customer-glasses').style.display = 'none';
    }
    
    // Update freckles if present
    if (customer.freckles) {
        document.getElementById('customer-freckles').src = `assets/Customer Customiser/Freckles/${customer.frecklePattern}.png`;
        document.getElementById('customer-freckles').style.display = 'block';
    } else {
        document.getElementById('customer-freckles').style.display = 'none';
    }
    
    // Update necklace if present
    if (customer.necklace) {
        document.getElementById('customer-necklace').src = `assets/Customer Customiser/Necklaces/${customer.size}${customer.necklace}.png`;
        document.getElementById('customer-necklace').style.display = 'block';
    } else {
        document.getElementById('customer-necklace').style.display = 'none';
    }
    
    // Update shirt with tone and hue rotation
    if (customer.shirt) {
        const shirtElement = document.getElementById('customer-shirt');
        shirtElement.src = `assets/Customer Customiser/Shirts/${customer.shirt}${customer.size}.png`;
        shirtElement.style.filter = `hue-rotate(${customer.shirtHue}deg)`;
        shirtElement.style.display = 'block';
    }
    
    // Update jacket with tone and hue rotation if present
    if (customer.jacket) {
        const jacketElement = document.getElementById('customer-jacket');
        jacketElement.src = `assets/Customer Customiser/Jackets/${customer.size}${customer.jacket}.png`;
        jacketElement.style.display = 'block';
    } else {
        document.getElementById('customer-jacket').style.display = 'none';
    }
}

// Optional: Helper function to regenerate just the colors of existing clothing
function recolorCustomer(shirtHue) {
    if (shirtHue !== undefined) {
        document.getElementById('customer-shirt').style.filter = `hue-rotate(${shirtHue}deg)`;
    }
}

function selectHairCombo(customer, gender) {
    if (gender === 'male') {
        // Male hair length distribution: 60% short, 25% medium, 15% long
        const maleHairByLength = {
            short: {
                probability: 60,
                combos: [
                    { top: '2', back: null, sides: null },
                    { top: '2', back: '2', sides: null },
                    { top: '2', back: '5', sides: null },
                    { top: '2', back: '7', sides: null },
                    { top: '2', back: '12', sides: null },
                    { top: '2', back: '14', sides: null },
                    { top: '3', back: null, sides: null },
                    { top: '3', back: '2', sides: null },
                    { top: '3', back: '5', sides: null },
                    { top: '3', back: '7', sides: null },
                    { top: '3', back: '12', sides: null },
                    { top: '3', back: '14', sides: null },
                    { top: '3', back: null, sides: '2' },
                    { top: '3', back: '2', sides: '2' },
                    { top: '3', back: '5', sides: '2' },
                    { top: '3', back: '7', sides: '2' },
                    { top: '3', back: '12', sides: '2' },
                    { top: '3', back: '14', sides: '2' },
                    { top: '3', back: null, sides: '5' },
                    { top: '3', back: '2', sides: '5' },
                    { top: '3', back: '5', sides: '5' },
                    { top: '3', back: '7', sides: '5' },
                    { top: '3', back: '12', sides: '5' },
                    { top: '3', back: '14', sides: '5' },
                    { top: '4', back: null, sides: null },
                    { top: '4', back: '2', sides: null },
                    { top: '4', back: '5', sides: null },
                    { top: '4', back: '7', sides: null },
                    { top: '4', back: '12', sides: null },
                    { top: '4', back: '14', sides: null },
                    { top: '4', back: null, sides: '2' },
                    { top: '4', back: '2', sides: '2' },
                    { top: '4', back: '5', sides: '2' },
                    { top: '4', back: '7', sides: '2' },
                    { top: '4', back: '12', sides: '2' },
                    { top: '4', back: '14', sides: '2' },
                    { top: '4', back: null, sides: '5' },
                    { top: '4', back: '2', sides: '5' },
                    { top: '4', back: '5', sides: '5' },
                    { top: '4', back: '7', sides: '5' },
                    { top: '4', back: '12', sides: '5' },
                    { top: '4', back: '14', sides: '5' },
                    { top: '5', back: null, sides: null },
                    { top: '5', back: '2', sides: null },
                    { top: '5', back: '5', sides: null },
                    { top: '5', back: '7', sides: null },
                    { top: '5', back: '12', sides: null },
                    { top: '5', back: '14', sides: null },
                    { top: '5', back: null, sides: '2' },
                    { top: '5', back: '2', sides: '2' },
                    { top: '5', back: '5', sides: '2' },
                    { top: '5', back: '7', sides: '2' },
                    { top: '5', back: '12', sides: '2' },
                    { top: '5', back: '14', sides: '2' },
                    { top: '5', back: null, sides: '5' },
                    { top: '5', back: '2', sides: '5' },
                    { top: '5', back: '5', sides: '5' },
                    { top: '5', back: '7', sides: '5' },
                    { top: '5', back: '12', sides: '5' },
                    { top: '5', back: '14', sides: '5' },
                    { top: '6', back: null, sides: null },
                    { top: '6', back: '2', sides: null },
                    { top: '6', back: '5', sides: null },
                    { top: '6', back: '7', sides: null },
                    { top: '6', back: '12', sides: null },
                    { top: '6', back: '14', sides: null },
                    { top: '6', back: null, sides: '2' },
                    { top: '6', back: '2', sides: '2' },
                    { top: '6', back: '5', sides: '2' },
                    { top: '6', back: '7', sides: '2' },
                    { top: '6', back: '12', sides: '2' },
                    { top: '6', back: '14', sides: '2' },
                    { top: '6', back: null, sides: '5' },
                    { top: '6', back: '2', sides: '5' },
                    { top: '6', back: '5', sides: '5' },
                    { top: '6', back: '7', sides: '5' },
                    { top: '6', back: '12', sides: '5' },
                    { top: '6', back: '14', sides: '5' },
                    { top: '7', back: null, sides: null },
                    { top: '7', back: '2', sides: null },
                    { top: '7', back: '5', sides: null },
                    { top: '7', back: '7', sides: null },
                    { top: '7', back: '12', sides: null },
                    { top: '7', back: '14', sides: null },
                    { top: '7', back: null, sides: '2' },
                    { top: '7', back: '2', sides: '2' },
                    { top: '7', back: '5', sides: '2' },
                    { top: '7', back: '7', sides: '2' },
                    { top: '7', back: '12', sides: '2' },
                    { top: '7', back: '14', sides: '2' },
                    { top: '7', back: null, sides: '5' },
                    { top: '7', back: '2', sides: '5' },
                    { top: '7', back: '5', sides: '5' },
                    { top: '7', back: '7', sides: '5' },
                    { top: '7', back: '12', sides: '5' },
                    { top: '7', back: '14', sides: '5' },
                    { top: '9', back: null, sides: null },
                    { top: '9', back: '2', sides: null },
                    { top: '9', back: '5', sides: null },
                    { top: '9', back: '7', sides: null },
                    { top: '9', back: '12', sides: null },
                    { top: '9', back: '14', sides: null },
                    { top: '9', back: null, sides: '2' },
                    { top: '9', back: '2', sides: '2' },
                    { top: '9', back: '5', sides: '2' },
                    { top: '9', back: '7', sides: '2' },
                    { top: '9', back: '12', sides: '2' },
                    { top: '9', back: '14', sides: '2' },
                    { top: '9', back: null, sides: '5' },
                    { top: '9', back: '2', sides: '5' },
                    { top: '9', back: '5', sides: '5' },
                    { top: '9', back: '7', sides: '5' },
                    { top: '9', back: '12', sides: '5' },
                    { top: '9', back: '14', sides: '5' },
                    { top: '10', back: null, sides: null },
                    { top: '10', back: '2', sides: null },
                    { top: '10', back: '5', sides: null },
                    { top: '10', back: '7', sides: null },
                    { top: '10', back: '12', sides: null },
                    { top: '10', back: '14', sides: null },                 
                    { top: '12', back: null, sides: null },
                    { top: '12', back: '2', sides: null },
                    { top: '12', back: '5', sides: null },
                    { top: '12', back: '7', sides: null },
                    { top: '12', back: '12', sides: null },
                    { top: '12', back: '14', sides: null },
                    { top: '12', back: null, sides: '5' },
                    { top: '12', back: '2', sides: '5' },
                    { top: '12', back: '5', sides: '5' },
                    { top: '12', back: '7', sides: '5' },
                    { top: '12', back: '12', sides: '5' },
                    { top: '12', back: '14', sides: '5' },
                    { top: '13', back: null, sides: null },
                    { top: '13', back: '2', sides: null },
                    { top: '13', back: '5', sides: null },
                    { top: '13', back: '7', sides: null },
                    { top: '13', back: '12', sides: null },
                    { top: '13', back: '14', sides: null },
                    { top: '13', back: null, sides: '2' },
                    { top: '13', back: '2', sides: '2' },
                    { top: '13', back: '5', sides: '2' },
                    { top: '13', back: '7', sides: '2' },
                    { top: '13', back: '12', sides: '2' },
                    { top: '13', back: '14', sides: '2' },
                    { top: '13', back: null, sides: '5' },
                    { top: '13', back: '2', sides: '5' },
                    { top: '13', back: '5', sides: '5' },
                    { top: '13', back: '7', sides: '5' },
                    { top: '13', back: '12', sides: '5' },
                    { top: '13', back: '14', sides: '5' },
                    { top: '14', back: null, sides: null },
                    { top: '14', back: '2', sides: null },
                    { top: '14', back: '5', sides: null },
                    { top: '14', back: '7', sides: null },
                    { top: '14', back: '12', sides: null },
                    { top: '14', back: '14', sides: null },
                    { top: '14', back: null, sides: '5' },
                    { top: '14', back: '2', sides: '5' },
                    { top: '14', back: '5', sides: '5' },
                    { top: '14', back: '7', sides: '5' },
                    { top: '14', back: '12', sides: '5' },
                    { top: '14', back: '14', sides: '5' },
                    { top: '16', back: null, sides: null },
                    { top: '16', back: '2', sides: null },
                    { top: '16', back: '5', sides: null },
                    { top: '16', back: '7', sides: null },
                    { top: '16', back: '12', sides: null },
                    { top: '16', back: '14', sides: null },
                    { top: '16', back: null, sides: '2' },
                    { top: '16', back: '2', sides: '2' },
                    { top: '16', back: '5', sides: '2' },
                    { top: '16', back: '7', sides: '2' },
                    { top: '16', back: '12', sides: '2' },
                    { top: '16', back: '14', sides: '2' },
                    { top: '16', back: null, sides: '5' },
                    { top: '16', back: '2', sides: '5' },
                    { top: '16', back: '5', sides: '5' },
                    { top: '16', back: '7', sides: '5' },
                    { top: '16', back: '12', sides: '5' },
                    { top: '16', back: '14', sides: '5' },                
                    { top: '8', back: null, sides: null },
                    { top: '8', back: '5', sides: null },
                    { top: '8', back: '14', sides: null },
                    { top: '11', back: null, sides: null },
                    { top: '11', back: '5', sides: null },
                    { top: '11', back: '14', sides: null },
                    { top: '15', back: null, sides: null },
                    { top: '15', back: '6', sides: null },
                    { top: '15', back: '12', sides: null },
                    { top: '15', back: '14', sides: null }
                ]
            },
            medium: {
                probability: 25,
                combos: [
                    { top: '1', back: null, sides: null },
                    { top: '1', back: '2', sides: null },
                    { top: '1', back: '5', sides: null },
                    { top: '1', back: '6', sides: null },
                    { top: '1', back: '8', sides: null },
                    { top: '1', back: '9', sides: null },
                    { top: '1', back: '10', sides: null },
                    { top: '1', back: '12', sides: null },
                    { top: '1', back: '14', sides: null },
                    { top: '1', back: '2', sides: '2' },
                    { top: '1', back: '5', sides: '2' },
                    { top: '1', back: '6', sides: '2' },
                    { top: '1', back: '8', sides: '2' },
                    { top: '1', back: '9', sides: '2' },
                    { top: '1', back: '10', sides: '2' },
                    { top: '1', back: '12', sides: '2' },
                    { top: '1', back: '14', sides: '2' },
                    { top: '1', back: '2', sides: '5' },
                    { top: '1', back: '5', sides: '5' },
                    { top: '1', back: '6', sides: '5' },
                    { top: '1', back: '8', sides: '5' },
                    { top: '1', back: '9', sides: '5' },
                    { top: '1', back: '10', sides: '5' },
                    { top: '1', back: '12', sides: '5' },
                    { top: '1', back: '14', sides: '5' },
                    { top: '2', back: '6', sides: null },
                    { top: '2', back: '8', sides: null },
                    { top: '2', back: '9', sides: null },
                    { top: '2', back: '10', sides: null },
                    { top: '2', back: '13', sides: null },
                    { top: '3', back: '6', sides: null },
                    { top: '3', back: '8', sides: null },
                    { top: '3', back: '9', sides: null },
                    { top: '3', back: '10', sides: null },
                    { top: '3', back: '13', sides: null },
                    { top: '3', back: '6', sides: '2' },
                    { top: '3', back: '8', sides: '2' },
                    { top: '3', back: '9', sides: '2' },
                    { top: '3', back: '10', sides: '2' },
                    { top: '3', back: '13', sides: '2' },
                    { top: '3', back: '6', sides: '5' },
                    { top: '3', back: '8', sides: '5' },
                    { top: '3', back: '9', sides: '5' },
                    { top: '3', back: '10', sides: '5' },
                    { top: '3', back: '13', sides: '5' },
                    { top: '4', back: '6', sides: null },
                    { top: '4', back: '8', sides: null },
                    { top: '4', back: '9', sides: null },
                    { top: '4', back: '10', sides: null },
                    { top: '4', back: '13', sides: null },
                    { top: '4', back: '6', sides: '2' },
                    { top: '4', back: '8', sides: '2' },
                    { top: '4', back: '9', sides: '2' },
                    { top: '4', back: '10', sides: '2' },
                    { top: '4', back: '13', sides: '2' },
                    { top: '4', back: '6', sides: '5' },
                    { top: '4', back: '8', sides: '5' },
                    { top: '4', back: '9', sides: '5' },
                    { top: '4', back: '10', sides: '5' },
                    { top: '4', back: '13', sides: '5' },
                    { top: '5', back: '6', sides: null },
                    { top: '5', back: '8', sides: null },
                    { top: '5', back: '9', sides: null },
                    { top: '5', back: '10', sides: null },
                    { top: '5', back: '13', sides: null },
                    { top: '5', back: '6', sides: '2' },
                    { top: '5', back: '8', sides: '2' },
                    { top: '5', back: '9', sides: '2' },
                    { top: '5', back: '10', sides: '2' },
                    { top: '5', back: '13', sides: '2' },
                    { top: '5', back: '6', sides: '5' },
                    { top: '5', back: '8', sides: '5' },
                    { top: '5', back: '9', sides: '5' },
                    { top: '5', back: '10', sides: '5' },
                    { top: '5', back: '13', sides: '5' },
                    { top: '6', back: '6', sides: null },
                    { top: '6', back: '8', sides: null },
                    { top: '6', back: '9', sides: null },
                    { top: '6', back: '10', sides: null },
                    { top: '6', back: '13', sides: null },
                    { top: '6', back: '6', sides: '2' },
                    { top: '6', back: '8', sides: '2' },
                    { top: '6', back: '9', sides: '2' },
                    { top: '6', back: '10', sides: '2' },
                    { top: '6', back: '13', sides: '2' },
                    { top: '6', back: '6', sides: '5' },
                    { top: '6', back: '8', sides: '5' },
                    { top: '6', back: '9', sides: '5' },
                    { top: '6', back: '10', sides: '5' },
                    { top: '6', back: '13', sides: '5' },
                    { top: '7', back: '6', sides: null },
                    { top: '7', back: '8', sides: null },
                    { top: '7', back: '9', sides: null },
                    { top: '7', back: '10', sides: null },
                    { top: '7', back: '13', sides: null },
                    { top: '7', back: '6', sides: '2' },
                    { top: '7', back: '8', sides: '2' },
                    { top: '7', back: '9', sides: '2' },
                    { top: '7', back: '10', sides: '2' },
                    { top: '7', back: '13', sides: '2' },
                    { top: '7', back: '6', sides: '5' },
                    { top: '7', back: '8', sides: '5' },
                    { top: '7', back: '9', sides: '5' },
                    { top: '7', back: '10', sides: '5' },
                    { top: '7', back: '13', sides: '5' },
                    { top: '9', back: '6', sides: null },
                    { top: '9', back: '8', sides: null },
                    { top: '9', back: '9', sides: null },
                    { top: '9', back: '10', sides: null },
                    { top: '9', back: '13', sides: null },
                    { top: '9', back: '6', sides: '2' },
                    { top: '9', back: '8', sides: '2' },
                    { top: '9', back: '9', sides: '2' },
                    { top: '9', back: '10', sides: '2' },
                    { top: '9', back: '13', sides: '2' },
                    { top: '9', back: '6', sides: '5' },
                    { top: '9', back: '8', sides: '5' },
                    { top: '9', back: '9', sides: '5' },
                    { top: '9', back: '10', sides: '5' },
                    { top: '9', back: '13', sides: '5' },
                    { top: '10', back: '6', sides: null },
                    { top: '10', back: '8', sides: null },
                    { top: '10', back: '9', sides: null },
                    { top: '10', back: '10', sides: null },
                    { top: '10', back: '13', sides: null },
                    { top: '10', back: '6', sides: '2' },
                    { top: '10', back: '8', sides: '2' },
                    { top: '10', back: '9', sides: '2' },
                    { top: '10', back: '10', sides: '2' },
                    { top: '10', back: '13', sides: '2' },
                    { top: '10', back: '6', sides: '5' },
                    { top: '10', back: '8', sides: '5' },
                    { top: '10', back: '9', sides: '5' },
                    { top: '10', back: '10', sides: '5' },
                    { top: '10', back: '13', sides: '5' },
                    { top: '12', back: '6', sides: null },
                    { top: '12', back: '8', sides: null },
                    { top: '12', back: '9', sides: null },
                    { top: '12', back: '10', sides: null },
                    { top: '12', back: '13', sides: null },
                    { top: '12', back: '6', sides: '2' },
                    { top: '12', back: '8', sides: '2' },
                    { top: '12', back: '9', sides: '2' },
                    { top: '12', back: '10', sides: '2' },
                    { top: '12', back: '13', sides: '2' },
                    { top: '12', back: '6', sides: '5' },
                    { top: '12', back: '8', sides: '5' },
                    { top: '12', back: '9', sides: '5' },
                    { top: '12', back: '10', sides: '5' },
                    { top: '12', back: '13', sides: '5' },
                    { top: '13', back: '6', sides: null },
                    { top: '13', back: '8', sides: null },
                    { top: '13', back: '9', sides: null },
                    { top: '13', back: '10', sides: null },
                    { top: '13', back: '13', sides: null },
                    { top: '13', back: '6', sides: '2' },
                    { top: '13', back: '8', sides: '2' },
                    { top: '13', back: '9', sides: '2' },
                    { top: '13', back: '10', sides: '2' },
                    { top: '13', back: '13', sides: '2' },
                    { top: '13', back: '6', sides: '5' },
                    { top: '13', back: '8', sides: '5' },
                    { top: '13', back: '9', sides: '5' },
                    { top: '13', back: '10', sides: '5' },
                    { top: '13', back: '13', sides: '5' },
                    { top: '14', back: '6', sides: null },
                    { top: '14', back: '8', sides: null },
                    { top: '14', back: '9', sides: null },
                    { top: '14', back: '10', sides: null },
                    { top: '14', back: '13', sides: null },
                    { top: '14', back: '6', sides: '2' },
                    { top: '14', back: '8', sides: '2' },
                    { top: '14', back: '9', sides: '2' },
                    { top: '14', back: '10', sides: '2' },
                    { top: '14', back: '13', sides: '2' },
                    { top: '14', back: '6', sides: '5' },
                    { top: '14', back: '8', sides: '5' },
                    { top: '14', back: '9', sides: '5' },
                    { top: '14', back: '10', sides: '5' },
                    { top: '14', back: '13', sides: '5' },
                    { top: '16', back: '6', sides: null },
                    { top: '16', back: '8', sides: null },
                    { top: '16', back: '9', sides: null },
                    { top: '16', back: '10', sides: null },
                    { top: '16', back: '13', sides: null },
                    { top: '16', back: '6', sides: '2' },
                    { top: '16', back: '8', sides: '2' },
                    { top: '16', back: '9', sides: '2' },
                    { top: '16', back: '10', sides: '2' },
                    { top: '16', back: '13', sides: '2' },
                    { top: '16', back: '6', sides: '5' },
                    { top: '16', back: '8', sides: '5' },
                    { top: '16', back: '9', sides: '5' },
                    { top: '16', back: '10', sides: '5' },
                    { top: '16', back: '13', sides: '5' }
                ]
            },
            long: {
                probability: 15,
                combos: [
                    { top: '1', back: '3', sides: null },
                    { top: '1', back: '11', sides: null },
                    { top: '4', back: '1', sides: null },
                    { top: '4', back: '1', sides: '5' },
                    { top: '6', back: '1', sides: null },
                    { top: '6', back: '11', sides: null },
                    { top: '6', back: '1', sides: '2' },
                    { top: '6', back: '11', sides: '2' },
                    { top: '6', back: '1', sides: '5' },
                    { top: '6', back: '11', sides: '5' },
                    { top: '9', back: '1', sides: null },
                    { top: '9', back: '1', sides: '2' },
                    { top: '9', back: '1', sides: '5' },
                    { top: '12', back: '11', sides: null },
                    { top: '13', back: '1', sides: null },
                    { top: '13', back: '1', sides: '2' },
                    { top: '13', back: '1', sides: '5' },
                    { top: '14', back: '1', sides: null },
                    { top: '14', back: '11', sides: null },
                    { top: '14', back: '1', sides: '5' },
                    { top: '14', back: '11', sides: '5' },                    
                    { top: '16', back: '1', sides: null },
                    { top: '16', back: '11', sides: null },
                    { top: '16', back: '1', sides: '2' },
                    { top: '16', back: '11', sides: '2' },
                    { top: '16', back: '1', sides: '5' },
                    { top: '16', back: '11', sides: '5' }
                ]
            }
        };
        
        selectHairByLength(customer, maleHairByLength);
        
    } else { // female
        // Female hair length distribution: 60% long, 30% medium, 10% short
        const femaleHairByLength = {
            short: {
                probability: 10,
                combos: [
                    { top: '8', back: null, sides: null },
                    { top: '8', back: '2', sides: null },
                    { top: '8', back: '5', sides: null },
                    { top: '8', back: '12', sides: null },
                    { top: '8', back: '14', sides: null },
                    { top: '11', back: null, sides: null },
                    { top: '11', back: '2', sides: null },
                    { top: '11', back: '5', sides: null },
                    { top: '11', back: '12', sides: null },
                    { top: '11', back: '14', sides: null },
                    { top: '15', back: null, sides: null },
                    { top: '15', back: '5', sides: null },
                    { top: '5', back: '9', sides: null },
                    { top: '5', back: '9', sides: '2' },
                    { top: '5', back: '9', sides: '3' },
                    { top: '5', back: '9', sides: '4' },
                    { top: '5', back: '9', sides: '5' },
                    { top: '2', back: '2', sides: null },
                    { top: '2', back: '5', sides: null },
                    { top: '2', back: '7', sides: null },
                    { top: '2', back: '9', sides: null },
                    { top: '2', back: '12', sides: null },
                    { top: '2', back: '14', sides: null },
                    { top: '1', back: '2', sides: null },
                    { top: '1', back: '5', sides: null },
                    { top: '1', back: '7', sides: null },
                    { top: '1', back: '9', sides: null },
                    { top: '1', back: '12', sides: null },
                    { top: '1', back: '14', sides: null },
                    { top: '1', back: '2', sides: '2' },
                    { top: '1', back: '5', sides: '2' },
                    { top: '1', back: '7', sides: '2' },
                    { top: '1', back: '9', sides: '2' },
                    { top: '1', back: '12', sides: '2' },
                    { top: '1', back: '14', sides: '2' },
                    { top: '1', back: '2', sides: '3' },
                    { top: '1', back: '5', sides: '3' },
                    { top: '1', back: '7', sides: '3' },
                    { top: '1', back: '9', sides: '3' },
                    { top: '1', back: '12', sides: '3' },
                    { top: '1', back: '14', sides: '3' },
                    { top: '1', back: '2', sides: '4' },
                    { top: '1', back: '5', sides: '4' },
                    { top: '1', back: '7', sides: '4' },
                    { top: '1', back: '9', sides: '4' },
                    { top: '1', back: '12', sides: '4' },
                    { top: '1', back: '14', sides: '4' },
                    { top: '1', back: '2', sides: '5' },
                    { top: '1', back: '5', sides: '5' },
                    { top: '1', back: '7', sides: '5' },
                    { top: '1', back: '9', sides: '5' },
                    { top: '1', back: '12', sides: '5' },
                    { top: '1', back: '14', sides: '5' },
                    { top: '3', back: '2', sides: null },
                    { top: '3', back: '5', sides: null },
                    { top: '3', back: '7', sides: null },
                    { top: '3', back: '9', sides: null },
                    { top: '3', back: '12', sides: null },
                    { top: '3', back: '14', sides: null },
                    { top: '3', back: '2', sides: '2' },
                    { top: '3', back: '5', sides: '2' },
                    { top: '3', back: '7', sides: '2' },
                    { top: '3', back: '9', sides: '2' },
                    { top: '3', back: '12', sides: '2' },
                    { top: '3', back: '14', sides: '2' },
                    { top: '3', back: '2', sides: '3' },
                    { top: '3', back: '5', sides: '3' },
                    { top: '3', back: '7', sides: '3' },
                    { top: '3', back: '9', sides: '3' },
                    { top: '3', back: '12', sides: '3' },
                    { top: '3', back: '14', sides: '3' },
                    { top: '3', back: '2', sides: '4' },
                    { top: '3', back: '5', sides: '4' },
                    { top: '3', back: '7', sides: '4' },
                    { top: '3', back: '9', sides: '4' },
                    { top: '3', back: '12', sides: '4' },
                    { top: '3', back: '14', sides: '4' },
                    { top: '3', back: '2', sides: '5' },
                    { top: '3', back: '5', sides: '5' },
                    { top: '3', back: '7', sides: '5' },
                    { top: '3', back: '9', sides: '5' },
                    { top: '3', back: '12', sides: '5' },
                    { top: '3', back: '14', sides: '5' },
                    { top: '4', back: '2', sides: null },
                    { top: '4', back: '5', sides: null },
                    { top: '4', back: '7', sides: null },
                    { top: '4', back: '9', sides: null },
                    { top: '4', back: '12', sides: null },
                    { top: '4', back: '14', sides: null },
                    { top: '4', back: '2', sides: '2' },
                    { top: '4', back: '5', sides: '2' },
                    { top: '4', back: '7', sides: '2' },
                    { top: '4', back: '9', sides: '2' },
                    { top: '4', back: '12', sides: '2' },
                    { top: '4', back: '14', sides: '2' },
                    { top: '4', back: '2', sides: '3' },
                    { top: '4', back: '5', sides: '3' },
                    { top: '4', back: '7', sides: '3' },
                    { top: '4', back: '9', sides: '3' },
                    { top: '4', back: '12', sides: '3' },
                    { top: '4', back: '14', sides: '3' },
                    { top: '4', back: '2', sides: '4' },
                    { top: '4', back: '5', sides: '4' },
                    { top: '4', back: '7', sides: '4' },
                    { top: '4', back: '9', sides: '4' },
                    { top: '4', back: '12', sides: '4' },
                    { top: '4', back: '14', sides: '4' },
                    { top: '4', back: '2', sides: '5' },
                    { top: '4', back: '5', sides: '5' },
                    { top: '4', back: '7', sides: '5' },
                    { top: '4', back: '9', sides: '5' },
                    { top: '4', back: '12', sides: '5' },
                    { top: '4', back: '14', sides: '5' },
                    { top: '6', back: '2', sides: null },
                    { top: '6', back: '5', sides: null },
                    { top: '6', back: '7', sides: null },
                    { top: '6', back: '9', sides: null },
                    { top: '6', back: '12', sides: null },
                    { top: '6', back: '14', sides: null },
                    { top: '6', back: '2', sides: '2' },
                    { top: '6', back: '5', sides: '2' },
                    { top: '6', back: '7', sides: '2' },
                    { top: '6', back: '9', sides: '2' },
                    { top: '6', back: '12', sides: '2' },
                    { top: '6', back: '14', sides: '2' },
                    { top: '6', back: '2', sides: '3' },
                    { top: '6', back: '5', sides: '3' },
                    { top: '6', back: '7', sides: '3' },
                    { top: '6', back: '9', sides: '3' },
                    { top: '6', back: '12', sides: '3' },
                    { top: '6', back: '14', sides: '3' },
                    { top: '6', back: '2', sides: '4' },
                    { top: '6', back: '5', sides: '4' },
                    { top: '6', back: '7', sides: '4' },
                    { top: '6', back: '9', sides: '4' },
                    { top: '6', back: '12', sides: '4' },
                    { top: '6', back: '14', sides: '4' },
                    { top: '6', back: '2', sides: '5' },
                    { top: '6', back: '5', sides: '5' },
                    { top: '6', back: '7', sides: '5' },
                    { top: '6', back: '9', sides: '5' },
                    { top: '6', back: '12', sides: '5' },
                    { top: '6', back: '14', sides: '5' },
                    { top: '7', back: '2', sides: null },
                    { top: '7', back: '5', sides: null },
                    { top: '7', back: '7', sides: null },
                    { top: '7', back: '9', sides: null },
                    { top: '7', back: '12', sides: null },
                    { top: '7', back: '14', sides: null },
                    { top: '7', back: '2', sides: '2' },
                    { top: '7', back: '5', sides: '2' },
                    { top: '7', back: '7', sides: '2' },
                    { top: '7', back: '9', sides: '2' },
                    { top: '7', back: '12', sides: '2' },
                    { top: '7', back: '14', sides: '2' },
                    { top: '7', back: '2', sides: '3' },
                    { top: '7', back: '5', sides: '3' },
                    { top: '7', back: '7', sides: '3' },
                    { top: '7', back: '9', sides: '3' },
                    { top: '7', back: '12', sides: '3' },
                    { top: '7', back: '14', sides: '3' },
                    { top: '7', back: '2', sides: '4' },
                    { top: '7', back: '5', sides: '4' },
                    { top: '7', back: '7', sides: '4' },
                    { top: '7', back: '9', sides: '4' },
                    { top: '7', back: '12', sides: '4' },
                    { top: '7', back: '14', sides: '4' },
                    { top: '7', back: '2', sides: '5' },
                    { top: '7', back: '5', sides: '5' },
                    { top: '7', back: '7', sides: '5' },
                    { top: '7', back: '9', sides: '5' },
                    { top: '7', back: '12', sides: '5' },
                    { top: '7', back: '14', sides: '5' },
                    { top: '9', back: '2', sides: null },
                    { top: '9', back: '5', sides: null },
                    { top: '9', back: '7', sides: null },
                    { top: '9', back: '9', sides: null },
                    { top: '9', back: '12', sides: null },
                    { top: '9', back: '14', sides: null },
                    { top: '9', back: '2', sides: '2' },
                    { top: '9', back: '5', sides: '2' },
                    { top: '9', back: '7', sides: '2' },
                    { top: '9', back: '9', sides: '2' },
                    { top: '9', back: '12', sides: '2' },
                    { top: '9', back: '14', sides: '2' },
                    { top: '9', back: '2', sides: '3' },
                    { top: '9', back: '5', sides: '3' },
                    { top: '9', back: '7', sides: '3' },
                    { top: '9', back: '9', sides: '3' },
                    { top: '9', back: '12', sides: '3' },
                    { top: '9', back: '14', sides: '3' },
                    { top: '9', back: '2', sides: '4' },
                    { top: '9', back: '5', sides: '4' },
                    { top: '9', back: '7', sides: '4' },
                    { top: '9', back: '9', sides: '4' },
                    { top: '9', back: '12', sides: '4' },
                    { top: '9', back: '14', sides: '4' },
                    { top: '9', back: '2', sides: '5' },
                    { top: '9', back: '5', sides: '5' },
                    { top: '9', back: '7', sides: '5' },
                    { top: '9', back: '9', sides: '5' },
                    { top: '9', back: '12', sides: '5' },
                    { top: '9', back: '14', sides: '5' },
                    { top: '10', back: '2', sides: null },
                    { top: '10', back: '5', sides: null },
                    { top: '10', back: '7', sides: null },
                    { top: '10', back: '9', sides: null },
                    { top: '10', back: '12', sides: null },
                    { top: '10', back: '14', sides: null },
                    { top: '10', back: '2', sides: '2' },
                    { top: '10', back: '5', sides: '2' },
                    { top: '10', back: '7', sides: '2' },
                    { top: '10', back: '9', sides: '2' },
                    { top: '10', back: '12', sides: '2' },
                    { top: '10', back: '14', sides: '2' },
                    { top: '10', back: '2', sides: '3' },
                    { top: '10', back: '5', sides: '3' },
                    { top: '10', back: '7', sides: '3' },
                    { top: '10', back: '9', sides: '3' },
                    { top: '10', back: '12', sides: '3' },
                    { top: '10', back: '14', sides: '3' },
                    { top: '10', back: '2', sides: '4' },
                    { top: '10', back: '5', sides: '4' },
                    { top: '10', back: '7', sides: '4' },
                    { top: '10', back: '9', sides: '4' },
                    { top: '10', back: '12', sides: '4' },
                    { top: '10', back: '14', sides: '4' },
                    { top: '10', back: '2', sides: '5' },
                    { top: '10', back: '5', sides: '5' },
                    { top: '10', back: '7', sides: '5' },
                    { top: '10', back: '9', sides: '5' },
                    { top: '10', back: '12', sides: '5' },
                    { top: '10', back: '14', sides: '5' },
                    { top: '12', back: '2', sides: null },
                    { top: '12', back: '5', sides: null },
                    { top: '12', back: '7', sides: null },
                    { top: '12', back: '9', sides: null },
                    { top: '12', back: '12', sides: null },
                    { top: '12', back: '14', sides: null },
                    { top: '12', back: '2', sides: '2' },
                    { top: '12', back: '5', sides: '2' },
                    { top: '12', back: '7', sides: '2' },
                    { top: '12', back: '9', sides: '2' },
                    { top: '12', back: '12', sides: '2' },
                    { top: '12', back: '14', sides: '2' },
                    { top: '12', back: '2', sides: '3' },
                    { top: '12', back: '5', sides: '3' },
                    { top: '12', back: '7', sides: '3' },
                    { top: '12', back: '9', sides: '3' },
                    { top: '12', back: '12', sides: '3' },
                    { top: '12', back: '14', sides: '3' },
                    { top: '12', back: '2', sides: '4' },
                    { top: '12', back: '5', sides: '4' },
                    { top: '12', back: '7', sides: '4' },
                    { top: '12', back: '9', sides: '4' },
                    { top: '12', back: '12', sides: '4' },
                    { top: '12', back: '14', sides: '4' },
                    { top: '12', back: '2', sides: '5' },
                    { top: '12', back: '5', sides: '5' },
                    { top: '12', back: '7', sides: '5' },
                    { top: '12', back: '9', sides: '5' },
                    { top: '12', back: '12', sides: '5' },
                    { top: '12', back: '14', sides: '5' },
                    { top: '13', back: '2', sides: null },
                    { top: '13', back: '5', sides: null },
                    { top: '13', back: '7', sides: null },
                    { top: '13', back: '9', sides: null },
                    { top: '13', back: '12', sides: null },
                    { top: '13', back: '14', sides: null },
                    { top: '13', back: '2', sides: '2' },
                    { top: '13', back: '5', sides: '2' },
                    { top: '13', back: '7', sides: '2' },
                    { top: '13', back: '9', sides: '2' },
                    { top: '13', back: '12', sides: '2' },
                    { top: '13', back: '14', sides: '2' },
                    { top: '13', back: '2', sides: '3' },
                    { top: '13', back: '5', sides: '3' },
                    { top: '13', back: '7', sides: '3' },
                    { top: '13', back: '9', sides: '3' },
                    { top: '13', back: '12', sides: '3' },
                    { top: '13', back: '14', sides: '3' },
                    { top: '13', back: '2', sides: '4' },
                    { top: '13', back: '5', sides: '4' },
                    { top: '13', back: '7', sides: '4' },
                    { top: '13', back: '9', sides: '4' },
                    { top: '13', back: '12', sides: '4' },
                    { top: '13', back: '14', sides: '4' },
                    { top: '13', back: '2', sides: '5' },
                    { top: '13', back: '5', sides: '5' },
                    { top: '13', back: '7', sides: '5' },
                    { top: '13', back: '9', sides: '5' },
                    { top: '13', back: '12', sides: '5' },
                    { top: '13', back: '14', sides: '5' },
                    { top: '14', back: '2', sides: null },
                    { top: '14', back: '5', sides: null },
                    { top: '14', back: '7', sides: null },
                    { top: '14', back: '9', sides: null },
                    { top: '14', back: '12', sides: null },
                    { top: '14', back: '14', sides: null },
                    { top: '14', back: '2', sides: '2' },
                    { top: '14', back: '5', sides: '2' },
                    { top: '14', back: '7', sides: '2' },
                    { top: '14', back: '9', sides: '2' },
                    { top: '14', back: '12', sides: '2' },
                    { top: '14', back: '14', sides: '2' },
                    { top: '14', back: '2', sides: '3' },
                    { top: '14', back: '5', sides: '3' },
                    { top: '14', back: '7', sides: '3' },
                    { top: '14', back: '9', sides: '3' },
                    { top: '14', back: '12', sides: '3' },
                    { top: '14', back: '14', sides: '3' },
                    { top: '14', back: '2', sides: '4' },
                    { top: '14', back: '5', sides: '4' },
                    { top: '14', back: '7', sides: '4' },
                    { top: '14', back: '9', sides: '4' },
                    { top: '14', back: '12', sides: '4' },
                    { top: '14', back: '14', sides: '4' },
                    { top: '14', back: '2', sides: '5' },
                    { top: '14', back: '5', sides: '5' },
                    { top: '14', back: '7', sides: '5' },
                    { top: '14', back: '9', sides: '5' },
                    { top: '14', back: '12', sides: '5' },
                    { top: '14', back: '14', sides: '5' },
                    { top: '16', back: '2', sides: null },
                    { top: '16', back: '5', sides: null },
                    { top: '16', back: '7', sides: null },
                    { top: '16', back: '9', sides: null },
                    { top: '16', back: '12', sides: null },
                    { top: '16', back: '14', sides: null },
                    { top: '16', back: '2', sides: '2' },
                    { top: '16', back: '5', sides: '2' },
                    { top: '16', back: '7', sides: '2' },
                    { top: '16', back: '9', sides: '2' },
                    { top: '16', back: '12', sides: '2' },
                    { top: '16', back: '14', sides: '2' },
                    { top: '16', back: '2', sides: '3' },
                    { top: '16', back: '5', sides: '3' },
                    { top: '16', back: '7', sides: '3' },
                    { top: '16', back: '9', sides: '3' },
                    { top: '16', back: '12', sides: '3' },
                    { top: '16', back: '14', sides: '3' },
                    { top: '16', back: '2', sides: '4' },
                    { top: '16', back: '5', sides: '4' },
                    { top: '16', back: '7', sides: '4' },
                    { top: '16', back: '9', sides: '4' },
                    { top: '16', back: '12', sides: '4' },
                    { top: '16', back: '14', sides: '4' },
                    { top: '16', back: '2', sides: '5' },
                    { top: '16', back: '5', sides: '5' },
                    { top: '16', back: '7', sides: '5' },
                    { top: '16', back: '9', sides: '5' },
                    { top: '16', back: '12', sides: '5' },
                    { top: '16', back: '14', sides: '5' }
                ]
            },
            medium: {
                probability: 30,
                combos: [
                    { top: '11', back: '6', sides: null },
                    { top: '8', back: '6', sides: null },
                    { top: '1', back: '6', sides: null },
                    { top: '1', back: '8', sides: null },
                    { top: '1', back: '10', sides: null },
                    { top: '1', back: '13', sides: null },
                    { top: '1', back: '6', sides: '3' },
                    { top: '1', back: '8', sides: '3' },
                    { top: '1', back: '10', sides: '3' },
                    { top: '1', back: '13', sides: '3' },
                    { top: '1', back: '6', sides: '4' },
                    { top: '1', back: '8', sides: '4' },
                    { top: '1', back: '10', sides: '4' },
                    { top: '1', back: '13', sides: '4' },
                    { top: '1', back: '6', sides: '6' },
                    { top: '1', back: '8', sides: '6' },
                    { top: '1', back: '10', sides: '6' },
                    { top: '1', back: '13', sides: '6' },
                    { top: '2', back: '6', sides: null },
                    { top: '2', back: '8', sides: null },
                    { top: '2', back: '10', sides: null },
                    { top: '2', back: '13', sides: null },
                    { top: '2', back: '6', sides: '2' },
                    { top: '2', back: '8', sides: '2' },
                    { top: '2', back: '10', sides: '2' },
                    { top: '2', back: '13', sides: '2' },
                    { top: '2', back: '6', sides: '3' },
                    { top: '2', back: '8', sides: '3' },
                    { top: '2', back: '10', sides: '3' },
                    { top: '2', back: '13', sides: '3' },
                    { top: '2', back: '6', sides: '4' },
                    { top: '2', back: '8', sides: '4' },
                    { top: '2', back: '10', sides: '4' },
                    { top: '2', back: '13', sides: '4' },
                    { top: '2', back: '6', sides: '5' },
                    { top: '2', back: '8', sides: '5' },
                    { top: '2', back: '10', sides: '5' },
                    { top: '2', back: '13', sides: '5' },
                    { top: '3', back: '6', sides: null },
                    { top: '3', back: '8', sides: null },
                    { top: '3', back: '10', sides: null },
                    { top: '3', back: '13', sides: null },
                    { top: '3', back: '6', sides: '2' },
                    { top: '3', back: '8', sides: '2' },
                    { top: '3', back: '10', sides: '2' },
                    { top: '3', back: '13', sides: '2' },
                    { top: '3', back: '6', sides: '3' },
                    { top: '3', back: '8', sides: '3' },
                    { top: '3', back: '10', sides: '3' },
                    { top: '3', back: '13', sides: '3' },
                    { top: '3', back: '6', sides: '4' },
                    { top: '3', back: '8', sides: '4' },
                    { top: '3', back: '10', sides: '4' },
                    { top: '3', back: '13', sides: '4' },
                    { top: '3', back: '6', sides: '5' },
                    { top: '3', back: '8', sides: '5' },
                    { top: '3', back: '10', sides: '5' },
                    { top: '3', back: '13', sides: '5' },
                    { top: '4', back: '6', sides: null },
                    { top: '4', back: '8', sides: null },
                    { top: '4', back: '10', sides: null },
                    { top: '4', back: '13', sides: null },
                    { top: '4', back: '6', sides: '2' },
                    { top: '4', back: '8', sides: '2' },
                    { top: '4', back: '10', sides: '2' },
                    { top: '4', back: '13', sides: '2' },
                    { top: '4', back: '6', sides: '3' },
                    { top: '4', back: '8', sides: '3' },
                    { top: '4', back: '10', sides: '3' },
                    { top: '4', back: '13', sides: '3' },
                    { top: '4', back: '6', sides: '4' },
                    { top: '4', back: '8', sides: '4' },
                    { top: '4', back: '10', sides: '4' },
                    { top: '4', back: '13', sides: '4' },
                    { top: '4', back: '6', sides: '5' },
                    { top: '4', back: '8', sides: '5' },
                    { top: '4', back: '10', sides: '5' },
                    { top: '4', back: '13', sides: '5' },
                    { top: '6', back: '6', sides: null },
                    { top: '6', back: '8', sides: null },
                    { top: '6', back: '10', sides: null },
                    { top: '6', back: '13', sides: null },
                    { top: '6', back: '6', sides: '2' },
                    { top: '6', back: '8', sides: '2' },
                    { top: '6', back: '10', sides: '2' },
                    { top: '6', back: '13', sides: '2' },
                    { top: '6', back: '6', sides: '3' },
                    { top: '6', back: '8', sides: '3' },
                    { top: '6', back: '10', sides: '3' },
                    { top: '6', back: '13', sides: '3' },
                    { top: '6', back: '6', sides: '4' },
                    { top: '6', back: '8', sides: '4' },
                    { top: '6', back: '10', sides: '4' },
                    { top: '6', back: '13', sides: '4' },
                    { top: '6', back: '6', sides: '5' },
                    { top: '6', back: '8', sides: '5' },
                    { top: '6', back: '10', sides: '5' },
                    { top: '6', back: '13', sides: '5' },
                    { top: '9', back: '6', sides: null },
                    { top: '9', back: '8', sides: null },
                    { top: '9', back: '10', sides: null },
                    { top: '9', back: '13', sides: null },
                    { top: '9', back: '6', sides: '2' },
                    { top: '9', back: '8', sides: '2' },
                    { top: '9', back: '10', sides: '2' },
                    { top: '9', back: '13', sides: '2' },
                    { top: '9', back: '6', sides: '3' },
                    { top: '9', back: '8', sides: '3' },
                    { top: '9', back: '10', sides: '3' },
                    { top: '9', back: '13', sides: '3' },
                    { top: '9', back: '6', sides: '4' },
                    { top: '9', back: '8', sides: '4' },
                    { top: '9', back: '10', sides: '4' },
                    { top: '9', back: '13', sides: '4' },
                    { top: '9', back: '6', sides: '5' },
                    { top: '9', back: '8', sides: '5' },
                    { top: '9', back: '10', sides: '5' },
                    { top: '9', back: '13', sides: '5' },
                    { top: '10', back: '6', sides: null },
                    { top: '10', back: '8', sides: null },
                    { top: '10', back: '10', sides: null },
                    { top: '10', back: '13', sides: null },
                    { top: '10', back: '6', sides: '2' },
                    { top: '10', back: '8', sides: '2' },
                    { top: '10', back: '10', sides: '2' },
                    { top: '10', back: '13', sides: '2' },
                    { top: '10', back: '6', sides: '3' },
                    { top: '10', back: '8', sides: '3' },
                    { top: '10', back: '10', sides: '3' },
                    { top: '10', back: '13', sides: '3' },
                    { top: '10', back: '6', sides: '4' },
                    { top: '10', back: '8', sides: '4' },
                    { top: '10', back: '10', sides: '4' },
                    { top: '10', back: '13', sides: '4' },
                    { top: '10', back: '6', sides: '5' },
                    { top: '10', back: '8', sides: '5' },
                    { top: '10', back: '10', sides: '5' },
                    { top: '10', back: '13', sides: '5' },
                    { top: '12', back: '6', sides: null },
                    { top: '12', back: '8', sides: null },
                    { top: '12', back: '10', sides: null },
                    { top: '12', back: '13', sides: null },
                    { top: '12', back: '6', sides: '2' },
                    { top: '12', back: '8', sides: '2' },
                    { top: '12', back: '10', sides: '2' },
                    { top: '12', back: '13', sides: '2' },
                    { top: '12', back: '6', sides: '3' },
                    { top: '12', back: '8', sides: '3' },
                    { top: '12', back: '10', sides: '3' },
                    { top: '12', back: '13', sides: '3' },
                    { top: '12', back: '6', sides: '4' },
                    { top: '12', back: '8', sides: '4' },
                    { top: '12', back: '10', sides: '4' },
                    { top: '12', back: '13', sides: '4' },
                    { top: '12', back: '6', sides: '5' },
                    { top: '12', back: '8', sides: '5' },
                    { top: '12', back: '10', sides: '5' },
                    { top: '12', back: '13', sides: '5' },
                    { top: '13', back: '6', sides: null },
                    { top: '13', back: '8', sides: null },
                    { top: '13', back: '10', sides: null },
                    { top: '13', back: '13', sides: null },
                    { top: '13', back: '6', sides: '2' },
                    { top: '13', back: '8', sides: '2' },
                    { top: '13', back: '10', sides: '2' },
                    { top: '13', back: '13', sides: '2' },
                    { top: '13', back: '6', sides: '3' },
                    { top: '13', back: '8', sides: '3' },
                    { top: '13', back: '10', sides: '3' },
                    { top: '13', back: '13', sides: '3' },
                    { top: '13', back: '6', sides: '4' },
                    { top: '13', back: '8', sides: '4' },
                    { top: '13', back: '10', sides: '4' },
                    { top: '13', back: '13', sides: '4' },
                    { top: '13', back: '6', sides: '5' },
                    { top: '13', back: '8', sides: '5' },
                    { top: '13', back: '10', sides: '5' },
                    { top: '13', back: '13', sides: '5' },
                    { top: '14', back: '6', sides: null },
                    { top: '14', back: '8', sides: null },
                    { top: '14', back: '10', sides: null },
                    { top: '14', back: '13', sides: null },
                    { top: '14', back: '6', sides: '2' },
                    { top: '14', back: '8', sides: '2' },
                    { top: '14', back: '10', sides: '2' },
                    { top: '14', back: '13', sides: '2' },
                    { top: '14', back: '6', sides: '3' },
                    { top: '14', back: '8', sides: '3' },
                    { top: '14', back: '10', sides: '3' },
                    { top: '14', back: '13', sides: '3' },
                    { top: '14', back: '6', sides: '4' },
                    { top: '14', back: '8', sides: '4' },
                    { top: '14', back: '10', sides: '4' },
                    { top: '14', back: '13', sides: '4' },
                    { top: '14', back: '6', sides: '5' },
                    { top: '14', back: '8', sides: '5' },
                    { top: '14', back: '10', sides: '5' },
                    { top: '14', back: '13', sides: '5' },
                    { top: '16', back: '6', sides: null },
                    { top: '16', back: '8', sides: null },
                    { top: '16', back: '10', sides: null },
                    { top: '16', back: '13', sides: null },
                    { top: '16', back: '6', sides: '2' },
                    { top: '16', back: '8', sides: '2' },
                    { top: '16', back: '10', sides: '2' },
                    { top: '16', back: '13', sides: '2' },
                    { top: '16', back: '6', sides: '3' },
                    { top: '16', back: '8', sides: '3' },
                    { top: '16', back: '10', sides: '3' },
                    { top: '16', back: '13', sides: '3' },
                    { top: '16', back: '6', sides: '4' },
                    { top: '16', back: '8', sides: '4' },
                    { top: '16', back: '10', sides: '4' },
                    { top: '16', back: '13', sides: '4' },
                    { top: '16', back: '6', sides: '5' },
                    { top: '16', back: '8', sides: '5' },
                    { top: '16', back: '10', sides: '5' },
                    { top: '16', back: '13', sides: '5' }
                ]
            },
            long: {
                probability: 60,
                combos: [
                    { top: '2', back: '4', sides: null },
                    { top: '2', back: '11', sides: null },
                    { top: '2', back: '4', sides: '2' },
                    { top: '2', back: '11', sides: '2' },
                    { top: '2', back: '4', sides: '5' },
                    { top: '2', back: '11', sides: '5' },
                    { top: '5', back: '4', sides: null },
                    { top: '5', back: '4', sides: '2' },
                    { top: '5', back: '4', sides: '3' },
                    { top: '5', back: '4', sides: '4' },
                    { top: '5', back: '4', sides: '5' },
                    { top: '7', back: '4', sides: null },
                    { top: '7', back: '4', sides: '2' },
                    { top: '7', back: '4', sides: '3' },
                    { top: '7', back: '4', sides: '4' },
                    { top: '7', back: '4', sides: '5' },
                    { top: '9', back: '1', sides: null },
                    { top: '9', back: '3', sides: null },
                    { top: '9', back: '4', sides: null },
                    { top: '9', back: '11', sides: null },
                    { top: '9', back: '1', sides: '1' },
                    { top: '9', back: '3', sides: '1' },
                    { top: '9', back: '4', sides: '1' },
                    { top: '9', back: '11', sides: '1' },
                    { top: '9', back: '1', sides: '2' },
                    { top: '9', back: '3', sides: '2' },
                    { top: '9', back: '4', sides: '2' },
                    { top: '9', back: '11', sides: '2' },
                    { top: '9', back: '1', sides: '3' },
                    { top: '9', back: '3', sides: '3' },
                    { top: '9', back: '4', sides: '3' },
                    { top: '9', back: '11', sides: '3' },
                    { top: '9', back: '1', sides: '4' },
                    { top: '9', back: '3', sides: '4' },
                    { top: '9', back: '4', sides: '4' },
                    { top: '9', back: '11', sides: '4' },
                    { top: '9', back: '1', sides: '5' },
                    { top: '9', back: '3', sides: '5' },
                    { top: '9', back: '4', sides: '5' },
                    { top: '9', back: '11', sides: '5' },
                    { top: '9', back: '1', sides: '6' },
                    { top: '9', back: '3', sides: '6' },
                    { top: '9', back: '4', sides: '6' },
                    { top: '9', back: '11', sides: '6' },
                    { top: '13', back: '1', sides: null },
                    { top: '13', back: '3', sides: null },
                    { top: '13', back: '4', sides: null },
                    { top: '13', back: '11', sides: null },
                    { top: '13', back: '1', sides: '1' },
                    { top: '13', back: '3', sides: '1' },
                    { top: '13', back: '4', sides: '1' },
                    { top: '13', back: '11', sides: '1' },
                    { top: '13', back: '1', sides: '2' },
                    { top: '13', back: '3', sides: '2' },
                    { top: '13', back: '4', sides: '2' },
                    { top: '13', back: '11', sides: '2' },
                    { top: '13', back: '1', sides: '3' },
                    { top: '13', back: '3', sides: '3' },
                    { top: '13', back: '4', sides: '3' },
                    { top: '13', back: '11', sides: '3' },
                    { top: '13', back: '1', sides: '4' },
                    { top: '13', back: '3', sides: '4' },
                    { top: '13', back: '4', sides: '4' },
                    { top: '13', back: '11', sides: '4' },
                    { top: '13', back: '1', sides: '5' },
                    { top: '13', back: '3', sides: '5' },
                    { top: '13', back: '4', sides: '5' },
                    { top: '13', back: '11', sides: '5' },
                    { top: '13', back: '1', sides: '6' },
                    { top: '13', back: '3', sides: '6' },
                    { top: '13', back: '4', sides: '6' },
                    { top: '13', back: '11', sides: '6' },
                    { top: '3', back: '1', sides: null },
                    { top: '3', back: '3', sides: null },
                    { top: '3', back: '11', sides: null },
                    { top: '3', back: '1', sides: '1' },
                    { top: '3', back: '3', sides: '1' },
                    { top: '3', back: '11', sides: '1' },
                    { top: '3', back: '1', sides: '2' },
                    { top: '3', back: '3', sides: '2' },
                    { top: '3', back: '11', sides: '2' },
                    { top: '3', back: '1', sides: '3' },
                    { top: '3', back: '3', sides: '3' },
                    { top: '3', back: '11', sides: '3' },
                    { top: '3', back: '1', sides: '4' },
                    { top: '3', back: '3', sides: '4' },
                    { top: '3', back: '11', sides: '4' },
                    { top: '3', back: '1', sides: '5' },
                    { top: '3', back: '3', sides: '5' },
                    { top: '3', back: '11', sides: '5' },
                    { top: '3', back: '1', sides: '6' },
                    { top: '3', back: '3', sides: '6' },
                    { top: '3', back: '11', sides: '6' },
                    { top: '4', back: '1', sides: null },
                    { top: '4', back: '3', sides: null },
                    { top: '4', back: '11', sides: null },
                    { top: '4', back: '1', sides: '1' },
                    { top: '4', back: '3', sides: '1' },
                    { top: '4', back: '11', sides: '1' },
                    { top: '4', back: '1', sides: '2' },
                    { top: '4', back: '3', sides: '2' },
                    { top: '4', back: '11', sides: '2' },
                    { top: '4', back: '1', sides: '3' },
                    { top: '4', back: '3', sides: '3' },
                    { top: '4', back: '11', sides: '3' },
                    { top: '4', back: '1', sides: '4' },
                    { top: '4', back: '3', sides: '4' },
                    { top: '4', back: '11', sides: '4' },
                    { top: '4', back: '1', sides: '5' },
                    { top: '4', back: '3', sides: '5' },
                    { top: '4', back: '11', sides: '5' },
                    { top: '4', back: '1', sides: '6' },
                    { top: '4', back: '3', sides: '6' },
                    { top: '4', back: '11', sides: '6' },
                    { top: '6', back: '1', sides: null },
                    { top: '6', back: '3', sides: null },
                    { top: '6', back: '11', sides: null },
                    { top: '6', back: '1', sides: '1' },
                    { top: '6', back: '3', sides: '1' },
                    { top: '6', back: '11', sides: '1' },
                    { top: '6', back: '1', sides: '2' },
                    { top: '6', back: '3', sides: '2' },
                    { top: '6', back: '11', sides: '2' },
                    { top: '6', back: '1', sides: '3' },
                    { top: '6', back: '3', sides: '3' },
                    { top: '6', back: '11', sides: '3' },
                    { top: '6', back: '1', sides: '4' },
                    { top: '6', back: '3', sides: '4' },
                    { top: '6', back: '11', sides: '4' },
                    { top: '6', back: '1', sides: '5' },
                    { top: '6', back: '3', sides: '5' },
                    { top: '6', back: '11', sides: '5' },
                    { top: '6', back: '1', sides: '6' },
                    { top: '6', back: '3', sides: '6' },
                    { top: '6', back: '11', sides: '6' },
                    { top: '10', back: '1', sides: null },
                    { top: '10', back: '3', sides: null },
                    { top: '10', back: '11', sides: null },
                    { top: '10', back: '1', sides: '1' },
                    { top: '10', back: '3', sides: '1' },
                    { top: '10', back: '11', sides: '1' },
                    { top: '10', back: '1', sides: '2' },
                    { top: '10', back: '3', sides: '2' },
                    { top: '10', back: '11', sides: '2' },
                    { top: '10', back: '1', sides: '3' },
                    { top: '10', back: '3', sides: '3' },
                    { top: '10', back: '11', sides: '3' },
                    { top: '10', back: '1', sides: '4' },
                    { top: '10', back: '3', sides: '4' },
                    { top: '10', back: '11', sides: '4' },
                    { top: '10', back: '1', sides: '5' },
                    { top: '10', back: '3', sides: '5' },
                    { top: '10', back: '11', sides: '5' },
                    { top: '10', back: '1', sides: '6' },
                    { top: '10', back: '3', sides: '6' },
                    { top: '10', back: '11', sides: '6' },
                    { top: '12', back: '1', sides: null },
                    { top: '12', back: '3', sides: null },
                    { top: '12', back: '11', sides: null },
                    { top: '12', back: '1', sides: '1' },
                    { top: '12', back: '3', sides: '1' },
                    { top: '12', back: '11', sides: '1' },
                    { top: '12', back: '1', sides: '2' },
                    { top: '12', back: '3', sides: '2' },
                    { top: '12', back: '11', sides: '2' },
                    { top: '12', back: '1', sides: '3' },
                    { top: '12', back: '3', sides: '3' },
                    { top: '12', back: '11', sides: '3' },
                    { top: '12', back: '1', sides: '4' },
                    { top: '12', back: '3', sides: '4' },
                    { top: '12', back: '11', sides: '4' },
                    { top: '12', back: '1', sides: '5' },
                    { top: '12', back: '3', sides: '5' },
                    { top: '12', back: '11', sides: '5' },
                    { top: '12', back: '1', sides: '6' },
                    { top: '12', back: '3', sides: '6' },
                    { top: '12', back: '11', sides: '6' },
                    { top: '14', back: '1', sides: null },
                    { top: '14', back: '3', sides: null },
                    { top: '14', back: '11', sides: null },
                    { top: '14', back: '1', sides: '1' },
                    { top: '14', back: '3', sides: '1' },
                    { top: '14', back: '11', sides: '1' },
                    { top: '14', back: '1', sides: '2' },
                    { top: '14', back: '3', sides: '2' },
                    { top: '14', back: '11', sides: '2' },
                    { top: '14', back: '1', sides: '3' },
                    { top: '14', back: '3', sides: '3' },
                    { top: '14', back: '11', sides: '3' },
                    { top: '14', back: '1', sides: '4' },
                    { top: '14', back: '3', sides: '4' },
                    { top: '14', back: '11', sides: '4' },
                    { top: '14', back: '1', sides: '5' },
                    { top: '14', back: '3', sides: '5' },
                    { top: '14', back: '11', sides: '5' },
                    { top: '14', back: '1', sides: '6' },
                    { top: '14', back: '3', sides: '6' },
                    { top: '14', back: '11', sides: '6' },
                    { top: '16', back: '1', sides: null },
                    { top: '16', back: '3', sides: null },
                    { top: '16', back: '11', sides: null },
                    { top: '16', back: '1', sides: '1' },
                    { top: '16', back: '3', sides: '1' },
                    { top: '16', back: '11', sides: '1' },
                    { top: '16', back: '1', sides: '2' },
                    { top: '16', back: '3', sides: '2' },
                    { top: '16', back: '11', sides: '2' },
                    { top: '16', back: '1', sides: '3' },
                    { top: '16', back: '3', sides: '3' },
                    { top: '16', back: '11', sides: '3' },
                    { top: '16', back: '1', sides: '4' },
                    { top: '16', back: '3', sides: '4' },
                    { top: '16', back: '11', sides: '4' },
                    { top: '16', back: '1', sides: '5' },
                    { top: '16', back: '3', sides: '5' },
                    { top: '16', back: '11', sides: '5' },
                    { top: '16', back: '1', sides: '6' },
                    { top: '16', back: '3', sides: '6' },
                    { top: '16', back: '11', sides: '6' }
                ]
            }
        };
        
        selectHairByLength(customer, femaleHairByLength);
    }
}

function selectHairByLength(customer, hairByLength) {
    const roll = Math.random() * 100;
    let cumulativeProbability = 0;
    
    for (const [length, data] of Object.entries(hairByLength)) {
        cumulativeProbability += data.probability;
        if (roll < cumulativeProbability) {
            const selectedCombo = data.combos[Math.floor(Math.random() * data.combos.length)];
            customer.hairTop = selectedCombo.top;
            customer.hairBack = selectedCombo.back;
            customer.hairSides = selectedCombo.sides;
            break;
        }
    }
}
