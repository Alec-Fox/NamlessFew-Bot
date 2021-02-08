const { checkUserData } = require('../util/blackjack.js');
module.exports = {
	name: 'bj',
	description: 'Gamble in a game of Blackjack',
	usage: '[amount]',
    cooldown: 1,
    args: true,
	modOnly: false,
	execute(message, args) {
		message.delete();
        checkUserData(message.client, message.member.id, message.member.displayName, args, message.member);
	},
};