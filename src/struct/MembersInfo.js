const {
    MessageEmbed,
} = require('discord.js');
const {
    ECONOMY_LOGGER_CHANNEL_ID,
    BOT_CHANNEL_ID,
} = require('../util/constants.js');
const { calculateRequiredXpTable } = require('../util/levelsystem.js');
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
    addRoleIncome(amount, type, member) {
        this.cash += amount;
        this.moneyledger.push([type, amount]);
        MemberData.findByIdAndUpdate(this._id, { cash: this.cash }).then(()=> this.updateEconomyLog(member, this.name, amount, type, '+'));
        MemberData.findByIdAndUpdate(this._id, { moneyledger: this.moneyledger });
    }
    addInvite(member, memberId) {
        if(!this.serverinvites.includes(memberId)) {
            this.serverinvites.push(memberId);
            member.client.memberinfo[memberId].inviter = this._id;
            MemberData.findByIdAndUpdate(this._id, { serverinvites: this.serverinvites }).then(() => console.log(`added ${memberId} to ${this._id}'s invite count`));
            MemberData.findByIdAndUpdate(memberId, { inviter: this._id }).then(() => console.log(`added ${this._id} to ${memberId}'s as inviter`));
            this.addCash(member, 10, `Reward for inviting ${member.displayName} to the server`);
        }
    }
    addInviteProspect(member, memberId) {
        if(!this.serverinvitesProspect.includes(memberId)) {
            this.serverinvitesProspect.push(memberId);
            MemberData.findByIdAndUpdate(this._id, { serverinvitesProspect: this.serverinvitesProspect }).then(() => console.log(`added ${memberId} to ${this._id}'s inviteProspect count`));
            this.addCash(member, 25, `Reward for inviting ${member.displayName} as a prospect`);
        }
    }
    addInviteMember(member, memberId) {
        if(!this.serverinvitesMember.includes(memberId)) {
            this.serverinvitesMember.push(memberId);
            MemberData.findByIdAndUpdate(this._id, { serverinvitesMember: this.serverinvitesMember }).then(() => console.log(`added ${memberId} to ${this._id}'s inviteMember count`));
            this.addCash(member, 50, `Reward for inviting ${member.displayName} as a member`);
        }
    }
    addExperience(message, amount) {
        this.experience += amount;
        console.log(`giving ${amount} xp to ${message.member.displayName}.`);
        MemberData.findByIdAndUpdate(this._id, { experience: this.experience }).then(()=> this.checkLevel());
    }
    checkLevel() {
        const xpTable = calculateRequiredXpTable();
        console.log(`current level: ${this.level}\ncurrent xp: ${this.experience}`);
        console.log(`required xp: ${xpTable[this.level + 1]}`);
        if(this.experience >= xpTable[this.level + 1]) {
            this.level++;
            this.experience = 0;
            MemberData.findByIdAndUpdate(this._id, { level: this.level }).then(() => console.log(`${this.name} leveled to ${this.level}`));
            MemberData.findByIdAndUpdate(this._id, { experience: this.experience }).then(() => console.log('reset xp'));

        }
    }
    updateEconomyLog(member, memberName, amount, reason, incrementType) {
        const EconomyLogChannel = member.guild.channels.cache.find(channel => channel.id === ECONOMY_LOGGER_CHANNEL_ID);
        const embed = this.constructEmbed(`${memberName}'s bank adjustment: ${incrementType}${amount}`, `Reason: ${reason}`);
        embed.setTimestamp();
        return EconomyLogChannel.send(embed);
    }
    bank(message) {
        const embed = this.constructEmbed(`${this.name}, your total balance is ${this.cash}.`, this.moneyledger, null, null);
        return message.channel.send(embed);
    }
    addCash(member, amount, reason) {
        const BotCommandsChannel = member.guild.channels.cache.find(channel => channel.id === BOT_CHANNEL_ID);
        this.cash += amount;
        this.moneyledger.push([reason, amount]);
        MemberData.findByIdAndUpdate(this._id, { cash: this.cash }).then(()=> this.updateEconomyLog(member, this.name, amount, reason, '+'));
        MemberData.findByIdAndUpdate(this._id, { moneyledger: this.moneyledger }).then(()=>console.log('updated ledger'));
        const embed = this.constructEmbed(`${this.name}, ${amount} was added to your bank`, `Reason: ${reason}. \nYour total balance is now ${this.cash}`, null, null);
        return BotCommandsChannel.send(embed);
    }
    removeCash(member, amount, reason) {
        this.cash -= amount;
        this.moneyledger.push([reason, -amount]);
        MemberData.findByIdAndUpdate(this._id, { cash: this.cash }).then(()=> this.updateEconomyLog(member, this.name, amount, reason, '-'));
        MemberData.findByIdAndUpdate(this._id, { moneyledger: this.moneyledger }).then(()=>console.log('updated ledger'));
    }
    setSteamId(message, args) {
        this.steamid = args[0];
        const embed = this.constructEmbed(`${this.name}, your steam ID has been set: ${args[0]}`, '', null, null);
        MemberData.findByIdAndUpdate(this._id, { steamid: args[0] });
        return message.channel.send(embed);
    }
    giveWarning(message, reason) {
        this.warnings++;
        this.warningreasons = this.warningreasons.concat(`${message.member.displayName} issued a WARNING:\n*${reason}*  (${new Date().toLocaleString()})`);
        const embed = this.constructEmbed(`${this.name}, you received a warning.`, `Reason: ${reason}`, null, null);
        MemberData.findByIdAndUpdate(this._id, { warningreasons: this.warningreasons, warnings: this.warnings });
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
        const embed = this.constructEmbed(`${this.name}'s Warnings (${this.warnings}):`, reasons, null, embedFields, member.user.displayAvatarURL());
        embed.setFooter(`Discord ID: ${this._id} | Steam ID: ${this.steamid}`);
        embed.setTimestamp(message.createdAt);
        return message.channel.send(embed);

    }
    bet(message, amount) {
        message;
        amount;
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