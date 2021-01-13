module.exports = class Info {
    constructor(data) {
        Object.keys(data).forEach(key => this[key] = data[key]);
    }
};