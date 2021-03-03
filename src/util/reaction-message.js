const addReactions = (message, reactions) => {
    message.react(reactions[0]);
    reactions.shift();
    if (reactions.length > 0) {
        setTimeout(() => addReactions(message, reactions), 750);
    }
};

module.exports = async (client, id, text, reactions = []) => {
    const channel = await client.channels.fetch(id);
            const fetchedMessages = await channel.messages.fetch();
            channel.bulkDelete(fetchedMessages).catch(error => {console.error('Failed to delete the message:', error);});
            channel.send(text).then((message) => {
                addReactions(message, reactions);
            });
};