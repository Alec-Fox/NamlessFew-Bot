const {
	constructEmbed,
} = require('../util/utilities.js');
const {
	calculateLeaderBoards,
} = require('../util/levelsystem.js');

const {
	calculateCashLeaderBoards,
} = require('../util/gambling.js');
module.exports = {
	name: 'leaderboards',
    description: 'Display Namesless Few Leaderboards',
    aliases: ['leaderboard', 'ranks'],
	usage: '',
	cooldown: 5,
	modOnly: false,
	execute(message) {
        message.delete();
        const coinEmoji = message.client.emojis.cache.find(emoji => emoji.name === 'Coin');
        const embed = constructEmbed('Namless Few Leaderboards', '', null, null);
         embed.addFields(
             { name: 'Cash Leaderboards', value: '-----------------------', inline: true },
             { name: 'Level Leaderboards', value: '----------------------', inline: true },
             { name: '\u200B', value: '\u200B', inline: true },
             );
        const xpLeaderboards = calculateLeaderBoards(message.client);
        const cashLeaderboards = calculateCashLeaderBoards(message.client);

        const leaderboardLimit = (xpLeaderboards.length < 10) ? xpLeaderboards.length : 10;
        for(let i = 0; i < leaderboardLimit; i++) {
            embed.addFields(
                { name: `${cashLeaderboards[i][0]} : ${cashLeaderboards[i][1]}${coinEmoji}`, value: '\u200B', inline: true },
             { name: `${xpLeaderboards[i][0]} : ${xpLeaderboards[i][1]}`, value: '\u200B', inline: true },
             { name: '\u200B', value: '\u200B', inline: true },
            );
        }
        return message.channel.send(embed);


	},
};