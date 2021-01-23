const { lockChannel } = require('../util/voice.js');
module.exports = {
	name: 'lock',
	description: 'Locks your created voice channel, others cannot join without permission',
	usage: '',
	cooldown: 5,
	modOnly: false,
	execute(message) {
		message.delete();
        lockChannel(message);

	},
};