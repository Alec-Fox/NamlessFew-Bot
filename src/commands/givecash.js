const {
	constructEmbed,
} = require('../util/utilities.js');
module.exports = {
	name: 'givecash',
	description: 'Gives cash to a member [Mod use only]',
	usage: '[@member] [amount]',
	args: true,
	cooldown: 5,
	modOnly: true,
	execute(message, args) {
		message.delete();
		const specifiedMember = message.mentions.members.first();
		if (!specifiedMember) return message.reply(`You did not submit a valid member to give cash.\nThe proper usage would be: \`${message.client.config.prefix}${this.name}\` ${this.usage}`);
        const amount = Number(args[1]);
        if (isNaN(amount) || !Number.isInteger(amount) || amount < 1) {
			const embed = constructEmbed('Invalid amount of cash', '', null, null);
			return message.channel.send(embed);
		}

		message.client.memberinfo[specifiedMember.id].addCash(message, amount, `${message.member.displayName} gave you ${amount}`);
	},
};