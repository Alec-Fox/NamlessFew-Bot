const {
    RichEmbed,
} = require('discord.js');
const {
    ECONOMY_LOGGER_CHANNEL_ID,
} = require('../util/constants.js');
const ms = require('ms');
const MemberData = require('../data/models/memberdata.js');
const MuteData = require('../data/models/mutedata.js');
module.exports = class MemberInfo {
    constructor(data) {
        Object.keys(data).forEach(key => this[key] = data[key]);
    }
    constructEmbed(title, description, image, fields, thumbnail) {
        const embed = new RichEmbed()
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
    updateEconomyLog(message, member, amount, reason) {
        const EconomyLogChannel = message.guild.channels.find(channel => channel.id === ECONOMY_LOGGER_CHANNEL_ID);
        const embed = this.constructEmbed(`${member} received ${amount} \nReason: ${reason}`, '');
        embed.setTimestamp(message.createdAt);
        EconomyLogChannel.send(embed);
    }
    bank(message) {
        const embed = this.constructEmbed(`${this.name}, your total balance is ${this.cash}.`, '', null, null);
        return message.channel.send(embed);
    }
    addCash(message, amount, reason) {
        this.cash += amount;
        MemberData.findByIdAndUpdate(this._id, { cash: this.cash }).then(()=> console.log('added cash to database'));
        const embed = this.constructEmbed(`${this.name}, added ${amount} to your bank \nReason: ${reason}.`, `Your total balance is now ${this.cash}`, null, null);
        this.updateEconomyLog(message, this.name, amount, reason);
        return message.channel.send(embed);
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
        const embed = this.constructEmbed(`${this.name}'s Warnings (${this.warnings}):`, reasons, null, embedFields, member.user.displayAvatarURL);
        embed.setFooter(`Discord ID: ${this._id} | Steam ID: ${this.steamid}`);
        embed.setTimestamp(message.createdAt);
        return message.channel.send(embed);

    }
    async mute(message, specifiedMember, mutetime, reason) {
        this.mutecount++;
        this.mutehistory = this.mutehistory.concat(`**[${this.mutecount}]** ${message.member.displayName} issued a MUTE: \nDuration: ${ms(ms(mutetime))} - *${reason}* (${new Date().toLocaleString()})`);
        let muterole = message.guild.roles.find(role => role.name === 'muted');
        if (!muterole) {
            try {
                // eslint-disable-next-line require-atomic-updates
                muterole = await message.guild.createRole({
                    name: 'muted',
                    color: '#000000',
                    permissions: [],
                });
                // eslint-disable-next-line no-unused-vars
                message.guild.channels.forEach(async (channel, id) => {
                    await channel.overwritePermissions(muterole, {
                        SEND_MESSAGES: false,
                        ADD_REACTIONS: false,
                    });
                });
                // eslint-disable-next-line brace-style
            } catch (e) {
                console.log(e.stack);
            }
        }
        await (specifiedMember.addRole(muterole.id));
        try {
            const embed = this.constructEmbed('', `<@${specifiedMember.id}> has been muted for ${ms(ms(mutetime))} for ${reason}`, null, null);
            message.channel.send(embed);
            MuteData.findByIdAndUpdate(this._id, { time: Date.now() + ms(mutetime) }, { upsert : true }).then(()=> console.log('added mute to database'));
            setTimeout(function() {
                specifiedMember.removeRole(muterole.id);
            }, ms(mutetime));
        }
        catch(e) {
            console.log(e.stack);
        }
        MemberData.findByIdAndUpdate(this._id, { mutecount: this.mutecount, mutehistory: this.mutehistory }).then(() => console.log('updated mute history'));
    }
};