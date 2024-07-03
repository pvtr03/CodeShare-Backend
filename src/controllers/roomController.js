const asyncHandler = require("express-async-handler");
const Room = require('../models/roommodel')
const activeRoom = require('../models/activeRoomModel');
const makelink = require('./makelink')
const bcrypt = require("bcryptjs")
const ObjectID = require('mongodb').ObjectId

const createRoom = asyncHandler( async (req, res) => {
    const { title, code, language, isPublic, password } = req.body;
    if(!title || !code || !language){
        res.status(400);
        throw new Error("All fields are mandatory !");
    }
    let link = "abcd"
    while(1){
        link = makelink(5)
        const room = await Room.find({ link: link }).setOptions({ sanitizeFilter: true });
        if(room.length == 0) 
            break;
    }
    const room = await Room.create({
        link: link, 
        title,
        code,
        language,
        isPublic,
        password
    });
    res.status(201).json(room)
});


const getRoom = asyncHandler( async (req, res) => {
    const password = req.query.password
    let room = await Room.find({ link: req.params.id}).setOptions({ sanitizeFilter: true });
    if(room.length == 0){
        // error
        res.status(404);
        throw new Error("Room not Found");
    }
    const hashedpass = room[0]["password"]
    if(!hashedpass){
        res.status(200).json(room)
    }
    else{
        bcrypt.compare(password, hashedpass, function(error, match){
            if(!match){
                res.status(403).json('Unauthorized')
            }
            else{
                res.status(200).json(room);
            }
        })
    }
});

const updateRoom = asyncHandler( async (req, res) => {
    const { title, code, language, isPublic, password } = req.body;
    const room = await Room.find({ link: req.params.id }).setOptions({ sanitizeFilter: true });
    // console.log(code);
    if(room.length == 0){
        // error
        res.status(404);
        throw new Error("Room not Found");
    }
    const hashedpass = room[0]["password"]
    if(!hashedpass){
        const ID = room[0]._id;
        const updatedRoom = await Room.findByIdAndUpdate(
            ID,
            {
                link: req.params.id,
                title: title,
                code: code,
                language: language,
                isPublic: isPublic,
                password: hashedpass
            },
            { new: true }
        );
        res.status(200).json(updatedRoom);
    }
    else{
        bcrypt.compare(password, hashedpass, async function(error, match){
            if(error){
                throw error
            }
            else if(!match){
                res.status(403).json('Unauthorized')
            }
            else{
                const ID = room[0]._id;
                const updatedRoom = await Room.findByIdAndUpdate(
                    ID,
                    {
                        link: req.params.id,
                        title: title,
                        code: code,
                        language: language,
                        isPublic: isPublic,
                        password: hashedpass
                    },
                    {new: true}
                );
                res.status(200).json(updatedRoom);
            }
        })
    }
});

const addParticipant = async (roomID,socketID,userName)=>{
    // first of all check if this room exists or not
    const room = await Room.findById(roomID);
    if(!room)
    {
        // no such room exists
        return [];
    }
    const activeRoomData = await activeRoom.findOne({roomID:roomID}).setOptions({sanitizeFilter:true});
    if(!activeRoomData)
    {
        // first user / admin of the room
        // create a new activeRoom of this roomID;
        const newActiveRoom = await activeRoom.create({
            roomID:roomID,
            participantList:[{
                socketID:socketID,
                username:userName
            }],
            roomAdmin:socketID
        })

        return newActiveRoom.participantList;

    }
    else
    {
        // room already exists, just add this to participant list;
        activeRoomData.participantList.push({
            socketID: socketID,
            username: userName
        });

        await activeRoomData.save();

        return activeRoomData.participantList;
    }
}
const removeParticipant = async (roomID, socketID) => {
    // first, check if the room exists or not
    const room = await Room.findById(roomID);
    if (!room) {
        // No such room exists
        return [];
    }

    const activeRoomData = await activeRoom.findOne({ roomID: roomID }).setOptions({ sanitizeFilter: true });

    if (!activeRoomData) {
        // no active room found
        return [];
    } else {
        // room exists, remove the user from the participant list
        activeRoomData.participantList = activeRoomData.participantList.filter(
            participant => participant.socketID !== socketID
        );

        // if the participant list is empty, we delete the active room
        if (activeRoomData.participantList.length === 0) {
            await activeRoom.deleteOne({ _id: activeRoomData._id });
        } else {
            await activeRoomData.save();
        }

        return activeRoomData.participantList;
    }
};
module.exports = {createRoom, getRoom, updateRoom, addParticipant, removeParticipant }