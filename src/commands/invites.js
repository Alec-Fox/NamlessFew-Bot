const {
	constructEmbed,
} = require('../util/utilities.js');
module.exports = {
	name: 'invites',
	description: 'Displays your invites',
	usage: '',
	cooldown: 5,
	modOnly: false,
	execute(message, args) {
		message.delete();
		if (!args[0]) {
            const embed = constructEmbed(`${message.member.displayName}'s Invites:`, `Server Invites:${message.client.memberinfo[message.author.id].serverinvites.length}
            \nProspect Invites: ${message.client.memberinfo[message.author.id].serverinvitesProspect.length}
            \nMember Invites: ${message.client.memberinfo[message.author.id].serverinvitesMember.length}`);
			embed.setThumbnail(`${message.member.user.displayAvatarURL()}`);
            message.channel.send(embed);
		}
		else {
			const specifiedMember = message.mentions.members.first();
            if (!specifiedMember) return message.reply('You did not submit a valid member view invites.');
            const embed = constructEmbed(`${specifiedMember.displayName}'s Invites:`, `Server Invites:${message.client.memberinfo[specifiedMember.id].serverinvites.length}
            \nProspect Invites: ${message.client.memberinfo[specifiedMember.id].serverinvitesProspect.length}
            \nMember Invites: ${message.client.memberinfo[specifiedMember.id].serverinvitesMember.length}`);
			embed.setThumbnail(`${specifiedMember.user.displayAvatarURL()}`);
            message.channel.send(embed);
			console.log(message.client.memberinfo[specifiedMember.id].serverinvites.length);
		}

	},
};