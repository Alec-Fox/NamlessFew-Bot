/**
 * Discord BlackJack Bot
 *
 * @author Alec Fox
 */
const {
    MessageAttachment,
} = require('discord.js');
const Canvas = require('canvas');
// const c = require('./constants.js');
const { POKERTABLE_TEMPLATE_PNG, DEALER_CHIP_PNG, BOT_CHANNEL_ID, NF_COIN_PNG } = require('./constants.js');
const { constructBlackjackEmbed } = require('./utilities.js');
const suits = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'];
let deck = new Array();
// let cardSuit = '';
// let cardNumber = 0;

/** resets game of Blackjack
 *
 * @param {number} userID - user ID of player
 *
 */
function resetGame(client, userID, member, gameover, won, draw) {
    const oldMessage = client.memberinfo[userID].blackjack.message;
    oldMessage.delete()
    .then(()=> drawImage(client, userID, member, gameover, won, draw))
    .catch(console.error);
    client.memberinfo[userID].blackjack.bjGameOver = true;
    client.memberinfo[userID].blackjack.bjGameStarted = false;
}
// creates deck of 52 standard playing cards
function createDeck() {
    deck = new Array();
    for (let i = 0; i < values.length; i++) {
        for (let x = 0; x < suits.length; x++) {
            let weight = parseInt(values[i], 10);
            if (weight > 11 && weight < 15) weight = 10;
            const card = { Value: values[i], Suit: suits[x], Weight: weight };
            deck.push(card);
        }
    }
}
// shuffles deck of 52 playing cards
function shuffle() {
    createDeck();
    for (let i = 0; i < 1000; i++) {
        const location1 = Math.floor((Math.random() * deck.length));
        const location2 = Math.floor((Math.random() * deck.length));
        const tmp = deck[location1];
        deck[location1] = deck[location2];
        deck[location2] = tmp;
    }
}
/** creates new instance of the player (resets ledger)
 *
 * @param {number} userID - User's ID of player
 * @param {string} userName - Username of player
 *
 **/
function createPlayers(client, userID) {
    client.memberinfo[userID].blackjack.bjGameOver = false;
    client.memberinfo[userID].blackjack.player.hand = [];
    client.memberinfo[userID].blackjack.dealer.hand = [];
    client.memberinfo[userID].blackjack.player.points = 0;
    client.memberinfo[userID].blackjack.dealer.points = 0;
    client.memberinfo[userID].blackjack.player.aces = 0;
    client.memberinfo[userID].blackjack.dealer.aces = 0;
    client.memberinfo[userID].blackjack.player.acesCount = 0;
    client.memberinfo[userID].blackjack.dealer.acesCount = 0;
}
/**
 * Checks to see if Aces should be worth 11 points or 1 point
 *
 * @param {number} userID - User's ID of player
 * @param {string} player - player or dealer identifier
 *
 */
function checkAces(client, userID, player) {
    if (client.memberinfo[userID].blackjack[player].points > 21) {
        for (let i = 0; i < client.memberinfo[userID].blackjack[player].hand.length; i++) {
            if (client.memberinfo[userID].blackjack[player].hand[i].Value.indexOf('11') === 0) {
                client.memberinfo[userID].blackjack[player].aces += 1;
            }
        }
        while (client.memberinfo[userID].blackjack[player].aces > 0 && client.memberinfo[userID].blackjack[player].points > 21
            && client.memberinfo[userID].blackjack[player].aces > client.memberinfo[userID].blackjack[player].acesCount) {
            client.memberinfo[userID].blackjack[player].points -= 10;
            client.memberinfo[userID].blackjack[player].aces = 0;
            client.memberinfo[userID].blackjack[player].acesCount += 1;
        }
    }
}
const returnCardString = (suit, value) => {
    return `C:/Users/Alec PC/Documents/GitHub/NameslessFewBot/NamlessFew-Bot/src/data/images/blackjackcards/${suit}${value}.png`;
};
/**
 * Deals cards from the deck to the player's hand
 *
 * @param {number} userID - User's ID of player
 * @param {string} player - player or dealer identifier
 *
**/
async function dealCards(client, userID, player) {
    const card = deck.pop();
    client.memberinfo[userID].blackjack[player].hand.push(card);
    const points = card.Weight;
    client.memberinfo[userID].blackjack[player].points += points;
    checkAces(client, userID, player);
}

