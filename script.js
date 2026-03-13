// Tarot data (subset; expand with full 78 from sources like Labyrinthos or EzraCard)
const tarotCards = {
    "Major Arcana": {
        "The Fool": { upright: "innocence, new beginnings, free spirit", reversed: "recklessness, taken advantage of" },
        "The Magician": { upright: "manifestation, power, skill, action", reversed: "manipulation, poor planning, untapped talents" },
        // ... Add all Major from your list
    },
    "Minor Arcana": {
        "Wands": {
            "Ace": { upright: "inspiration, new opportunities, growth, potential", reversed: "delays, lack of direction, distractions, low energy" },
            // ... Add all suits: Wands, Cups, Swords, Pentacles
        },
        // Add Cups, Swords, Pentacles
    }
};

// Flatten for easy random draw
const allCards = [];
for (let suit in tarotCards["Minor Arcana"]) {
    for (let card in tarotCards["Minor Arcana"][suit]) {
        allCards.push({ name: `${card} of ${suit}`, ...tarotCards["Minor Arcana"][suit][card] });
    }
}
for (let card in tarotCards["Major Arcana"]) {
    allCards.push({ name: card, ...tarotCards["Major Arcana"][card] });
}

function startReading() {
    document.getElementById('story-intro').classList.remove('hidden');
    currentCustomerQuestion = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById('customer-question').textContent = `Customer asks: ${currentCustomerQuestion}`;
    
    currentSpread = [];
    for (let i = 0; i < 5; i++) {
        const card = allCards[Math.floor(Math.random() * allCards.length)] || { name: 'Placeholder', upright: 'Positive', reversed: 'Negative' }; // Fallback
        const orientation = Math.random() > 0.5 ? 'upright' : 'reversed';
        currentSpread.push({ ...card, orientation });
    }
    
    const spreadDiv = document.getElementById('spread');
    spreadDiv.innerHTML = '';
    currentSpread.forEach((card, index) => {
        const cardElem = document.createElement('div');
        cardElem.classList.add('card', 'holographic');
        cardElem.textContent = `${card.name} (${card.orientation})`;
        cardElem.onclick = () => showOptions(index);
        spreadDiv.appendChild(cardElem);
    });
    
    document.getElementById('new-customer').classList.add('hidden');
}

function showOptions(index) {
    const card = currentSpread[index];
    const correctMeaning = card[card.orientation];
    const distractors = getDistractors(correctMeaning);
    
    const options = [correctMeaning, ...distractors].sort(() => Math.random() - 0.5);
    document.getElementById('card-name').textContent = card.name;
    document.getElementById('option1').textContent = options[0];
    document.getElementById('option1').onclick = () => checkAnswer(options[0], correctMeaning, card.name, index);
    document.getElementById('option2').textContent = options[1];
    document.getElementById('option2').onclick = () => checkAnswer(options[1], correctMeaning, card.name, index);
    document.getElementById('option3').textContent = options[2];
    document.getElementById('option3').onclick = () => checkAnswer(options[2], correctMeaning, card.name, index);
    
    document.getElementById('enlarged-card').classList.remove('hidden');
}

function getDistractors(correct) {
    const allMeanings = allCards.flatMap(c => [c.upright, c.reversed]);
    return [allMeanings[Math.floor(Math.random() * allMeanings.length)], allMeanings[Math.floor(Math.random() * allMeanings.length)]];
}

function checkAnswer(selected, correct, cardName, index) {
    document.getElementById('enlarged-card').classList.add('hidden');
    if (selected === correct) {
        mastery.add(cardName);
        alert('Correct!');
    } else {
        alert('Try again next time.');
    }
    document.querySelectorAll('#spread .card')[index].style.opacity = 0.5;
    
    // Check if all cards interpreted (simple check for prototype)
    const interpreted = document.querySelectorAll('#spread .card[style*="opacity: 0.5"]');
    if (interpreted.length === 5) {
        const score = mastery.size; // Placeholder
        coins += score * 10;
        updateStats();
        document.getElementById('new-customer').classList.remove('hidden');
    }
}

function updateStats() {
    document.getElementById('coins').textContent = coins;
    document.getElementById('mastery').textContent = `${mastery.size}/78`;
    if (coins > 0) document.getElementById('shop').classList.remove('hidden'); // But controlled separately
    saveState();
}

function buyItem(item, cost) {
    if (coins >= cost) {
        coins -= cost;
        updateStats();
        alert(`Bought ${item}!`);
    }
}

function loadState() {
    coins = parseInt(localStorage.getItem('coins')) || 0;
    mastery = new Set(JSON.parse(localStorage.getItem('mastery')) || []);
    updateStats();
    const hintsLevel = localStorage.getItem('hintsLevel') || 'basic';
    updateHints(hintsLevel);
}

function saveState() {
    localStorage.setItem('coins', coins);
    localStorage.setItem('mastery', JSON.stringify(Array.from(mastery)));
}

// ... keep your tarot data, allCards, questions, etc. ...

let coins = 0;
let mastery = new Set();
let currentSpread = [];
let currentCustomerQuestion = "";

function init() {
    // Force hide everything sensitive
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('game-container').classList.remove('hidden');
    
    // Ensure modals are hidden
    document.getElementById('settings-modal').classList.remove('active');
    document.getElementById('settings-modal').style.display = 'none';
    document.getElementById('shop-modal').classList.remove('active');
    document.getElementById('shop-modal').style.display = 'none';
    
    // Show home screen
    document.getElementById('home-screen').style.display = 'block';
    document.getElementById('game-area').style.display = 'none';

    loadState();
    updateHints(localStorage.getItem('hintsLevel') || 'basic');

    // Demo loading: remove timeout or shorten for production
    // setTimeout(() => { ... }, 2000);  ← already handled above
}

// Home screen → Game
function startGame() {
    document.getElementById('home-screen').style.display = 'none';
    document.getElementById('game-area').style.display = 'block';
    startReading();
}

// Back to home
function backToMenu() {
    document.getElementById('game-area').style.display = 'none';
    document.getElementById('home-screen').style.display = 'block';
    // Optionally reset reading state here if desired
}

// Shop
function openShop() {
    document.getElementById('shop-modal').style.display = 'flex';
    document.getElementById('shop-modal').classList.add('active');
}

function closeShop() {
    document.getElementById('shop-modal').style.display = 'none';
    document.getElementById('shop-modal').classList.remove('active');
}

// Settings
function openSettings() {
    document.getElementById('settings-modal').style.display = 'flex';
    document.getElementById('settings-modal').classList.add('active');
    const level = localStorage.getItem('hintsLevel') || 'basic';
    document.getElementById('hints-level').value = level;
}

function closeSettings() {
    document.getElementById('settings-modal').style.display = 'none';
    document.getElementById('settings-modal').classList.remove('active');
}

function saveSettings() {
    const level = document.getElementById('hints-level').value;
    localStorage.setItem('hintsLevel', level);
    updateHints(level);
    closeSettings();
}

// ... keep your startReading(), showOptions(), checkAnswer(), updateStats(), buyItem(), loadState(), saveState(), updateHints() as before ...

// Event listeners
document.getElementById('start-game').onclick = startGame;
document.getElementById('open-shop').onclick = openShop;
document.getElementById('open-settings').onclick = openSettings;
document.getElementById('back-to-menu').onclick = backToMenu;
document.getElementById('new-customer').onclick = startReading;

// Start the app
init();