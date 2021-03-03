const {
    MessageEmbed,
    MessageAttachment,
} = require('discord.js');
const Canvas = require('canvas');
const _ = require('lodash');
const {
    ECONOMY_LOGGER_CHANNEL_ID,
    BOT_CHANNEL_ID,
    PROSPECT_ROLE_ID,
    COMMITTEE_ROLE_ID,
    STAFF_ROLE_ID,
    COMMITTEE_ROLE_COLOR,
	STAFF_ROLE_COLOR,
	MEMBER_ROLE_COLOR,
	PROSPECT_ROLE_COLOR,
    HANGAROUND_ROLE_COLOR,
    MEMBER_ROLE_ID,
    LEVEL_TEMPLATE_PNG,
    BANK_TEMPLATE_PNG,
    NF_COIN_PNG,
    HANGAROUND_ROLE_BADGE_PNG,
    PROSPECT_ROLE_BADGE_PNG,
    MEMBER_ROLE_BADGE_PNG,
    STAFF_ROLE_BADGE_PNG,
    COMMITTEE_ROLE_BADGE_PNG,
} = require('../util/constants.js');
const { calculateRequiredXpTable, calculateLeaderBoards } = require('../util/levelsystem.js');
const ms = require('ms');
const MemberData = require('../data/models/memberdata.js');
const MuteData = require('../data/models/mutedata.js');
module.exports = class MemberInfo {
    constructor(data) {
        Object.keys(data).forEach(key => this[key] = data[key]);
    }
    constructEmbed(title, description, image, fields, thumbnail) {
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
    }
    async displayLevel(message, member) {
        let xpBarColor = HANGAROUND_ROLE_COLOR;
        let roleBadge = HANGAROUND_ROLE_BADGE_PNG;
        switch(this.returnTopRoleHierarchyColor(member)) {
            case 'committee':
                xpBarColor = COMMITTEE_ROLE_COLOR;
                roleBadge = COMMITTEE_ROLE_BADGE_PNG;
            break;
            case 'staff':
                xpBarColor = STAFF_ROLE_COLOR;
                roleBadge = STAFF_ROLE_BADGE_PNG;
            break;
            case 'member':
                xpBarColor = MEMBER_ROLE_COLOR;
                roleBadge = MEMBER_ROLE_BADGE_PNG;
            break;
            case 'prospect':
                xpBarColor = PROSPECT_ROLE_COLOR;
                roleBadge = PROSPECT_ROLE_BADGE_PNG;
            break;
        }
        const xpTable = calculateRequiredXpTable();
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
            } while (ctx.measureText(text).width > 700);
            textInfo.font = ctx.font;
            textInfo.width = ctx.measureText(text).width;

            return textInfo;
        };
        const canvas = Canvas.createCanvas(1000, 300);
        const ctx = canvas.getContext('2d');
        ctx.save();
        const background = await Canvas.loadImage(LEVEL_TEMPLATE_PNG);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        const roleImage = await Canvas.loadImage(roleBadge);
        ctx.drawImage(roleImage, 745, 125, 200, 50);
        ctx.beginPath();
        ctx.arc(128, 147, 123, 0, 2 * Math.PI, false);
        ctx.clip();
        const userImage = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'png' }));
        ctx.drawImage(userImage, 1, 20, 254, 254);
        ctx.restore();
        ctx.strokeStyle = '#74037b';
        const userName = member.displayName.toString();
        const textInfo = applyNameText(canvas, `${userName}`);
        ctx.font = textInfo.font;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${userName}`, canvas.width / 2 + 100, 105);
        ctx.font = applyText(canvas, 40);
        ctx.fillText('Level:', 550, 170);
        ctx.font = applyText(canvas, 50);
        ctx.textAlign = 'left';
        ctx.fillText(`${this.level}`, 630, 170);
        const requiredXp = xpTable[this.level + 1];
        const leaderBoards = calculateLeaderBoards(message.client);
        const myRank = _.findIndex(leaderBoards, function(el) { return el.includes(member.displayName);}) + 1;
        ctx.font = applyText(canvas, 40);
        ctx.fillText('Rank:', 310, 170);
        ctx.textAlign = 'left';
        ctx.font = applyText(canvas, 50);
        ctx.fillText(`#${myRank}`, 415, 170);
        ctx.beginPath();
        ctx.moveTo(260, 208);
        ctx.lineTo(940, 208);
        ctx.lineWidth = 65;
        ctx.strokeStyle = 'rgba(255, 255, 255, .40)';
        ctx.stroke();
        ctx.restore();
        ctx.beginPath();
        ctx.moveTo(260, 208);
        const xpPercent = this.experience / requiredXp;
        const xpBarDistance = 680 * xpPercent;
        ctx.lineTo(260 + xpBarDistance, 208);
        ctx.strokeStyle = xpBarColor;
        ctx.stroke();
        ctx.font = applyText(canvas, 30);
        ctx.textAlign = 'right';
        ctx.fillText(`${this.experience} / ${requiredXp} XP`, canvas.width - 70, 220);
        const attachment = new MessageAttachment(canvas.toBuffer(), 'ranksImage.png');
        message.channel.send(attachment);
    }
    addRoleIncome(amount, type, member) {
        this.cash += amount;
        this.moneyledger.push([type, amount]);
        MemberData.findByIdAndUpdate(this._id, { cash: this.cash }).then(()=> this.updateEconomyLog(member, member.displayName, amount, type, '+'));
        MemberData.findByIdAndUpdate(this._id, { moneyledger: this.moneyledger }).then(()=>console.log('updated ledger'));
    }
    addInvite(member, memberId) {
        if(!this.serverinvites.includes(memberId)) {
            this.serverinvites.push(memberId);
            member.client.memberinfo[memberId].inviter = this._id;
            MemberData.findByIdAndUpdate(this._id, { serverinvites: this.serverinvites }).then(() => console.log(`added ${memberId} to ${this._id}'s invite count`));
            MemberData.findByIdAndUpdate(memberId, { inviter: this._id }).then(() => console.log(`added ${this._id} to ${memberId}'s as inviter`));
            const thisMember = member.guild.members.cache.find(memberfound => memberfound.id === this._id);
            this.addCash(thisMember, 10, `Reward for inviting ${member.displayName} to the server`);
        }
    }
    addInviteProspect(member, memberId) {
        if(!this.serverinvitesProspect.includes(memberId)) {
            this.serverinvitesProspect.push(memberId);
            MemberData.findByIdAndUpdate(this._id, { serverinvitesProspect: this.serverinvitesProspect }).then(() => console.log(`added ${memberId} to ${this._id}'s inviteProspect count`));
            const thisMember = member.guild.members.cache.find(memberfound => memberfound.id === this._id);
            this.addCash(thisMember, 25, `Reward for inviting ${member.displayName} as a prospect`);
        }
    }
    addInviteMember(member, memberId) {
        if(!this.serverinvitesMember.includes(memberId)) {
            this.serverinvitesMember.push(memberId);
            MemberData.findByIdAndUpdate(this._id, { serverinvitesMember: this.serverinvitesMember }).then(() => console.log(`added ${memberId} to ${this._id}'s inviteMember count`));
            const thisMember = member.guild.members.cache.find(memberfound => memberfound.id === this._id);
            this.addCash(thisMember, 50, `Reward for inviting ${member.displayName} as a member`);
        }
    }
    setLevel(member, amount) {
        this.level = amount;
        MemberData.findByIdAndUpdate(this._id, { level: this.level }).then(() => console.log(`Set ${member.displayName} to ${this.level}`));
    }
    addExperience(message, amount) {
        this.experience += amount;
        MemberData.findByIdAndUpdate(this._id, { experience: this.experience }).then(()=> this.checkLevel(message));
    }
    checkLevel(message) {
        const xpTable = calculateRequiredXpTable();
        if(this.experience >= xpTable[this.level + 1]) {
            this.level++;
            this.experience = 0;
            MemberData.findByIdAndUpdate(this._id, { level: this.level }).then(() => console.log(`${message.member.displayName} leveled to ${this.level}`));
            MemberData.findByIdAndUpdate(this._id, { experience: this.experience }).then(() => console.log('reset xp'));
            const BotCommandsChannel = message.guild.channels.cache.find(channel => channel.id === BOT_CHANNEL_ID);
            const coinEmoji = message.client.emojis.cache.find(emoji => emoji.name === 'Coin');
            const embed = this.constructEmbed(`${message.member.displayName}, you are now level ${this.level}!`, `Congrats! Here is a reward: ${this.level}${coinEmoji}`, null);
            this.addCash(message.member, this.level, `Reward for leveling to ${this.level}`);
            return BotCommandsChannel.send(embed);
        }
    }
    updateEconomyLog(member, memberName, amount, reason, incrementType) {
        const coinEmoji = member.client.emojis.cache.find(emoji => emoji.name === 'Coin');
        const EconomyLogChannel = member.guild.channels.cache.find(channel => channel.id === ECONOMY_LOGGER_CHANNEL_ID);
        const embed = this.constructEmbed(`${memberName}'s bank adjustment: ${incrementType}${amount}${coinEmoji}`, `Reason: ${reason}`);
        embed.setTimestamp();
        return EconomyLogChannel.send(embed);
    }
    async bank(message, member) {
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
            ctx.textAlign = 'left';
            ctx.font = `${fontSize}px sans-serif, Cambria Math`;
            do {
                ctx.font = `${fontSize -= 1}px sans-serif, Cambria Math`;
            } while (ctx.measureText(text).width > 500);
                textInfo.font = ctx.font;
                textInfo.width = ctx.measureText(text).width;
            return textInfo;
        };
        const canvas = Canvas.createCanvas(1100, 1000);
        const ctx = canvas.getContext('2d');
        ctx.save();
        const background = await Canvas.loadImage(BANK_TEMPLATE_PNG);
        ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, .50)';
        ctx.fillRect(10, 160, 1080, 135);
        ctx.beginPath();
        ctx.arc(105, 229, 65, 0, 2 * Math.PI, false);
        ctx.clip();
        const userImage = await Canvas.loadImage(member.user.displayAvatarURL({ format: 'png' }));
        ctx.drawImage(userImage, 40, 163, 130, 130);
        ctx.restore();
        const userName = member.displayName.toString();
        const textInfo = applyNameText(canvas, `${userName}`);
        ctx.font = textInfo.font;
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`${userName}`, 200, 250);
        ctx.font = applyText(canvas, 25);
        ctx.fillText('Transaction Log', canvas.width / 2, 290);
        ctx.font = applyText(canvas, 25);
        ctx.fillText('Here are your last 10 transactions', canvas.width / 2, 335);
        let yInterval = 0;
        const coin = await Canvas.loadImage(NF_COIN_PNG);
        for (let i = 0; i < 10; i++) {
            if (this.moneyledger[this.moneyledger.length - i - 1] === undefined) break;
            ctx.fillStyle = 'rgba(255, 255, 255, .35)';
            ctx.fillRect(100, 360 + yInterval, 900, 50);
            ctx.font = applyText(canvas, 20);
            ctx.textAlign = 'left';
            ctx.fillStyle = '#ffffff';
            const removedCoinString = _.replace(this.moneyledger[this.moneyledger.length - i - 1][0], '<:Coin:816175994708295690>', '');
            ctx.fillText(`${removedCoinString}`, 110, 390 + yInterval);
            ctx.textAlign = 'right';
            if (this.moneyledger[this.moneyledger.length - i - 1][1] > 0) ctx.fillStyle = '#59ff00';
            else ctx.fillStyle = '#ff0000';
            ctx.fillText(`${this.moneyledger[this.moneyledger.length - i - 1][1]}`, 965, 390 + yInterval);
            ctx.drawImage(coin, 971, 372 + yInterval, 24, 24);
            yInterval += 60;
        }
        ctx.font = applyText(canvas, 40);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'right';
        ctx.fillText(`Balance: ${this.cash}`, 1050, 250);
        ctx.drawImage(coin, 1053, 220, 32, 32);
        const attachment = new MessageAttachment(canvas.toBuffer(), 'ranksImage.png');
        return message.channel.send(attachment);
    }
    addCash(member, amount, reason) {
        const coinEmoji = member.client.emojis.cache.find(emoji => emoji.name === 'Coin');
        const BotCommandsChannel = member.guild.channels.cache.find(channel => channel.id === BOT_CHANNEL_ID);
        this.cash += amount;
        this.moneyledger.push([reason, amount]);
        MemberData.findByIdAndUpdate(this._id, { cash: this.cash }).then(()=> this.updateEconomyLog(member, member.displayName, amount, reason, '+'));
        MemberData.findByIdAndUpdate(this._id, { moneyledger: this.moneyledger }).then(()=>console.log('updated ledger'));
        const embed = this.constructEmbed(`${member.displayName}, ${amount}${coinEmoji} was added to your bank`, `Reason: ${reason}. \nYour total balance is now ${this.cash}${coinEmoji}`, null, null);
        return BotCommandsChannel.send(embed);
    }
    removeCash(member, amount, reason) {
        this.cash -= amount;
        this.moneyledger.push([reason, -amount]);
        MemberData.findByIdAndUpdate(this._id, { cash: this.cash }).then(()=> this.updateEconomyLog(member, member.displayName, amount, reason, '-'));
        MemberData.findByIdAndUpdate(this._id, { moneyledger: this.moneyledger }).then(()=>console.log('updated ledger'));
    }
    setSteamId(message, args) {
        this.steamid = args[0];
        const embed = this.constructEmbed(`${message.member.displayName}, your steam ID has been set: ${args[0]}`, '', null, null);
        MemberData.findByIdAndUpdate(this._id, { steamid: args[0] });
        return message.channel.send(embed);
    }
    giveWarning(message, reason, specifiedMember) {
        this.warnings++;
        this.warningreasons = this.warningreasons.concat(`${message.member.displayName} issued a WARNING:\n*${reason}*  (${new Date().toLocaleString()})`);
        const embed = this.constructEmbed(`${specifiedMember.displayName}, you received a warning.`, `Reason: ${reason}`, null, null);
        MemberData.findByIdAndUpdate(this._id, { warningreasons: this.warningreasons, warnings: this.warnings }).then(()=> console.log(`issued warning to ${specifiedMember.displayName}`));
        return message.channel.send(embed);
    }
    displayWarnings(message, member) {
        let reasons = '';
        let n = 1;
        this.warningreasons.forEach(function(reason) {
            reasons += `**[${n++}]** ${reason}\n`;
        });
        const embedFields = [];
        embedFields.push({
            name: 'Times muted:',
            value: `${this.mutecount}`,
            img: null,
            inline: false,
        });
        let muteHistoryDisplay = this.mutehistory.toString();
        muteHistoryDisplay = muteHistoryDisplay.replace(/,/g, '\n');
        embedFields.push({
            name: 'Mute History:',
            value: `${muteHistoryDisplay}`,
            img: null,
            inline: false,
        });
        const embed = this.constructEmbed(`${member.displayName}'s Warnings (${this.warnings}):`, reasons, null, embedFields, member.user.displayAvatarURL());
        embed.setFooter(`Discord ID: ${this._id} | Steam ID: ${this.steamid}`);
        embed.setTimestamp(message.createdAt);
        return message.channel.send(embed);

    }
    returnTopRoleHierarchyColor(member) {
        if (member.roles.cache.has(COMMITTEE_ROLE_ID)) return 'committee';
        if (member.roles.cache.has(STAFF_ROLE_ID)) return 'staff';
        if (member.roles.cache.has(MEMBER_ROLE_ID)) return 'member';
        if (member.roles.cache.has(PROSPECT_ROLE_ID)) return 'prospect';
        return 'hangaround';
    }
    gamblingStats(outcome, amount) {
        switch(outcome) {
            case 'won' :
                this.gambling.losestreak = 0;
                this.gambling.winstreak++;
                this.gambling.totalwins++;
                this.gambling.totalwinnings += amount;
                if (this.gambling.winstreak > this.gambling.highestwinstreak) this.gambling.highestwinstreak = this.gambling.winstreak;
                MemberData.findByIdAndUpdate(this._id, { gambling: this.gambling }).then(()=>console.log('updated gambling stats'));
            break;
            case 'lost' :
                this.gambling.winstreak = 0;
                this.gambling.losestreak++;
                this.gambling.totalloses++;
                this.gambling.totallosings += amount;
                if (this.gambling.losestreak > this.gambling.highestlosestreak) this.gambling.highestlosestreak = this.gambling.losestreak;
                MemberData.findByIdAndUpdate(this._id, { gambling: this.gambling }).then(()=>console.log('updated gambling stats'));
        }
    }
    displayGamblingStats(message, member) {
        const coinEmoji = message.client.emojis.cache.find(emoji => emoji.name === 'Coin');
        const embed = this.constructEmbed(`${member.displayName}'s Gambling Stats`, '', null, null, member.user.displayAvatarURL());
         embed.addFields(
             { name: 'Current Winning Streak:', value: `${this.gambling.winstreak}`, inline: true },
             { name: 'Current Losing Streak:', value: `${this.gambling.losestreak}`, inline: true },
             { name: '\u200B', value: '\u200B', inline: true },
             { name: 'Total Wins:', value: `${this.gambling.totalwins}`, inline: true },
             { name: 'Total Losses:', value: `${this.gambling.totalloses}`, inline: true },
             { name: '\u200B', value: '\u200B', inline: true },
             { name: 'Highest Winning Streak:', value: `${this.gambling.highestwinstreak}`, inline: true },
             { name: 'Highest Losing Streak:', value: `${this.gambling.highestlosestreak}`, inline: true },
             { name: '\u200B', value: '\u200B', inline: true },
             { name: 'Total Cash Won:', value: `${this.gambling.totalwinnings}${coinEmoji}`, inline: true },
             { name: 'Total Cash Lost:', value: `${this.gambling.totallosings}${coinEmoji}`, inline: true },
             { name: '\u200B', value: '\u200B', inline: true },
             );
        return message.channel.send(embed);
    }
    async mute(message, specifiedMember, mutetime, reason) {
        this.mutecount++;
        this.mutehistory = this.mutehistory.concat(`**[${this.mutecount}]** ${message.member.displayName} issued a MUTE: \nDuration: ${ms(ms(mutetime))} - *${reason}* (${new Date().toLocaleString()})`);
        let muterole = message.guild.roles.cache.find(role => role.name === 'muted');
        if (!muterole) {
            try {
                // eslint-disable-next-line require-atomic-updates
                muterole = await message.guild.roles.create({
                    name: 'muted',
                    color: '#000000',
                    permissions: [],
                });
                // eslint-disable-next-line no-unused-vars
                message.guild.channels.cache.forEach(async (channel, id) => {
                    await channel.createOverwrite(muterole, {
                        SEND_MESSAGES: false,
                        ADD_REACTIONS: false,
                    });
                });
                // eslint-disable-next-line brace-style
            } catch (e) {
                console.log(e.stack);
            }
        }
        await (specifiedMember.roles.add(muterole.id));
        try {
            const embed = this.constructEmbed('', `<@${specifiedMember.id}> has been muted for ${ms(ms(mutetime))} for ${reason}`, null, null);
            embed.setThumbnail(`${specifiedMember.user.displayAvatarURL()}`);
            message.channel.send(embed);
            MuteData.findByIdAndUpdate(this._id, { time: Date.now() + ms(mutetime) }, { upsert : true }).then(()=> console.log('added mute to database'));
            setTimeout(function() {
                specifiedMember.roles.remove(muterole.id);
            }, ms(mutetime));
        }
        catch(e) {
            console.log(e.stack);
        }
        MemberData.findByIdAndUpdate(this._id, { mutecount: this.mutecount, mutehistory: this.mutehistory }).then(() => console.log('updated mute history'));
    }
};