function endGame(client, userID, payout, member, gameover, won, draw) {
    if(payout > 0) client.memberinfo[userID].addCash(member, payout, `You won ${payout} from Blackjack`);
    if(payout < 0) client.memberinfo[userID].removeCash(member, Math.abs(payout), `You lost ${payout} from Blackjack`);
    const outcome = won ? 'won' : 'lost';
    client.memberinfo[userID].gamblingStats(outcome, client.memberinfo[userID].blackjack.bjBet);
    resetGame(client, userID, member, gameover, won, draw);
}

/**
 * Checks for outcome of blackjack game
 *
 * @param {number} userID - User's ID of player
 * @param {string} userName - Username of player
 *
**/
function checkOutcome(client, userID, userName, isPlayerStaying, member) {
    const userEntry = client.memberinfo[userID].blackjack;
    const bet = userEntry.bjBet;
    const dealerPoints = userEntry.dealer.points;
    const playerPoints = userEntry.player.points;

    if (playerPoints > 21) {
        // constructBlackjackEmbed(client, userName + ' Busted! You lost ' + bet + ' cash!', 'The Dealer Wins!', userID, null);
        return endGame(client, userID, (0 - bet), member, true, false);
    }
 else if (playerPoints === 21) {
        const payout = userEntry.player.hand.length === 2 ? bet * 3 : bet * 2;
        // constructBlackjackEmbed(client, userName + ' got BlackJack!', 'You win ' + payout + ' cash!', userID, null);
        return endGame(client, userID, payout, member, true, true);
    }
 else if (dealerPoints > 21) {
        // constructBlackjackEmbed(client, userName + ' you win ' + bet * 2 + ' cash!', 'The Dealer busted!', userID, null);
        return endGame(client, userID, bet * 2, member, true, true);
    }
 else if (isPlayerStaying) {
        checkStayOutcome(client, dealerPoints, playerPoints, userName, bet, userID, member);
    }
}

function checkStayOutcome(client, dealerPoints, playerPoints, userName, bet, userID, member) {
    if (dealerPoints <= 21 && dealerPoints > playerPoints) {
        // constructBlackjackEmbed(client, userName + ' you lose ' + bet + ' cash!', 'The Dealer Wins!', userID, null);
        return endGame(client, userID, (0 - bet), member, true, false);
    }
 else if (dealerPoints >= 17) {
        if (dealerPoints < playerPoints) {
            // constructBlackjackEmbed(client, userName + ' you win ' + bet * 2 + ' cash!', 'Congrats, my dude!', userID, null);
            return endGame(client, userID, bet * 2, member, true, true);
        }
 else if (dealerPoints === playerPoints) {
            // constructBlackjackEmbed(client, 'It\'s a tie!', 'There are no winners this time.', userID, null);
            return endGame(client, userID, bet, member, false, false, true);
        }
    }
}

