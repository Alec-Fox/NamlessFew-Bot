const {
	DEV_ID,
} = require('../util/constants.js');

module.exports = {
	name: 'test',
	description: 'test command',
	usage: '',
	cooldown: 5,
	modOnly: true,
	execute(message) {
		message.delete();
		if (message.member.id !== DEV_ID) return message.reply('You do not have the privileges to use this command!');
	},
};