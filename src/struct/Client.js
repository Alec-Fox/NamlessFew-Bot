const Info = require('./Info.js');
const {
	Client,
	Collection,
} = require('discord.js');
const info_data = require('../data/info.json');
const info = new Info(info_data);
module.exports = class extends Client {
	constructor(config) {
		super({
			disableMentions: 'everyone',
		});

		this.commands = new Collection();

		this.cooldowns = new Collection();

		this.queue = new Map();

		this.config = config;

		this.info = info;

		this.memberinfo = {};

		this.guildInvites = new Map();

		this.activeUsersMap = new Map();
	}
};