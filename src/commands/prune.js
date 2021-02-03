const {
    MOD_ROLE_ID,
} = require('../util/constants.js');
module.exports = {
    name: 'prune',
    description: '(ADMIN ONLY) Prune up to 99 messages.',
    args: true,
    usage: '[number]',
    modOnly: true,
    cooldown: 5,
    execute(message, args) {
        message.delete();
        if (message.member.roles.highest.comparePositionTo(message.guild.roles.cache.find(role => role.id === MOD_ROLE_ID)) < 0) return message.reply('You are not authorized to use this command.');
        const amount = parseInt(args[0]) + 1;

        if (isNaN(amount)) {
            return message.reply('that doesn\'t seem to be a valid number.');
        }
        else if (amount <= 1 || amount > 100) {
            return message.reply('you need to input a number between 1 and 99.');
        }

        message.channel.bulkDelete(amount, true).catch(err => {
            console.error(err);
            message.channel.send('there was an error trying to prune messages in this channel!');
        });
    },
};