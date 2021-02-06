const mongoose = require('mongoose');

const ActiveUsersDataSchema = mongoose.Schema({
    _id: String,
    activeUsersMap: Map,
});

module.exports = mongoose.model('ActiveUsersData', ActiveUsersDataSchema);