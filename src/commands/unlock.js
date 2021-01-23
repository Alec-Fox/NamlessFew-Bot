const { unlockChannel } = require('../util/voice.js');
module.exports = {
	name: 'unlock',
	description: 'Locks your created voice channel, others cannot join without permission',
	usage: '',
	cooldown: 5,
	modOnly: false,
	execute(message) {
		message.delete();
        unlockChannel(message);

	},
};