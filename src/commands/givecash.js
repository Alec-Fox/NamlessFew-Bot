const {
    constructEmbed,
    checkCash,
} = require('../util/utilities.js');
module.exports = {
	name: 'givecash',
	description: 'Gives cash to another member',
	aliases: ['give', 'pay', 'givemoney'],
	usage: '[@member] [amount]',
	args: true,
	cooldown: 5,
	modOnly: false,
	execute(message, args) {
		const specifiedMember = message.mentions.members.first();
		const coinEmoji = message.client.emojis.cache.find(emoji => emoji.name === 'Coin');
		if (!specifiedMember || specifiedMember === message.member) return message.reply(`You did not submit a valid member to give cash.\nThe proper usage would be: \`${message.client.config.prefix}${this.name}\` ${this.usage}`);
        const amount = Number(args[1]);
        if (isNaN(amount) || !Number.isInteger(amount) || amount < 1) {
			const embed = constructEmbed('Invalid amount of cash', '', null, null);
			return message.channel.send(embed);
        }
        if (checkCash(message, args[1]) === false) {
            const embed = constructEmbed('You do not have enough cash', '', null, null);
			return message.channel.send(embed);
        }

        message.client.memberinfo[message.member.id].removeCash(message.member, amount, `You gave ${specifiedMember.displayName} ${amount}${coinEmoji}`);
		message.client.memberinfo[specifiedMember.id].addCash(specifiedMember, amount, `${message.member.displayName} gave you ${amount}${coinEmoji}`);
	},
};