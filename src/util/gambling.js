exports.calculateCashLeaderBoards = (client) => {
    const sortableCash = [];
    const guild = client.guilds.cache.first();
    Object.keys(client.memberinfo).forEach(key => {
        const guildMember = guild.members.cache.find(member => member.id === key);
        sortableCash.push([guildMember.displayName, client.memberinfo[key].cash]);
    });
    sortableCash.sort(function(a, b) {
        return b[1] - a[1];
    });
    return sortableCash;
};