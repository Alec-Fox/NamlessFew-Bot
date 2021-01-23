const {
    CREATE_VOICE_CHANNEL_ID,
    CREATE_VOICE_CHANNEL_PARENT_ID,
    GUILD_ID,
    MOD_ROLE_ID,
} = require('./constants.js');
const voiceLogger = require('./voicelogger.js');
/** Creates voice channel when user joins 'Create Voice Channel' voice channel and deletes created voice channels that have 0 users in them
 * @param {object} oldState
 * @param {object} newState
 */
exports.manageVoiceChannel = (oldState, newState) => {
    const newUserChannel = newState.channel;
    const oldUserChannel = oldState.channel;

    if (newUserChannel !== null && newUserChannel.id === CREATE_VOICE_CHANNEL_ID) {
        newState.guild.channels.create(newState.member.displayName + '\'s Channel', {
                type: 'voice',
                permissionOverwrites: [{
                    id: newState.id,
                    allow: ['MANAGE_CHANNELS', 'CONNECT'],
                },
            {
                id: MOD_ROLE_ID,
                allow: ['MANAGE_CHANNELS', 'CONNECT'],

            }],
                parent: CREATE_VOICE_CHANNEL_PARENT_ID,
            })
            .then((channel) => {
                if (oldUserChannel !== null && oldUserChannel.id !== CREATE_VOICE_CHANNEL_ID && oldUserChannel.members.size === 0 && oldUserChannel.parentID === CREATE_VOICE_CHANNEL_PARENT_ID) {
                    oldState.channel.delete();
                    voiceLogger.info(oldState, 'deleted a temporary voice channel.');
                }
                voiceLogger.info(newState, `created a temporary voice channel by [ ${newState.member.displayName} | ID: ${newState.id} ]`);
                newState.member.voice.setChannel(channel.id);
                voiceLogger.info(newState, `moved a user to their new voice channel by [ ${newState.member.displayName} | ID: ${newState.id} ]`);
            });
    }
    else if (oldUserChannel !== null && oldUserChannel.id !== CREATE_VOICE_CHANNEL_ID && oldUserChannel.parentID === CREATE_VOICE_CHANNEL_PARENT_ID && oldUserChannel.members.size === 0) {
        oldState.channel.delete();
        voiceLogger.info(oldState, 'deleted a temporary voice channel.');
    }
};

exports.lockChannel = (message) => {
    const member = message.guild.members.cache.get(message.author.id);
    if (member.voice.channel !== null && member.voice.channel.parentID === CREATE_VOICE_CHANNEL_PARENT_ID && member.voice.channel.permissionsFor(member).has('MANAGE_CHANNELS')) {
        member.voice.channel.createOverwrite(GUILD_ID, { CONNECT: false });
        voiceLogger.info(member, `locked their voice channel by [ ${member.displayName} | ID: ${member.id} ]`);
    }
};

exports.unlockChannel = (message) => {
    const member = message.guild.members.cache.get(message.author.id);
    if (member.voice.channel !== null && member.voice.channel.parentID === CREATE_VOICE_CHANNEL_PARENT_ID && member.voice.channel.permissionsFor(member).has('MANAGE_CHANNELS')) {
        member.voice.channel.createOverwrite(GUILD_ID, { CONNECT: true });
        voiceLogger.info(member, `unlocked their voice channel by [ ${member.displayName} | ID: ${member.id} ]`);
    }
};

exports.allowMember = (message, specifiedMember) => {
    const member = message.guild.members.cache.get(message.author.id);

    if (member.voice.channel !== null && member.voice.channel.parentID === CREATE_VOICE_CHANNEL_PARENT_ID && member.voice.channel.permissionsFor(member).has('MANAGE_CHANNELS')) {
        member.voice.channel.createOverwrite(specifiedMember, { CONNECT: true });
        voiceLogger.info(member, `allowed [${specifiedMember.displayName} | ID: ${specifiedMember.id}] to their voice channel by [ ${member.displayName} | ID: ${member.id} ]`);
    }
};

exports.disconnectMember = (message, specifiedMember) => {
    const member = message.guild.members.cache.get(message.author.id);

    if (member.voice.channel !== null && member.voice.channel.parentID === CREATE_VOICE_CHANNEL_PARENT_ID && member.voice.channel.permissionsFor(member).has('MANAGE_CHANNELS')) {
        member.voice.channel.createOverwrite(specifiedMember, { CONNECT: false });
        if (specifiedMember.voice.channel !== null && member.voice.channel.id === specifiedMember.voice.channel.id) {
            specifiedMember.voice.kick();
            voiceLogger.info(member, `kicked [${specifiedMember.displayName} | ID: ${specifiedMember.id}] from their voice channel by [ ${member.displayName} | ID: ${member.id} ]`);
        }
    }
};
