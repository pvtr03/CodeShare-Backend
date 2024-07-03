const cors = require('cors')
const express = require('express')
const app = express()
const {Server} = require('socket.io');
const env = require('dotenv').config()
const connectDb = require('./config/dbconnection')
const errorHandler = require("./middleware/errorhandler");
const http = require('http');
const {addParticipant, removeParticipant} = require('./controllers/roomController');
let server = http.createServer(app);
let io = new Server(server,{
    cors:{
        origin:"*"
    }
});
io.on('connection',(socket)=>{
    // continue from here 
    socket.on('joinRoom',async (roomID,userName)=>{
        // put this in the room's participant's list 
        // remove when this user exits this room
        socket.join(roomID);
        const updatedParticipantList = await addParticipant(roomID,socket.id,userName);
        // emit here a new event, for updated participant's list
        io.to(roomID).emit('participants-update',updatedParticipantList);

    })
    socket.on('code-change',(roomID,newCode)=>{
        socket.broadcast.to(roomID).emit('code-update',newCode);
    })

    socket.on('disconnecting', async () => {
        // Iterate over all the rooms the socket is part of and remove the participant
        const rooms = Array.from(socket.rooms.keys());
        for (const roomID of rooms) {
            if (roomID !== socket.id){
                const participantList = await removeParticipant(roomID, socket.id);
                socket.broadcast.to(roomID).emit('participants-update',participantList);
            }
        }
    });
})

app.use(cors())
connectDb()
const port = process.env.PORT || 4000

app.use(errorHandler);
app.use(express.json())

app.use('/', require('./routes/pasteroutes'))
app.use('/rooms', require('./routes/roomroutes'))

server.listen(port, () => {
    console.log(`Server running on port ${port}`)
})
