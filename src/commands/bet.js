const {
    constructEmbed,
    checkCash,
    getRand,
} = require('../util/utilities.js');

module.exports = {
	name: 'bet',
	description: 'Gamble coins for a 50% chance to double up.',
	usage: '[amount]',
    cooldown: 1,
    args: true,
	modOnly: false,
	execute(message, args) {
		message.delete();
        const amount = Number(args[0]);
        if (isNaN(amount) || !Number.isInteger(amount) || amount < 1) {
			const embed = constructEmbed('Invalid amount of cash', '', null, null);
			return message.channel.send(embed);
        }
        if (checkCash(message, args[0]) === false) {
            const embed = constructEmbed('You do not have enough cash', '', null, null);
			return message.channel.send(embed);
        }
        message.client.memberinfo[message.member.id].removeCash(message.member, amount, `You gambled and lost ${amount}`);
        const outcome = getRand(0, 2);
        console.log(outcome);
        if(outcome) {
            message.client.memberinfo[message.member.id].addCash(message.member, (amount * 2), `You won ${amount * 2} from gambling!`);
            const embed = constructEmbed(` ${message.member.displayName} won ${amount * 2}`, '', null, null);
			return message.channel.send(embed);
        }
        else {
            const embed = constructEmbed(` ${message.member.displayName} lost ${amount}`, '', null, null);
			return message.channel.send(embed);
        }
	},
};