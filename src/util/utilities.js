const {
    MessageEmbed,
} = require('discord.js');
const {
    SUGGESTIONS_CHANNEL_ID,
    WELCOME_CHANNEL_ID,
    ROLE_SELECTION_CHANNEL_ID,
    MEMBER_ROLE_ID,
    PROSPECT_ROLE_ID,
} = require('./constants.js');
const MemberInfo = require('../struct/MembersInfo.js');

const mongoose = require('mongoose');
const MemberData = require('../data/models/memberdata.js');
const SuggestionData = require('../data/models/suggestionsdata.js');

/**
 * Returns an embed object.
 *
 * @param {string} title - Title for the embed.
 * @param {string} description - Description for the embed.
 * @param {string} image - image URL for the embed.
 * @param {Array} fields - Array of objects for the embed fields.
 */
exports.constructEmbed = (title, description, image, fields, thumbnail) => {
    const embed = new MessageEmbed()
        .setColor(3021383)
        .setTitle(title)
        .setDescription(description)
        .setImage(image)
        .setThumbnail(thumbnail);

    if (fields) {
        for (let i = 0; i < fields.length; i++) {
            embed.addField(fields[i].name, fields[i].value, fields[i].inline);
        }
    }
    return embed;

};

/** API request options for Dungeon Top 10
 *
 * @param {array} steamIds - Steam Id3s of players
 */
exports.steamLookup = steamIds => {
    return {
        uri: `http://kobe42.pythonanywhere.com/steam/profile?steamId=${steamIds}`,
        headers: {
            'User-Agent': 'Request-Promise',
        },
        json: true,
    };
};

/**
 * Returns a random number between min and max.
 *
 * @param {number} min - min range for random number (inclusive)
 * @param {number} max - max range of random number (exclusive)
 */
exports.getRand = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor((Math.random() * max) + min);
};

/**
 * Returns a userID depending if there was a mentioned member or not
 *
 * @param {object} message - Discord message.
 * @param {object} specifiedMember - Discord mentioned member.
 */
exports.decideUser = (message, specifiedMember) => {
    const userID = (specifiedMember) ? specifiedMember.id : message.author.id;
    return userID;
};

const allCompleteCallback = () => {
    console.log('MemberInfo Class builds complete');
};
let classesCreated = 0;

exports.getAllGuildMembers = async (guild) => {
    mongoose.connect(`mongodb+srv://alec_fox:${process.env.MONOGOBD_PW}@cluster0-q40w5.mongodb.net/NameslessFew?retryWrites=true&w=majority`, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false }).then(()=> console.log('Connected to MongoDB.')).catch(err => console.log(err));
    const allMembers = await guild.members.fetch();
    function generateAllMembersInfo(member, memberId, allMembersInfoMap) {
        MemberData.findById(memberId).lean().exec(function(err, foundMember) {
            if(err) console.log(err);
            if(!foundMember) {
                const newMemberData = new MemberData({
                    _id: memberId,
                    userId: memberId,
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
                    inviter : '',
                });
                newMemberData.save()
                .then(newMember => Object.assign(guild.client.memberinfo, { [memberId]: new MemberInfo(newMember._doc) }))
                    .catch(err => console.log(err));
            }
            else {
                Object.assign(guild.client.memberinfo, { [memberId]: new MemberInfo(foundMember) });
            }
        });
        classesCreated++;
        if (classesCreated === allMembersInfoMap.size) {
            allCompleteCallback();
        }
    }
    const allMembersInfoMap = allMembers;
    console.log(`Building ${allMembersInfoMap.size} MemberInfo classes`);
    allMembersInfoMap.forEach(generateAllMembersInfo);
};

exports.getLastSuggestionMessageOnRestart = async (client) => {
    SuggestionData.findById('suggestionMessage').lean().exec(function(err, suggestionMessage) {
        if(err) console.log(err);
        client.channels.cache.get(SUGGESTIONS_CHANNEL_ID).messages.fetch(suggestionMessage.messageId).then(lastSuggestionMessage => client.info.last_suggestion_message = lastSuggestionMessage);
    });
    SuggestionData.findById('welcomeInfoMessage').lean().exec(function(err, welcomeMessage) {
        if(err) console.log(err);
        if(!client.channels.cache.get(WELCOME_CHANNEL_ID).messages.fetch(welcomeMessage.messageId)) return;
        client.channels.cache.get(WELCOME_CHANNEL_ID).messages.fetch(welcomeMessage.messageId).then(lastWelcomeMessage => client.info.last_welcome_message_info = lastWelcomeMessage);
    });
};

