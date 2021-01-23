const {
	constructEmbed,
} = require('../util/utilities.js');
const {
	MOD_ROLE_ID,
} = require('../util/constants.js');
const ms = require('ms');
module.exports = {
	name: 'mute',
	description: 'Mutes a member [Mod use only]',
	usage: '[@member] [duration] [reason] \n\n `[duration]` = [[number][s/m/h/d/w/y]]\n s: secs, m: mins, h:hrs, d:days, w:weeks, y:years \n Example: .mute @Bot 5h Spam',
	args: true,
	cooldown: 5,
	modOnly: true,
	execute(message, args) {
		message.delete();
		if (message.member.roles.highest.comparePositionTo(message.guild.roles.cache.find(role => role.id === MOD_ROLE_ID)) < 0) return message.reply('You are not authorized to use this command.');
		const specifiedMember = message.mentions.members.first();
		if (!specifiedMember) return message.reply(`You did not submit a valid member to mute.\nThe proper usage would be: \`${message.client.config.prefix}${this.name}\` ${this.usage}`);
		if (args.length < 3) {
			const embed = constructEmbed(`\nInvalid command structure.\nThe proper usage would be: \`${message.client.config.prefix}${this.name} ${this.usage}\``, '', null, null);
			return message.channel.send(embed);
		}
		if (specifiedMember.hasPermission('MANAGE_MESSAGES')) return message.reply('Can\'t mute this person.');
		const reasonsArray = args.splice(2, args.length);
		let reasons = reasonsArray.toString();
		reasons = reasons.replace(/,/g, ' ');
		if(ms(args[1]) === undefined) {
			const embed = constructEmbed(`Invalid Duration. \nThe proper usage would be: \`${message.client.config.prefix}${this.name} ${this.usage}\``);
			return message.send(embed);
		}
		message.client.memberinfo[specifiedMember.id].mute(message, specifiedMember, args[1], reasons);
	},
};