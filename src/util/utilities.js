const {
    MessageEmbed,
    MessageAttachment,
} = require('discord.js');
const {
    SUGGESTIONS_CHANNEL_ID,
    WELCOME_CHANNEL_ID,
    ROLE_SELECTION_CHANNEL_ID,
    MEMBER_ROLE_ID,
    PROSPECT_ROLE_ID,
    COMMITTEE_ROLE_ID,
    FOLLOWER_ROLE_ID,
    SUBSCRIBER_ROLE_ID,
    HANGAROUND_ROLE_ID,
    STAFF_ROLE_ID,
    COMMITTEE_ROLE_COLOR,
	STAFF_ROLE_COLOR,
	MEMBER_ROLE_COLOR,
	PROSPECT_ROLE_COLOR,
    HANGAROUND_ROLE_COLOR,
    WELCOME_TEMPLATE_PNG,
    INACTIVE_ROLE_ID,
    BOT_CHANNEL_ID,
    HIERARCHY_CHANNEL_ID,
    RULEBOOK_CHANNEL_ID,
    ROLELIST_CHANNEL_ID,
    ECONOMY_INFO_CHANNEL_ID,
    COMMAND_HELP_CHANNEL_ID,
} = require('./constants.js');
const MemberInfo = require('../struct/MembersInfo.js');
const mongoose = require('mongoose');
const Canvas = require('canvas');
const MemberData = require('../data/models/memberdata.js');
const SuggestionData = require('../data/models/suggestionsdata.js');
const ActiveUsersData = require('../data/models/activeuserdata.js');
const cron = require('node-cron');
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

exports.constructBlackjackEmbed = function(client, title, description, userID, image, thumbnail) {
    const botChannel = client.channels.cache.find(channel => channel.id === BOT_CHANNEL_ID);
	// these are all optional parameters
	title = title || '';
	description = description || '';
	image = image || '';
	const picType = thumbnail ? 'thumbnail' : 'image';
	const color = '0xffff00';
	const message = {
		color: color,
		title: title,
		description: description,
	};
	message[picType] = { url: image };
	botChannel.send(new MessageEmbed(message));
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
                    gambling: { 'winstreak': 0, 'losestreak': 0, 'totalwins': 0, 'totalloses': 0, 'totalwinnings': 0, 'totallosings':0, 'highestwinstreak': 0, 'highestlosestreak': 0 },
                    blackjack: { 'message': [], 'gameStarted': false, 'gameOver': true, 'bjBet': 0, 'player': { 'acesCount': 0, 'aces': 0, 'points': 0, 'hand':{} }, 'dealer': { 'acesCount': 0, 'aces': 0, 'points':0, 'hand':{} } },
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
    /**
    if (message.client.info.last_suggestion_message !== '') {
        try {
            message.client.info.last_suggestion_message.delete().catch(error => {console.error('Failed to delete the message:', error);});
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
    */
};

