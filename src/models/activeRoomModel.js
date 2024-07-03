const mongoose = require('mongoose');

const activeRoomSchema = mongoose.Schema({
    roomID: {
        type: String,
        required: true
    },
    participantList: [{
        socketID: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        }
    }],
    roomAdmin: {
        type: String, // Socket ID of the room admin
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('activeRoom', activeRoomSchema);