require('dotenv').config();
const logger = require('./util/logger.js');
const { readdirSync } = require('fs');
const { join } = require('path');
const AlecClient = require('./struct/Client');
const { Collection } = require('discord.js');
const client = new AlecClient({
    token: process.env.DISCORD_TOKEN,
    prefix: process.env.DISCORD_PREFIX,
});
const u = require('./util/utilities.js');
const { manageVoiceChannel } = require('./util/voice.js');
// const { MODERATOR_CHANNEL_ID, BOT_CHANNEL_ID } = require('./util/constants.js');
const { getAllGuildMembers, getLastSuggestionMessageOnRestart, persistWelcomeInfo, welcomeMessage, trackInvites, checkInviter } = require('./util/utilities.js');
const MuteData = require('./data/models/mutedata.js');
const MemberInfo = require('./struct/MembersInfo.js');
const MemberData = require('./data/models/memberdata.js');

const commandFiles = readdirSync(join(__dirname, 'commands')).filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(join(__dirname, 'commands', `${file}`));
    client.commands.set(command.name, command);
}

client.once('ready', () => {
    console.log(`${client.user.username} READY!`);
    getLastSuggestionMessageOnRestart(client);
    const guild = client.guilds.cache.first();
    getAllGuildMembers(guild);
    const mutedRole = guild.roles.cache.find(role => role.name === 'muted');
    guild.fetchInvites()
        .then(invites => client.guildInvites.set(guild.id, invites))
        .catch(err => console.log(err));
    client.setInterval(() => {
        MuteData.find().then(mutesDb => {
            mutesDb.forEach(mutes => {
                const member = guild.members.cache.get(mutes._id);
                if (Date.now() > mutes.time) {
                    member.roles.remove(mutedRole);
                    // eslint-disable-next-line max-nested-callbacks
                    MuteData.findByIdAndDelete(mutes._id).then(() => console.log('deleted database entry'));
                }
            });
        });
    }, 60000);
});

client.on('message', message => {
    u.persistSuggestions(message);
    if (!message.content.startsWith(client.config.prefix) || message.author.bot || message.channel.type === 'dm') return;
    const args = message.content.slice(client.config.prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName));
    if (!command) return;
    logger.info(message, message.content);
    if (command.args && !args.length) {
        message.delete();
        let reply = `You didn't provide the correct arguments, ${message.author}!`;
        if (command.usage) reply += `\nThe proper usage would be: \`${client.config.prefix}${command.name} ${command.usage}\``;
        return message.channel.send(reply);
    }
    if (!client.cooldowns.has(command.name)) {
        client.cooldowns.set(command.name, new Collection());
    }
    const now = Date.now();
    const timestamps = client.cooldowns.get(command.name);
    const cooldownAmount = (command.cooldown || 3) * 1000;
    if (timestamps.has(message.author.id)) {
        const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
        if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;
            message.delete();
            return message.reply(`please wait ${timeLeft.toFixed(1)} more second(s) before reusing the \`${client.config.prefix}${command.name}\` command.`);
        }
    }
    timestamps.set(message.author.id, now);
    setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

    try {
        command.execute(message, args);
    }
    catch (error) {
        console.error(error);
        message.reply('there was an error trying to execute that command!');
    }
});
client.on('guildMemberAdd', (member) => {
    MemberData.findById(member.id).lean().exec(function(err, foundMember) {
        if (err) console.log(err);
        if (!foundMember) {
            const newMemberData = new MemberData({
                _id: member.id,
                userId: member.id,
                name: member.displayName,
                warnings: 0,
                warningreasons: [],
                mutecount: 0,
                mutehistory: ['\u200B'],
                steamid: '',
                cash: 0,
                level: 0,
                experience: 0,
                serverinvites: [],
                serverinvitesProspect: [],
                serverinvitesMember: [],
                inviter: '',
            });
            newMemberData.save()
                .then(newMember => Object.assign(client.memberinfo, { [member.id]: new MemberInfo(newMember._doc) }))
                .catch(err => console.log(err));
        }
        else {
            Object.assign(client.memberinfo, { [member.id]: new MemberInfo(foundMember) });
        }
    });
    welcomeMessage(member);
    persistWelcomeInfo(client);
    trackInvites(member, client);
});
client.on('guildMemberUpdate', (oldMember, newMember) => {
    checkInviter(oldMember, newMember);

});
client.on('inviteCreate', async (invite) => {
    client.guildInvites.set(invite.guild.id, await invite.guild.fetchInvites());
    console.log('invite created:' + invite);
});
client.on('error', (error) => {
    console.error(error);

});
client.on('disconnect', (error) => {
    console.error(error);
    client.login(client.config.token);
});

client.on('voiceStateUpdate', (oldState, newState) => {
    manageVoiceChannel(oldState, newState);
});

client.on('unhandledRejection', error => console.error('Uncaught Promise Rejection', error));
client.login(client.config.token);