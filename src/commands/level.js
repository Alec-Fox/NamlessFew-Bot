module.exports = {
	name: 'level',
	description: 'Display your server level.',
	aliases: ['lvl'],
	usage: '',
    cooldown: 1,
	modOnly: false,
	execute(message, args) {
		message.delete();
		if (!args[0]) {
			message.client.memberinfo[message.author.id].displayLevel(message, message.member);
		}
		else {
			const specifiedMember = message.mentions.members.first();
			if (!specifiedMember) return message.reply('You did not submit a valid member view cash.');
			message.client.memberinfo[specifiedMember.id].displayLevel(message, specifiedMember);
		}
	},
};