exports.persistWelcomeInfo = (client) => {
    if (client.info.last_welcome_message_info !== '') {
        try {
            client.info.last_welcome_message_info.delete().catch(error => {console.error('Failed to delete the message:', error);});
        }
        catch (error) {
            console.log(error);
        }
    }
    const embed = this.constructEmbed('', `To learn more about us and our server, go to <#${client.channels.cache.find(channel => channel.id === HIERARCHY_CHANNEL_ID).id}> 
    \nTo learn about the rules we expect you to follow, go to <#${client.channels.cache.find(channel => channel.id === RULEBOOK_CHANNEL_ID).id}>
    \nTo learn about the roles we offer, go to <#${client.channels.cache.find(channel => channel.id === ROLELIST_CHANNEL_ID).id}> 
    \nTo assign yourself some roles, go to <#${client.channels.cache.find(channel => channel.id === ROLE_SELECTION_CHANNEL_ID).id}> 
    \nTo learn about our economy, go to <#${client.channels.cache.find(channel => channel.id === ECONOMY_INFO_CHANNEL_ID).id}>
    \nTo learn about the bots and commands, go to <#${client.channels.cache.find(channel => channel.id === COMMAND_HELP_CHANNEL_ID).id}>
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

exports.welcomeMessage = async (member) => {
    const welcomeChannel = member.guild.channels.cache.find(channel => channel.id === WELCOME_CHANNEL_ID);
    const now = new Date();
    const applyText = (canvas, size) => {
        const ctx = canvas.getContext('2d');
        ctx.textAlign = 'center';
        ctx.font = `${size}px sans-serif, Cambria Math`;
        return ctx.font;
    };
    const applyNameText = (canvas, text) => {
        const textInfo = {};
        const ctx = canvas.getContext('2d');
        let fontSize = 75;
        ctx.textAlign = 'center';
        ctx.font = `${fontSize}px sans-serif, Cambria Math`;
        do {
            ctx.font = `${fontSize -= 1}px sans-serif, Cambria Math`;
        } while (ctx.measureText(text).width > 1000);
        textInfo.font = ctx.font;
        textInfo.width = ctx.measureText(text).width;

        return textInfo;
    };
    const canvas = Canvas.createCanvas(1100, 500);
    const ctx = canvas.getContext('2d');
    ctx.save();
    const background = await Canvas.loadImage(WELCOME_TEMPLATE_PNG);
    ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(550, 370, 110, 0, 2 * Math.PI, false);
    ctx.clip();
    const userImage = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'png' }));
    ctx.drawImage(userImage, 438, 257, 224, 224);
    ctx.restore();
    const userName = member.user.tag.toString();
    const textInfo = applyNameText(canvas, `${userName} just joined the Nameless Few!`);
    ctx.font = textInfo.font;
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${userName} joined the Nameless Few!`, canvas.width / 2, 240);
    ctx.font = applyText(canvas, 25);
    ctx.textAlign = 'right';
    ctx.fillText(`Discord Member # ${member.guild.memberCount}`, 1080, 485);
    ctx.font = applyText(canvas, 25);
    ctx.textAlign = 'left';
    ctx.fillText(`Joined: ${now.toLocaleString()}`, 20, 485);
    const attachment = new MessageAttachment(canvas.toBuffer(), 'ranksImage.png');
    welcomeChannel.send(attachment);

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

exports.WeeklyRolePayOut = (member, roleId) => {
    switch (roleId) {
        case COMMITTEE_ROLE_ID: {
            member.client.memberinfo[member.id].addRoleIncome(200, 'Weekly Committee Income', member);
        }
        break;
        case STAFF_ROLE_ID: {
            member.client.memberinfo[member.id].addRoleIncome(50, 'Weekly Staff Income', member);
        }
        break;
        case MEMBER_ROLE_ID: {
            member.client.memberinfo[member.id].addRoleIncome(100, 'Weekly Member Income', member);
        }
        break;
        case PROSPECT_ROLE_ID: {
            member.client.memberinfo[member.id].addRoleIncome(50, 'Weekly Prospect Income', member);
        }
        break;
        case HANGAROUND_ROLE_ID: {
            member.client.memberinfo[member.id].addRoleIncome(30, 'Weekly Hangaround Income', member);
        }
        break;
    }
};

exports.DailyRolePayOut = (member, roleId) => {
    switch (roleId) {
        case FOLLOWER_ROLE_ID: {
            member.client.memberinfo[member.id].addRoleIncome(2, 'Daily Follower Income', member);
        }
        break;
        case SUBSCRIBER_ROLE_ID: {
            member.client.memberinfo[member.id].addRoleIncome(8, 'Daily Subscriber Income', member);
        }
        break;
    }
};

exports.startCron = (guild) => {
    cron.schedule('00 12 * * *', () => {
        guild.members.cache.forEach(member => member.roles.cache.forEach(role => this.DailyRolePayOut(member, role.id)));
    }, {
        scheduled: true,
        timezone: 'America/New_York',
    });
    cron.schedule('00 12 * * 5', () => {
        guild.members.cache.forEach(member => member.roles.cache.forEach(role => this.WeeklyRolePayOut(member, role.id)));
    }, {
        scheduled: true,
        timezone: 'America/New_York',
    });
    cron.schedule('0 12 1,14 * *', () => {
        this.addInactiveRole(guild);
    }, {
        scheduled: true,
        timezone: 'America/New_York',
    });
};

exports.addInactiveRole = (guild) => {
    guild.members.cache.forEach(member => {
        if (!guild.client.activeUsersMap.has(member.id)) {
            member.roles.add(INACTIVE_ROLE_ID);
        }
    });
    guild.client.activeUsersMap.clear();
    ActiveUsersData.findByIdAndUpdate(guild.id, { activeUsersMap: guild.client.activeUsersMap }).then(()=>console.log('cleared database activeUsersMap'));
};

exports.checkCash = (message, amount) => {
    if (message.client.memberinfo[message.member.id].cash < amount) return false;
    else return true;
};

exports.returnTopRoleHierarchyColor = (member) => {
    if (member.roles.cache.has(COMMITTEE_ROLE_ID)) return COMMITTEE_ROLE_COLOR;
    if (member.roles.cache.has(STAFF_ROLE_ID)) return STAFF_ROLE_COLOR;
    if (member.roles.cache.has(MEMBER_ROLE_ID)) return MEMBER_ROLE_COLOR;
    if (member.roles.cache.has(PROSPECT_ROLE_ID)) return PROSPECT_ROLE_COLOR;
    return HANGAROUND_ROLE_COLOR;
};