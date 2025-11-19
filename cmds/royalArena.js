const arenas = {}; // groupID -> arena data
const arenaSwitch = {}; // groupID -> true/false (arenas on/off)

const longWords = [
    "Uncharacteristically",
    "Psychoneuroimmunology",
    "Counterrevolutionary",
    "Hyperinstitutionalization",
    "Transubstantiationally",
    "Indistinguishability",
    "Phenomenologically",
    "Misinterpretationalism",
    "Interdisciplinaryness",
    "Electroencephalograph"
];

function randomWord() {
    return longWords[Math.floor(Math.random() * longWords.length)];
}

module.exports = async (client, msg, args) => {

    const group = msg.from;
    const sender = msg.sender;

    // TEXT COMMAND: Royal-arenas on/off
    if (msg.body.toLowerCase().startsWith("royal-arenas")) {
        if (!msg.isGroupAdmin && !msg.isOwner) 
            return msg.reply("❌ Only Owner/Mods can toggle arenas");

        const state = msg.body.split(" ")[1];
        if (!state) return msg.reply("Use: Royal-arenas on/off");

        if (state === "on") {
            arenaSwitch[group] = true;
            return msg.reply("👑 Royal Arenas activated.");
        } 
        else if (state === "off") {
            arenaSwitch[group] = false;
            delete arenas[group];
            return msg.reply("🚫 Royal Arenas disabled and arena cleared.");
        } 
        else {
            return msg.reply("Use: Royal-arenas on/off");
        }
    }

    // If arenas are off, block any arena commands
    if (!arenaSwitch[group] && 
        [".crarena", ".jarena", ".sarena", ".sendar", ".larena", ".endarena"]
        .some(cmd => msg.body.startsWith(cmd))) 
    {
        return msg.reply("⚠️ Royal Arenas are disabled in this group.");
    }

    //-- CREATE ARENA --//
    if (msg.body.startsWith(".crarena")) {
        if (arenas[group]) 
            return msg.reply("⚠️ An Arena is already active here.");

        arenas[group] = {
            host: sender,
            players: [],
            playing: false,
            word: null,
            points: {}
        };

        return msg.reply(
            `👑 Arena created by @${sender.split("@")[0]}!\nUse .jarena to join (Limit: 10 players).`,
            { mentions: [sender] }
        );
    }

    //-- JOIN ARENA --//
    if (msg.body.startsWith(".jarena")) {
        if (!arenas[group]) 
            return msg.reply("❌ No Arena exists. Use .crarena first.");

        const arena = arenas[group];

        if (arena.playing) 
            return msg.reply("⚠️ Arena already started. Wait for next match.");

        if (arena.players.includes(sender)) 
            return msg.reply("⚠️ You are already in the Arena.");

        if (arena.players.length >= 10) 
            return msg.reply("🚫 Arena FULL (10/10 players).");

        arena.players.push(sender);
        arena.points[sender] = 0;

        return msg.reply(
            `⚡ @${sender.split("@")[0]} joined the Arena! (${arena.players.length}/10)`,
            { mentions: [sender] }
        );
    }

    //-- LEAVE ARENA --//
    if (msg.body.startsWith(".larena")) {
        if (!arenas[group]) 
            return msg.reply("❌ No Arena to leave.");

        const arena = arenas[group];

        if (!arena.players.includes(sender)) 
            return msg.reply("⚠️ You are not in the Arena.");

        arena.players = arena.players.filter(p => p !== sender);
        delete arena.points[sender];

        if (arena.players.length < 2 && arena.playing) {
            delete arenas[group];
            return msg.reply("💀 Arena ended — not enough players remain.");
        }

        return msg.reply(`🚪 @${sender.split("@")[0]} left the Arena.`);
    }

    //-- START ARENA --//
    if (msg.body.startsWith(".sarena")) {
        if (!arenas[group]) 
            return msg.reply("❌ Create an Arena with .crarena");

        const arena = arenas[group];

        if (arena.host !== sender) 
            return msg.reply("❌ Only the Arena Host can start the match.");

        if (arena.players.length < 2) 
            return msg.reply("⚠️ Need at least 2 players to start.");

        arena.playing = true;

        arena.word = randomWord();

        await msg.reply("🔥 Arena LOCKED!\nMatch begins NOW!");
        return msg.reply(`📜 Type this word:\n\n*${arena.word}*`);
    }

    //-- SEND ANSWER --//
    if (msg.body.startsWith(".sendar")) {
        if (!arenas[group] || !arenas[group].playing) 
            return msg.reply("❌ No active match.");

        const arena = arenas[group];
        if (!arena.players.includes(sender)) 
            return msg.reply("⚠️ You are not in this Arena.");

        const answer = msg.body.split(" ").slice(1).join(" ");
        if (!answer) return msg.reply("Use: .sendar <word>");

        if (answer !== arena.word) 
            return msg.reply("❌ Wrong");

        // correct answer
        arena.points[sender] += 1;

        await msg.reply(
            `✅ Correct! +1 point for @${sender.split("@")[0]}`,
            { mentions: [sender] }
        );

        // Check if player has won
        if (arena.points[sender] >= 10) {
            delete arenas[group];
            return msg.reply(
                `👑 @${sender.split("@")[0]} HAS CLAIMED THE WORD THRONE!\nArena closed.`,
                { mentions: [sender] }
            );
        }

        // Next word
        arena.word = randomWord();
        return msg.reply(`📜 Next word:\n\n*${arena.word}*`);
    }

    //-- END ARENA --//
    if (msg.body.startsWith(".endarena")) {
        if (!arenas[group]) 
            return msg.reply("❌ No Arena to end.");

        const arena = arenas[group];
        if (arena.host !== sender) 
            return msg.reply("❌ Only the Arena Host can end the match.");

        delete arenas[group];
        return msg.reply("💀 Arena ended by the Host.");
    }

};
