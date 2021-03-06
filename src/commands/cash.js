module.exports = {
	name: 'cash',
	description: 'Displays your total cash',
	aliases: ['bank', 'money'],
	usage: '',
	cooldown: 5,
	modOnly: false,
	execute(message, args) {
		message.delete();
		if (!args[0]) {
			message.client.memberinfo[message.author.id].bank(message, message.member);
		}
		else {
			const specifiedMember = message.mentions.members.first();
			if (!specifiedMember) return message.reply('You did not submit a valid member view cash.');
			message.client.memberinfo[specifiedMember.id].bank(message, specifiedMember);
		}

	},
};