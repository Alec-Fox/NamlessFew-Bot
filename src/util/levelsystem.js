exports.giveXp = (message) => {
    const levelCoefficient = Math.pow(2, (Number(message.client.memberinfo[message.member.id].level) / 7));
    const xp = Math.floor(levelCoefficient * (11 * Math.random() + 10));
    message.client.memberinfo[message.member.id].addExperience(message, xp);
};

exports.calculateRequiredXpTable = () => {
    const L = 100;
    const levels = [];
    const value = [0];
    const xp = [];
    for (let i = 0; i <= L; i++) {
        levels.push(i);
        for (let n = 0; n < levels[i]; n++) {
            value[i] = Math.ceil(n + 300 * Math.pow(2, (n + 1) / 7));
        }
        xp.push(Math.ceil(0.25 * value.reduce((accumulator, currentValue) => {
            return accumulator + currentValue;
        })));
    }
    return(xp);
};