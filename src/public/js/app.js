const socket = io();
const myFace = document.querySelector("#myFace");
const muteBtn = document.querySelector("#mute");
const cameraBtn = document.querySelector("#camera");
const camerasSelect = document.querySelector("#cameras");
const call = document.querySelector("#call");

call.hidden = true;

let muted = false;
let cameraOnOff = false;
let myStream;
let roomName= "";
let myPeerConnection;

async function getCameras() {

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter( device => device.kind === "videoinput");
        makeCamerasOption( cameras);

    } catch (error) {
        
    }
}

function makeCamerasOption( cameras){
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach( camera => {
        const option = document.createElement("option");
        option.value = camera.deviceId;
        option.text = camera.label;
        if( currentCamera.label === camera.label) option.selected = true;
        camerasSelect.appendChild(option);
    });
}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: {facingMode :"user"},
    };

    const cameraConstrains = {
        audio: true,
        video: { deviceId: { exact: deviceId}}
    }
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;
        if(!deviceId) await getCameras();
        /* 스트림 사용 */
    } catch (err) {
        console.log( err);
        /* 오류 처리 */
    }
}

function handleMuteClick() {
    myStream.getAudioTracks().forEach((track)=>{
        track.enabled = !track.enabled;
    });
    muted = !muted;
    muteBtn.innerText = muted ? "소리 켜기":"소리 끄기";
}
function handleCameraClick() {
    myStream.getVideoTracks().forEach((track)=>{
        track.enabled = !track.enabled;
    });
    cameraOnOff = !cameraOnOff;
    cameraBtn.innerText = cameraOnOff ? "카메라 켜기":"카메라 끄기";
}

async function handleCameraSelect() {
    await getMedia(camerasSelect.value);
    if(myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSenders = myPeerConnection.getSenders().find(sender => sender.track.kind === "video");
        videoSenders.replaceTrack(videoTrack);
    }
}

// getMedia();

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraSelect);


// welcome form ( join a room )

const welcome = document.querySelector("#welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
    welcome.hidden=true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    roomName = input.value;
    await initCall();
    socket.emit("join_room", roomName);
    input.value="";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Sokcet Code

// Once when another user coming
// Peer A - send Offer to Peer B , set A's Connection Local Desc
socket.on("welcome", async ()=>{
    console.log("someone joined")
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription( offer);
    socket.emit("offer", offer, roomName);
})

// Exec on another browser
// Peer B - get Offer , set B's Connection Local/Remote Desc , send Answer to Peer A
socket.on("offer", async (offer) => {
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
})

// Peer A - get Answer , set Remote Desc with B's Answer
socket.on("answer", (answer) => {
    myPeerConnection.setRemoteDescription(answer);
})

socket.on("ice", (ice) => {
    myPeerConnection.addIceCandidate(ice);
})

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        iceServers: [
            {
                urls: [
                    "stun:stun.l.google.com:19302"
                ]
            }
        ]
    });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
        .getTracks()
        .forEach((track) => {myPeerConnection.addTrack( track, myStream)});
}

function handleIce( data) {
    socket.emit("ice", data.candidate, roomName);
}

function handleAddStream( data) {
    const peerFace = document.querySelector("#peerFace")
    peerFace.srcObject = data.stream;
}


///////////////////////////////////////////   Chat Rooms
// const welcome = document.getElementById("welcome");
// const enterForm = welcome.querySelector("form");

// const room = document.getElementById("room");
// const sendMsgForm = room.querySelector("#msg");
// const saveNickForm = room.querySelector("#nick");

// room.hidden = true;
// welcome.hidden = false;

// let roomName = "";

// function addMessage( msg) {
//     const ul = room.querySelector("ul");
//     const li = document.createElement("li");
//     li.innerText = msg;
//     ul.append(li);
// }

// function enterRoom( roomName) {
//     welcome.hidden = !welcome.hidden;
//     room.hidden = !room.hidden;
//     room.querySelector("h3").innerText = '방제: '+ roomName;
//     sendMsgForm.addEventListener("submit", handleRoomMsgSubmit);
//     saveNickForm.addEventListener("submit", handleSaveNickSubmit);
// }

// function handleRoomEnterSubmit( event) {
//     event.preventDefault();
//     const input = enterForm.querySelector("input");
//     roomName = input.value;
//     socket.emit("room", roomName, enterRoom);
//     input.value = "";
// }

// function handleRoomMsgSubmit( event) {
//     event.preventDefault();
//     const chatInput = sendMsgForm.querySelector("input");
//     socket.emit("new_msg", {roomName: roomName, msg: chatInput.value});
//     addMessage(`나: ${chatInput.value}`);
//     chatInput.value = "";
// }

// function handleSaveNickSubmit( event) {
//     event.preventDefault();
//     const nickInput = saveNickForm.querySelector("input");
//     socket.emit("save_nick", {roomName: roomName, msg: nickInput.value});
// }

// function handleOpenRoomListUp( rooms) {
//     const ul = welcome.querySelector("ul");
//     ul.innerHTML = "";
//     const li = document.createElement("li");
//     li.innerText = rooms.toString();
//     ul.appendChild(li);
// }

// function handleCountRoomUsers( cnt) {
//     if( cnt > 0) room.querySelector("h4").innerText = '인원: '+ cnt + '명';
// }

// enterForm.addEventListener("submit", handleRoomEnterSubmit);

// socket.on("join_room", ( msg, cnt)=>{
//     console.log(msg);
//     addMessage( `"${msg}"님이 입장했습니다.`);
//     handleCountRoomUsers(cnt);
// });

// socket.on("leave_room", ( msg, cnt) => {
//     addMessage( `"${msg}"님이 나갔습니다.`);
//     handleCountRoomUsers(cnt);
// })

// socket.on("new_msg", addMessage)
// socket.on("room_change", handleOpenRoomListUp)


////////////////////////////// Web Socket
// const socket = new WebSocket(`ws://${window.location.host}`);

// const msgList = document.querySelector("ul");
// const nickForm = document.querySelector("#nick");
// const msgForm = document.querySelector("#msg");

// socket.addEventListener("open", ()=>{console.log("Connected")});
// socket.addEventListener("message", (msg) =>{

//     const li = document.createElement("li");
//     li.innerText = msg.data;
//     msgList.append(li);
// });
// socket.addEventListener("close", ()=>{console.log("Closed")});

// function makeMsg(type, payload) {
//     const msg = {type, payload};
//     return JSON.stringify(msg);
// }

// function handleSubmit ( event) {
//     event.preventDefault();
//     const input = msgForm.querySelector("input");
//     const li = document.createElement("li");
//     li.innerText = `You:${input.value}`;
//     msgList.append(li);
//     socket.send(makeMsg("new_msg", input.value));
//     input.value="";
// }

// function handleNick ( event) {
//     event.preventDefault();
//     const input = nickForm.querySelector("input");
//     socket.send(makeMsg("nickname", input.value));
// }

// msgForm.addEventListener("submit", handleSubmit);
// nickForm.addEventListener("submit", handleNick);
