/* eslint-disable no-unused-vars */
const { ApiClient } = require('twitch');
const { ClientCredentialsAuthProvider } = require('twitch-auth');
const { NgrokAdapter } = require('twitch-eventsub-ngrok');
const { EventSubListener } = require('twitch-eventsub');
const { MessageEmbed, WebhookClient } = require('discord.js');
const { NFMC_LOGO_PNG } = require('./constants.js');
exports.twitchWebhooks = async () => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const webhook = new WebhookClient('817526560722518026', 'B6ZymXECxNRR3_XmofJtOZv02Kr73OOG6TivOunwOJy4ad_J-x6oWJPfdf0DjY2D-2YZ');
    const authProvider = new ClientCredentialsAuthProvider(clientId, clientSecret);
    const apiClient = new ApiClient({ authProvider });
    const listener = new EventSubListener(apiClient, new NgrokAdapter(), '319632319898526466601414546035798414154');
    apiClient.helix.eventSub.deleteAllSubscriptions();
    await listener.listen();
    // const user = await apiClient.helix.users.getUserByName('namelessfew');
    // console.log(user.id);
    // fearsome_fox id: 42853181
    const userId = '491288480';
    const onlineSubscription = await listener.subscribeToStreamOnlineEvents(userId, e => {
        console.log(`${e.broadcasterDisplayName} just went live!`);
        getStreamData(e);

    });
    const offlineSubscription = await listener.subscribeToStreamOfflineEvents(userId, e => {
        console.log(`${e.broadcasterDisplayName} just went offline`);
        console.log(e);
        console.dir(e);
    });
    const getStreamData = async (e) => {
        const userStream = await apiClient.helix.streams.getStreamByUserId(userId);
        const userGame = await userStream.getGame();
        const embed = new MessageEmbed()
            .setColor(3021383)
            .setTitle(userStream.title)
            .setURL('https://www.twitch.tv/NamelessFew')
            .setImage(userStream.getThumbnailUrl(400, 300))
            .setAuthor(`${e.broadcasterDisplayName} is now streaming ${userGame.name}!`)
            .addField('Game', userGame.name, true)
            .addField('Viewers', userStream.viewers, true)
            .setTimestamp();
        webhook.send(embed);
    };
};