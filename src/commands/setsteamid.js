module.exports = {
	name: 'setsteamid',
	description: 'sets your steam ID',
	usage: '[steamID]',
	args: true,
	cooldown: 5,
	modOnly: false,
	execute(message, args) {
        message.delete();
        message.client.memberinfo[message.member.id].setSteamId(message, args);
	},
};