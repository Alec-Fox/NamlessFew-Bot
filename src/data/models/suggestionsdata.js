const mongoose = require('mongoose');

const SuggestionsDataSchema = mongoose.Schema({
    _id: String,
    messageId: String,
});

module.exports = mongoose.model('SuggestionsData', SuggestionsDataSchema);