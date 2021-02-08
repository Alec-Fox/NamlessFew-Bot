const { stay } = require('../util/blackjack.js');
module.exports = {
	name: 'stay',
	description: 'End your turn in a game of blackjack',
	usage: '',
    cooldown: 1,
    args: false,
	modOnly: false,
	execute(message) {
		message.delete();
        stay(message.client, message.member.id, message.member);
	},
};