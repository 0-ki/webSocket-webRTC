const socket = new WebSocket(`ws://${window.location.host}`);

const msgList = document.querySelector("ul");
const nickForm = document.querySelector("#nick");
const msgForm = document.querySelector("#msg");

socket.addEventListener("open", ()=>{console.log("Connected")});
socket.addEventListener("message", (msg) =>{

    const li = document.createElement("li");
    li.innerText = msg.data;
    msgList.append(li);
});
socket.addEventListener("close", ()=>{console.log("Closed")});

function makeMsg(type, payload) {
    const msg = {type, payload};
    return JSON.stringify(msg);
}

function handleSubmit ( event) {
    event.preventDefault();
    const input = msgForm.querySelector("input");
    const li = document.createElement("li");
    li.innerText = `You:${input.value}`;
    msgList.append(li);
    socket.send(makeMsg("new_msg", input.value));
    input.value="";
}

function handleNick ( event) {
    event.preventDefault();
    const input = nickForm.querySelector("input");
    socket.send(makeMsg("nickname", input.value));
}

msgForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNick);
