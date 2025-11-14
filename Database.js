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
			missionText: "At the end of each turn, a random Controller captures an Innocent. Controllers get +1 ATTACK for each Innocent they capture. When you defeat a Villain, rescue all Innocents they have captured.",
            plotTwistText: "All captured Innocents are infested and become Controllers. They <strong>Reinforce</strong> the enemy they are currently with.",
            endGameText: "When 10+ Innocents are infested.",
    		plotTwistEffect: "invasionPlotTwist",
            enemyAssaultText: "All Animorphs not currently in a STEALTH morph lose 1 STAMINA.",
			enemyAssault: "invasionAssault",
			objectives: [
						`<strong>Investigate The Sharing:</strong> Use a STEALTH morph's <i>Sneak</i> ability to gather intel from 2+ Controllers at The Beach AND Chapman at The School.`, 
						`<strong>Prevent Infestation:</strong> Rescue 5+ Innocents from Yeerk forces.`,
						`<strong>Free the Hosts:</strong> Break through the Yeerk's battleline and deal 10+ damage to the cages.`,
						`<strong>Permanent Consequences:</strong> One Animorph must cover the team's escape, even if it means being <i>trapped</i> forever.`
						]  
		},
		{
			id: 2, 
			name: "The Visitor", 
			type: "mission", 
			boardSize: 5, 
			plotTwistCount: 6, 
			missionText: "After capturing Melissa Chapman, a Controller gets +4 STAMINA. If you defeat a Controller who currently has Melissa, rescue her (until the next Plot Twist).",
            plotTwistText: "If a Controller has Melissa, she is handed off to their comrade to the left. Otherwise, Melissa is captured by the closest Controller to the Plot Deck. (If there is no lefthand Controller, do nothing.)",
            endGameText: "If Melissa is infested (when captured by the Controller in the Left Flank cell).",
			plotTwistEffect: "visitorPlotTwist", 
            enemyAssaultText: "If a Villain currently has Melissa, any Animorph in their range takes 2 ATTACK.",
			enemyAssault: "visitorAssault", 
			objectives: [
						`<strong>Part of the Family:</strong> Morph Fluffer McKitty and use his <i>Sneak</i> ability to get close to all members of the Chapman family.`,
						`<strong>A Dangerous Delay:</strong> Have 2 characters demorph with less than 10 minutes remaining.`,
						`<strong>Tactical Damage:</strong> Destroy the Bug Fighter behind enemy lines.`
						] 
		},
		{
			id: 3, 
			name: "The Encounter", 
			type: "mission", 
			boardSize: 5, 
			plotTwistCount: 6, 
            missionText: "Each second that ticks by, the Truck Ship gathers more water and air to transport to the Yeerk Pool Ship.",
            plotTwistText: "If there are more aquatic morphs available to acqurie than ones with <i>Flight</i>, the Truck Ship gains 10% water. Otherwise it gains 10% air. If it is a tie, it gains 10% of each.",
            endGameText: "If the Truck Ship completely refuels and leaves the atmosphere.",
			plotTwistEffect: "encounterPlotTwist", 
            enemyAssaultText: "No one's keeping track of time. You don't know how long you've been in morph.",
			enemyAssault: "encounterAssault", 
			objectives: [
						`<strong>Pack Hunters:</strong> Defeat all enemy predators with 4 Animorphs in the same morph.`,
						`<strong>Upstream:</strong> 4 Animorphs must acquire and morph freshwater animals.`, 
						`<strong>Aerial Assault:</strong> <i>Claw</i> an enemy with a Dracon Beam and use it to deal 15+ damage to the Truck Ship.` 
						]
		},
        {
			id: 4, 
			name: "The Message", 
			type: "mission", 
			boardSize: 5, 
			plotTwistCount: 6, 
            missionText: "Locate the Andalite Dome Ship before the Yeerks destroy it.",
            plotTwistText: "An energy blast reverberates through the ocean. The Andalite Dome Ship loses -3 STAMINA.",
            endGameText: "If the Dome Ship's integrity reaches 0 and it implodes.",
			plotTwistEffect: "messagePlotTwist", 
            enemyAssaultText: "Any morph-capable Animorph not currently in morph is pulled beneath the waves, losing -2 STAMINA.",
			enemyAssault: "messageAssault", 
			objectives: [
						`<strong>Dangerous Territory:</strong> Defeat 4+ enemies while in an AQUATIC morph.`,
						`<strong>Navigate the Abyss:</strong> Use a morph's <i>Echolocate</i> ability to find the Andalite Dome Ship.`, 
						`<strong>An Adaptable Ally:</strong> Have Aximili acquire a suitable morph to leave the ship. All morph-cabaple Animorphs must be in AQUATIC morphs to escape.`,
                        `<strong>Race the Tide:</strong> Reach the coast before Visser 3 strikes you down.`
						]
		},
        {
			id: 5, 
			name: "The Predator", 
			type: "mission", 
			boardSize: 6, 
			plotTwistCount: 6, 
            missionText: "Once aboard the Yeerk Pool Ship, escape before you are cornered. There is so little cover on the Yeerk Pool Ship that a maximum of 3 Animorphs can demorph in a single turn.",
            plotTwistText: "You are swarmed by enemies! No-one can demorph this turn.",
            endGameText: "If all Animorphs become trapped in morph or reach 0 STAMINA.",
			plotTwistEffect: "predatorPlotTwist", 
            enemyAssaultText: "Any morph-capable Animorph not in a COMBAT morph loses -2 STAMINA.",
			enemyAssault: "predatorAssault", 
			objectives: [
						`<strong>Hive Mind:</strong> Defeat all enemies to escape with the Z-Space Transponder.`,
						`<strong>Override the Security Grid:</strong> Breach enemy lines to destroy the Security console.`, 
						`<strong>Reach the Dropshaft:</strong> Defeat 10+ Controllers to use the dropshaft and escape.`
						]
		},
];
