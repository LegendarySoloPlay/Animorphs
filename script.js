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

// Game state
let coins = 0;
let mastery = new Set(); // Track correctly interpreted cards
let currentSpread = [];
let currentCustomerQuestion = "";
const questions = ["What about my career?", "Tell me about love.", "What's my future health like?", "Advice for a decision?"]; // Add more for variety

function startReading() {
    document.getElementById('story-intro').classList.remove('hidden'); // Show inheritance story once
    currentCustomerQuestion = questions[Math.floor(Math.random() * questions.length)];
    document.getElementById('customer-question').textContent = `Customer asks: ${currentCustomerQuestion}`;
    
    currentSpread = [];
    for (let i = 0; i < 5; i++) {
        const card = allCards[Math.floor(Math.random() * allCards.length)];
        const orientation = Math.random() > 0.5 ? 'upright' : 'reversed';
        currentSpread.push({ ...card, orientation });
    }
    
    const spreadDiv = document.getElementById('spread');
    spreadDiv.innerHTML = '';
    currentSpread.forEach((card, index) => {
        const cardElem = document.createElement('div');
        cardElem.classList.add('card', 'holographic'); // Or 'pixel' for cozy
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
    // Random wrong from pool; contextualize to question for replayability
    const allMeanings = allCards.flatMap(c => [c.upright, c.reversed]);
    return [allMeanings[Math.floor(Math.random() * allMeanings.length)], allMeanings[Math.floor(Math.random() * allMeanings.length)]];
}

function checkAnswer(selected, correct, cardName, index) {
    document.getElementById('enlarged-card').classList.add('hidden');
    if (selected === correct) {
        mastery.add(cardName);
        alert('Correct!'); // Replace with better feedback
    } else {
        alert('Try again next time.');
    }
    // Mark card as interpreted (e.g., gray out)
    document.querySelectorAll('#spread .card')[index].style.opacity = 0.5;
    
    if (currentSpread.every(c => true)) { // All interpreted? (Add check)
        const score = Math.floor(Math.random() * 5) + 1; // Based on corrects
        coins += score * 10;
        updateStats();
        document.getElementById('new-customer').classList.remove('hidden');
    }
}

function updateStats() {
    document.getElementById('coins').textContent = coins;
    document.getElementById('mastery').textContent = `${mastery.size}/78`;
    if (coins > 0) document.getElementById('shop').classList.remove('hidden');
}

function buyItem(item, cost) {
    if (coins >= cost) {
        coins -= cost;
        updateStats();
        alert(`Bought ${item}!`); // Apply effect, e.g., change CSS class for new deck
    }
}

// Init
document.getElementById('new-customer').onclick = startReading;
startReading(); // First reading