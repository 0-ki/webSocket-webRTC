import http from "http";
import express from "express";
import WebSocket, { WebSocketServer } from "ws";
import path from 'path';
const __dirname = path.resolve();

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/src/views");
app.use("/public", express.static(__dirname + "/src/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log("Listening on http://localhost:3000");

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const sockets = [];

wss.on("connection", (socket) => {
    socket["nickname"] = "익명";
    sockets.push(socket);
    console.log( "connected");
    socket.on("close",()=>{console.log("Browser Closed")});

    socket.on("message", (message)=>{
        const msg = JSON.parse(message);
        console.log(msg);
        switch(msg.type){
            case "nickname":
                socket["nickname"] = msg.payload;
                break;
            case "new_msg":
                sockets.forEach((aSocket) => {
                    if(aSocket !=socket) aSocket.send(`${socket.nickname}: ${msg.payload}`)
                });
        }
    });
});

server.listen(3000, handleListen);