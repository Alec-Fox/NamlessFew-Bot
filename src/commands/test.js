const { WeeklyRolePayOut } = require('../util/utilities.js');
module.exports = {
	name: 'test',
	description: 'test role payout',
	usage: '',
	cooldown: 5,
	modOnly: false,
	execute(message) {
		message.delete();
        message.guild.members.cache.forEach(member => member.roles.cache.forEach(role => WeeklyRolePayOut(member, role.id)));
	},
};