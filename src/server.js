import http from "http";
import express from "express";
// import WebSocket, { WebSocketServer } from "ws";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";

import path from 'path';
const __dirname = path.resolve();

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/src/views");
app.use("/public", express.static(__dirname + "/src/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const httpServer = http.createServer(app);
const io = new Server(httpServer);

// connection
io.on("connection", socket => {

    socket.on("join_room", (roomName)=> {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    });

    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    })

    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    })

    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    })
});


////////////////////////// Chat and Rooms
// const io = new Server(httpServer);
// // ADMIN-UI
// const io = new Server(httpServer, {
//     cors: {
//         origin: ["https://admin.socket.io"],
//         credentials: true
//     }
// })
// instrument(io, {
//     auth: false
// });

// function getPublicRooms() {
//     const {
//         sockets: {
//             adapter: { sids, rooms},
//         },
//     } = io;
//     const publicRooms = [];
//     rooms.forEach( (_, room) => {
//         if( sids.get(room) === undefined) publicRooms.push(room);
//     });
//     return publicRooms;
// }

// function countUserInRoom( roomName) {
//     return io.sockets.adapter.rooms.get( roomName)?.size;
// }

// io.on("connection", (socket) => {
//     socket.onAny((event)=>{
//     })

//     socket["nickname"] = "익명";
//     socket.on("room", (roomName, enterRoom)=>{
//         socket.join(roomName);
//         enterRoom(roomName);
//         socket.to(roomName).emit("join_room", socket.nickname, countUserInRoom( roomName));
//         io.sockets.emit("room_change", getPublicRooms());
//     })

//     socket.on("new_msg", ( msg) => {
//         socket.to(msg.roomName).emit("new_msg", `${socket.nickname}: ${msg.msg}`);
//     })

//     socket.on("save_nick", ( msg) => {
//         socket["nickname"]  = msg.msg;
//     })

//     socket.on("disconnecting", () => {
//         socket.rooms.forEach((room) => {
//             socket.to(room).emit("leave_room", socket.nickname, countUserInRoom(room)-1);
//         });
//     })

//     socket.on("disconnect", () => {
//         io.sockets.emit("room_change", getPublicRooms());
//     })

// });


/////////////// use WebSocket
// const wss = new WebSocketServer({ server });
// const sockets = [];

// wss.on("connection", (socket) => {
//     socket["nickname"] = "익명";
//     sockets.push(socket);
//     console.log( "connected");
//     socket.on("close",()=>{console.log("Browser Closed")});

//     socket.on("message", (message)=>{
//         const msg = JSON.parse(message);
//         switch(msg.type){
//             case "nickname":
//                 socket["nickname"] = msg.payload;
//                 break;
//             case "new_msg":
//                 sockets.forEach((aSocket) => {
//                     if(aSocket != socket) aSocket.send(`${socket.nickname}: ${msg.payload}`);
//                 });
//                 break;
//         }
//     });
// });

httpServer.listen(3000, handleListen);