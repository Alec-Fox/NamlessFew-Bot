const reactionMessage = require('./reaction-message.js');
const { ROLE_SELECTION_CHANNEL_ID, BOT_USER_ID } = require('./constants.js');

module.exports = (client, emojis, emojiText) => {
    const getEmoji = emojiName => client.emojis.cache.find(emoji => emoji.name === emojiName);
    const reactions = [];
    for (const key in emojis) {
        const emoji = getEmoji(key);
        reactions.push(emoji);

        const role = emojis[key];
        emojiText += `${emoji} : ${role}\n`;
    }
    reactionMessage(client, ROLE_SELECTION_CHANNEL_ID, emojiText, reactions);

    const handleReaction = (reaction, user, add) => {
        if (user.id === BOT_USER_ID) return;

        const emoji = reaction._emoji.name;
        const { guild } = reaction.message;
        const roleName = emojis[emoji];
        if (!roleName) return;
        const role = guild.roles.cache.find(memberRole => memberRole.name === roleName);
        const member = guild.members.cache.find(guildMember => guildMember.id === user.id);

        if(add) {
            member.roles.add(role);
        }
        else {
            member.roles.remove(role);
        }
    };

    client.on('messageReactionAdd', (reaction, user) => {
        if (reaction.message.channel.id === ROLE_SELECTION_CHANNEL_ID) {
            handleReaction(reaction, user, true);
        }
    });

    client.on('messageReactionRemove', (reaction, user) => {
        if (reaction.message.channel.id === ROLE_SELECTION_CHANNEL_ID) {
            handleReaction(reaction, user, false);
        }
    });

};