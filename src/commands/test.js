const {
	DEV_ID,
} = require('../util/constants.js');

const {
	calculateLeaderBoards,
} = require('../util/levelsystem.js');

const {
	calculateCashLeaderBoards,
} = require('../util/gambling.js');

module.exports = {
	name: 'test',
	description: 'test command - Dev use only',
	usage: '',
	cooldown: 5,
	modOnly: true,
	execute(message) {
		message.delete();
		if (message.member.id !== DEV_ID) return message.reply('You do not have the privileges to use this command!');
		const xpLeaderboards = calculateLeaderBoards(message.client);
		console.dir(xpLeaderboards);
		console.log(calculateCashLeaderBoards(message.client));
	},
};