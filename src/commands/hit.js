const { hitMe } = require('../util/blackjack.js');
module.exports = {
	name: 'hit',
	description: 'take another card in a game of Blackjack',
	usage: '',
    cooldown: 1,
    args: false,
	modOnly: false,
	execute(message) {
		message.delete();
        hitMe(message.client, message.member.id, message.member);
	},
};