const mongoose = require('mongoose');

const memberDataSchema = mongoose.Schema({
    _id: String,
    userId: String,
    name: String,
    warnings: Number,
    warningreasons: Array,
    mutecount: Number,
    mutehistory: Array,
    steamid: String,
    cash: Number,
    level: Number,
    experience: Number,
    serverinvites: Array,
    serverinvitesProspect: Array,
    serverinvitesMember: Array,
    inviter: String,
    moneyledger: Array,
});

module.exports = mongoose.model('MemberData', memberDataSchema);