exports.persistSuggestions = (message) => {
    if (message.channel.id !== SUGGESTIONS_CHANNEL_ID || message.author.bot) return;
    message.react('👍')
        .then(() => message.react('👎'))
        .then(() => message.react('❌'))
        .catch(() => console.error('One of the emojis failed to react.'));
    if (message.client.info.last_suggestion_message !== '') {
        try {
            message.client.info.last_suggestion_message.delete();
        }
        catch (error) {
            console.log(error);
        }
    }
    const embed = this.constructEmbed('Read pinned messages for instructions on how to post in the suggestions channel', '');
    message.channel.send(embed)
        .then((msg) => {
            message.client.info.last_suggestion_message = msg;
            SuggestionData.findByIdAndUpdate('suggestionMessage', { messageId: msg.id }, { upsert : true }).then(()=> console.log('added suggestion ID to database'));
        })
        .catch(error => {
            console.log(error);
        });
};

exports.persistWelcomeInfo = (client) => {
    if (client.info.last_welcome_message_info !== '') {
        try {
            client.info.last_welcome_message_info.delete();
        }
        catch (error) {
            console.log(error);
        }
    }
    const embed = this.constructEmbed('', `To learn more about us and our server, go to #about-us
    \nTo learn about the rules we expect you to follow, go to #rulebook 
    \nTo assign yourself some roles, go to <#${client.channels.cache.find(channel => channel.id === ROLE_SELECTION_CHANNEL_ID).id}> 
    \nTo learn about our economy, go to #economy-help 
    \nTo learn about the bots and commands, go to #commands-help
    \nIf you have any other questions, you're more than welcome to ask any Member or Committee Member. Have fun and happy gaming!`);
    const welcomeChannel = client.channels.cache.find(channel => channel.id === WELCOME_CHANNEL_ID);
    welcomeChannel.send(embed).then((msg) => {
        client.info.last_welcome_message_info = msg;
        SuggestionData.findByIdAndUpdate('welcomeInfoMessage', { messageId: msg.id }, { upsert : true }).then(()=> console.log('added welcomeInfoMessage ID to database'));
    })
    .catch(error => {
        console.log(error);
    });
};

exports.welcomeMessage = (member) => {
    const welcomeChannel = member.guild.channels.cache.find(channel => channel.id === WELCOME_CHANNEL_ID);
    const embed = this.constructEmbed(`${member.displayName} welcome to the Nameless Few.`, `#${member.guild.memberCount}`);
    embed.setThumbnail(`${member.user.displayAvatarURL()}`);
    welcomeChannel.send(embed);

};
exports.passiveIncome = () => {
    // passive income
};
exports.checkInviter = (oldmember, newmember) => {
    if(!newmember.client.memberinfo[newmember.id]) return;
    const inviter = newmember.client.memberinfo[newmember.id].inviter;
    if (inviter === '') return;
    if (newmember.roles.cache.has(MEMBER_ROLE_ID) && !oldmember.roles.cache.has(MEMBER_ROLE_ID)) {
        newmember.client.memberinfo[inviter].addInviteMember(newmember, newmember.id);
    }
    if (newmember.roles.cache.has(PROSPECT_ROLE_ID) && !oldmember.roles.cache.has(PROSPECT_ROLE_ID)) {
        newmember.client.memberinfo[inviter].addInviteProspect(newmember, newmember.id);
    }

};
exports.trackInvites = async (member, client) => {
    const cachedInvites = client.guildInvites.get(member.guild.id);
    const newInvites = await member.guild.fetchInvites();
    member.client.guildInvites.set(member.guild.id, newInvites);
    try {
        const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code).uses < inv.uses);
        console.log(`used invite: ${usedInvite}`);
        member.client.memberinfo[usedInvite.inviter.id].addInvite(member, member.id);
    }
    catch(err) {
        console.log(err);
    }
};