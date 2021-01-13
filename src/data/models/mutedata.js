const mongoose = require('mongoose');

const muteDataSchema = mongoose.Schema({
    _id: String,
    time: Number,
});

module.exports = mongoose.model('MuteData', muteDataSchema);