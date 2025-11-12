//MORPH DECK

const morphDeck = [
    { id: 1, name: "Tiger", type: "morph", staminaCost: 3, attack: 4, health: 5, description: "Powerful predator" },
    { id: 2, name: "Flea", type: "morph", staminaCost: 1, attack: 1, health: 1, description: "Small and hard to hit" },
    { id: 3, name: "Hawk", type: "morph", staminaCost: 2, attack: 2, health: 2, description: "Flying scout" },
    // Add 10-15 more for testing
];

//CORE ENEMY DECK

const enemyTypes = [
    { id: 501, name: "Human Controller", type: "Enemy", copies: 6, attack: 2, health: 5, ambush: "humanControllerAmbush", engage: "humanControllerEngage", strike: "None", danger: "None"},
    { id: 502, name: "Taxxon Controller", type: "Enemy", copies: 6, attack: 3, health: 6, ambush: "None", engage: "None", strike: "taxxonStrike", danger: "taxxonDanger"},
		{ id: 503, name: "Hork-Bajir Controller", type: "Enemy", copies: 6, attack: 4, health: 8, ambush: "None", engage: "horkBajirEngage", strike: "horkBajirStrike", danger: "None"},
		{ id: 504, name: "Tom", type: "Enemy", copies: 1, attack: 2, health: 5, ambush: "None", engage: "tomEngage", strike: "None", danger: "tomDanger"},
		{ id: 505, name: "Vice Principal Chapman", type: "Enemy", copies: 1, attack: 2, health: 5, ambush: "chapmanAmbush", engage: "None", strike: "None", danger: "chapmanDanger"},
		{ id: 506, name: "Visser 3", type: "Enemy", copies: 1, attack: 6, health: 10, ambush: "visser3Ambush", engage: "None", strike: "visser3Strike", danger: "None"}

ambush engage - human (capture innocent, rescue innocent)
ambush strike - visser 3 (morphs on arrival, splits his attack over two targets)
ambush danger - chapman (human controller enters, all humans get +attack)
engage strike - hork bajir (you take damage on attack, slashing blades does damage to a second hero)
engage danger - tom (emotional damage on attack, cant be targetted by jake)
danger strike - taxxon (killing an adjacent enemy heals a taxxon for 3, its attack heals for 1 stamina)



];

//PLOT TWIST DECK

const plotDeck = [
    { id: 601, name: "Visser Three Appears", type: "plot", copies: 5, effect: "spawnEnemy", enemyType: "VisserThree" },
    { id: 602, name: "Taxxon Hunger", type: "plot", copies: 8, effect: "allEnemiesBuff", attackBonus: 1 },
];

//MISSION DECK

const missionDeck = [
		{
			id: 1, 
			name: "The Invasion", 
			type: "mission", 
			boardSize: 5, 
			plotTwistCount: 6, 
			plotTwistEffect: "invasionPlotTwist", 
			enemyAssault: "invasionAssault", 
			objectives: [
										`1`, 
										`2`, 
										`3`, 
										`4`, 
										`5`, 
										`One Animorph must cover the team's escape, even if it means being <i>trapped</i> forever.`
									]  
		},
		{
			id: 2, 
			name: "The Visitor", 
			type: "mission", 
			boardSize: 5, 
			plotTwistCount: 6, 
			plotTwistEffect: "visitorPlotTwist", 
			enemyAssault: "visitorAssault", 
			objectives: [
										`1`, 
										`2`, 
										`3`, 
										`4`, 
										`5`, 
										`6`
									] 
		},
		{
			id: 3, 
			name: "The Visitor", 
			type: "mission", 
			boardSize: 5, 
			plotTwistCount: 6, 
			plotTwistEffect: "encounterPlotTwist", 
			enemyAssault: "encounterAssault", 
			objectives: [
										`1`, 
										`2`, 
										`3`, 
										`4`, 
										`5`, 
										`6`
									] 
		},
];