const drawImage = async (client, userID, member, gameover, won, draw) => {
    const botChannel = client.channels.cache.find(channel => channel.id === BOT_CHANNEL_ID);
    const applyText = (canvas, size) => {
        const ctx = canvas.getContext('2d');
        ctx.textAlign = 'center';
        ctx.font = `${size}px sans-serif, Cambria Math`;
        return ctx.font;
    };
    const canvas = Canvas.createCanvas(544, 275);
    const ctx = canvas.getContext('2d');
    ctx.save();
    const background = await Canvas.loadImage(POKERTABLE_TEMPLATE_PNG);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(110, 200, 30, 0, 2 * Math.PI, false);
    ctx.clip();
    const userImage = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'png' }));
    ctx.drawImage(userImage, 86, 173, 60, 60);
    ctx.restore();
    ctx.font = applyText(canvas, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${member.user.tag}`, canvas.width / 2, 252);
    let xIncrementPlayer = 0;
    let xIncrementDealer = 0;
    for (let i = 0; i < client.memberinfo[userID].blackjack['player'].hand.length; i++) {
        const cardPng = await Canvas.loadImage(returnCardString(client.memberinfo[userID].blackjack['player'].hand[i].Suit, client.memberinfo[userID].blackjack['player'].hand[i].Value));
        ctx.drawImage(cardPng, 165 + xIncrementPlayer, 175, 38, 55);
        xIncrementPlayer += 60;
    }
    ctx.font = applyText(canvas, 25);
    ctx.fillText(`${client.memberinfo[userID].blackjack['player'].points}`, 114, 150);
    const dealerImage = await Canvas.loadImage(DEALER_CHIP_PNG);
    ctx.drawImage(dealerImage, 405, 56, 60, 60);
    for (let i = 0; i < client.memberinfo[userID].blackjack['dealer'].hand.length; i++) {
        const cardPng = await Canvas.loadImage(returnCardString(client.memberinfo[userID].blackjack['dealer'].hand[i].Suit, client.memberinfo[userID].blackjack['dealer'].hand[i].Value));
        ctx.drawImage(cardPng, 355 - xIncrementDealer, 60, 38, 55);
        xIncrementDealer += 60;
    }
    ctx.font = applyText(canvas, 25);
    ctx.fillText(`${client.memberinfo[userID].blackjack['dealer'].points}`, 438, 150);
    ctx.textAlign = 'right';
    ctx.fillText(`${client.memberinfo[userID].blackjack.bjBet}`, 250, 150);
    const coinImage = await Canvas.loadImage(NF_COIN_PNG);
    ctx.drawImage(coinImage, 255, 130, 25, 25);
    if (gameover === true && won === true) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.52)';
        const x1 = 138.5;
        const y1 = canvas.height / 2;
        const radius1 = 142;
        const startAngle1 = Math.PI * 0.5;
        const endAngle1 = Math.PI * 1.5;
        const antiClockwise1 = false;

        const x2 = canvas.width - 138.5;
        const y2 = canvas.height / 2;
        const radius2 = 142;
        const startAngle2 = Math.PI * 1.5;
        const endAngle2 = Math.PI * 0.5;
        const antiClockwise2 = false;
        ctx.beginPath();
        ctx.arc(x1, y1, radius1, startAngle1, endAngle1, antiClockwise1);
        ctx.lineTo(canvas.width - 138, 0);
        ctx.arc(x2, y2, radius2, startAngle2, endAngle2, antiClockwise2);
        ctx.closePath();
        ctx.fill();
        ctx.font = applyText(canvas, 60);
        ctx.fillStyle = 'rgba(255, 255, 255, .9)';
        ctx.fillText('YOU WIN!', 272, 168);
    }
    if (gameover === true && won === false) {
        ctx.fillStyle = 'rgba(255, 0, 0, .52)';
        const x1 = 138.5;
        const y1 = canvas.height / 2;
        const radius1 = 142;
        const startAngle1 = Math.PI * 0.5;
        const endAngle1 = Math.PI * 1.5;
        const antiClockwise1 = false;

        const x2 = canvas.width - 138.5;
        const y2 = canvas.height / 2;
        const radius2 = 142;
        const startAngle2 = Math.PI * 1.5;
        const endAngle2 = Math.PI * 0.5;
        const antiClockwise2 = false;
        ctx.beginPath();
        ctx.arc(x1, y1, radius1, startAngle1, endAngle1, antiClockwise1);
        ctx.lineTo(canvas.width - 138, 0);
        ctx.arc(x2, y2, radius2, startAngle2, endAngle2, antiClockwise2);
        ctx.closePath();
        ctx.fill();
        ctx.font = applyText(canvas, 55);
        ctx.fillStyle = 'rgba(255, 255, 255, .9)';
        ctx.fillText('YOU LOSE', 272, 168);
    }
    if (draw === true) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.52)';
        const x1 = 138.5;
        const y1 = canvas.height / 2;
        const radius1 = 142;
        const startAngle1 = Math.PI * 0.5;
        const endAngle1 = Math.PI * 1.5;
        const antiClockwise1 = false;

        const x2 = canvas.width - 138.5;
        const y2 = canvas.height / 2;
        const radius2 = 142;
        const startAngle2 = Math.PI * 1.5;
        const endAngle2 = Math.PI * 0.5;
        const antiClockwise2 = false;
        ctx.beginPath();
        ctx.arc(x1, y1, radius1, startAngle1, endAngle1, antiClockwise1);
        ctx.lineTo(canvas.width - 138, 0);
        ctx.arc(x2, y2, radius2, startAngle2, endAngle2, antiClockwise2);
        ctx.closePath();
        ctx.fill();
        ctx.font = applyText(canvas, 60);
        ctx.fillStyle = 'rgba(255, 255, 255, .9)';
        ctx.fillText('DRAW', 272, 168);
    }
    const attachment = new MessageAttachment(canvas.toBuffer(), 'pokerTable.png');
    botChannel.send(attachment).then(message => client.memberinfo[userID].blackjack.message = message);
};
/**
 * Deals starting hands for blackjack and creates array for new player
 *
 * @param {number} userID - User's ID of player
 * @param {string} userName - Username of player
 *
**/
async function dealHands(client, userID, userName, bet, member) {
    if (bet > client.memberinfo[userID].cash) {
        constructBlackjackEmbed(client, userName + ' you dont have enough cash!', null, userID, null);
        client.memberinfo[userID].blackjack.bjGameStarted = false;
        return;
    }
    client.memberinfo[userID].blackjack.bjBet = bet;
    if (!client.memberinfo[userID].blackjack.bjGameStarted) {
        client.memberinfo[userID].blackjack.bjGameStarted = true;
        shuffle();
        createPlayers(client, userID);
        dealCards(client, userID, 'dealer');
        for (let i = 1; i <= 2; i++) {
            dealCards(client, userID, 'player');
        }
        drawImage(client, userID, member);
        checkOutcome(client, userID, userName, false, member);

    }
 else {
        constructBlackjackEmbed(client, userName + ' you need to finish your game in progress!', null, userID, null);
    }
}

/**
 * Populates the blackjack fields for the provided user in the ledger
 * iff they don't already exist.
 *
 * @param {String} userID  - the id of the user
 * @param {String} userName - the name of the user
 */
function maybePopulateBlackjackUserFields(client, userID, userName) {
    if (!client.memberinfo[userID].blackjack || !client.memberinfo[userID].blackjack.player) {
        createPlayers(client, userID, userName);
    }
}

/**
 * Restores the old deck if a game was ongoing.
 *
 * @param {number} userID - User's ID of player
 */
function maybeRestoreOldDeck(client, userID) {
    if (deck.length !== 0) { return; }
    shuffle();
    const combinedOldHands = client.memberinfo[userID].blackjack.player.hand.concat(client.memberinfo[userID].blackjack.dealer.hand);
    deck = deck.filter(function(card) {
        return !combinedOldHands.includes(card);
    });
}

/**
 * Adds card from top of deck to player's hand
 *
 * @param {number} userID - User's ID of player
 * @param {string} userName - Username of player
 *
**/
exports.hitMe = function(client, userID, member) {
    maybePopulateBlackjackUserFields(client, userID, member.displayName);
    if (client.memberinfo[userID].blackjack.player.points < 21 && !client.memberinfo[userID].blackjack.bjGameOver) {
        maybeRestoreOldDeck(client, userID);
        dealCards(client, userID, 'player');
        const oldMessage = client.memberinfo[userID].blackjack.message;
        oldMessage.delete()
        .then(msg => console.log(`deleted message ${msg.id}`))
        .catch(console.error);
        drawImage(client, userID, member).then(() => setTimeout(() => checkOutcome(client, userID, member.displayName, false, member), 1000));
    }
 else {
        constructBlackjackEmbed(client, member.displayName + ' you need to start a new game!', null, userID, null);
    }
};

/**
 * Finalizes Player's hand and intitiates dealer's turn
 *
 * @param {number} userID - User's ID of player
 * @param {string} userName - Username of player
 *
**/
exports.stay = function(client, userID, member) {
    maybePopulateBlackjackUserFields(client, userID, member.displayName);

    if (client.memberinfo[userID].blackjack.player.points > 0 && !client.memberinfo[userID].blackjack.bjGameOver) {
        maybeRestoreOldDeck(client, userID);
        while (dealerShouldHit(client, userID)) {
            dealCards(client, userID, 'dealer');
            checkOutcome(client, userID, member.displayName, true, member);
        }
    }
 else {
        constructBlackjackEmbed(client, member.displayName + ' you need to start a new game!', null, userID, null);
    }
};

/** Checks to see if the bet is a valid number
 *
 * @param {number} userID -user ID of player
 * @param {string} userName -username of player
 * @param {array} args -array of user's message after command
 *
 */
exports.checkUserData = function(client, userID, userName, args, member) {
    maybePopulateBlackjackUserFields(client, userID, userName);
    const bet = Number(args[0]);
    if (!bet || !Number.isInteger(bet) || bet < 0) {
        constructBlackjackEmbed(client, userName + ' that\'s an invalid bet.', null, userID, null);
        return;
    }
    if (!client.memberinfo[userID].blackjack.bjGameStarted) {
        dealHands(client, userID, userName, bet, member);
    }
 else {
        constructBlackjackEmbed(client, userName + ' you already have a game in progress!', null, userID, null);
    }
};

function dealerShouldHit(client, userID) {
    const dealerPoints = client.memberinfo[userID].blackjack.dealer.points;
    const userPoints = client.memberinfo[userID].blackjack.player.points;
    if (dealerPoints <= userPoints && dealerPoints < 17) return true;
    else return false;
}