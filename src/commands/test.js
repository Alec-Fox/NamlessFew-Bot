const {
	DEV_ID,
} = require('../util/constants.js');
const { webHookSendMessage } = require ('../util/utilities.js');
module.exports = {
	name: 'test',
	description: 'test command - Dev use only',
	usage: '',
	cooldown: 5,
	modOnly: true,
	async execute(message, args) {
		message.delete();
		if (message.member.id !== DEV_ID) return message.reply('You do not have the privileges to use this command!');
		let argsToMessage = args.toString();
		argsToMessage = argsToMessage.replace(/,/g, ' ');
		webHookSendMessage(argsToMessage);
	},
};