const socket = io();
const myFace = document.querySelector("#myFace");
const myVoice = document.querySelector("#myVoice");
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
let myDataChannel;

async function getCameras() {

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter( device => device.kind === "audioinput");
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
        video: false,
    };

    const cameraConstrains = {
        audio: true,
        video: { deviceId: { exact: deviceId}}
    }
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            // deviceId ? cameraConstrains : 
            initialConstrains
        );
        // myFace.srcObject = myStream;
        myVoice.srcObject = myStream;
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
    // myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel = myPeerConnection.createDataChannel("fileSystem");
    myDataChannel.addEventListener("message", (data)=>{
        console.log(data.data);
    });
    console.log("someone joined")
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription( offer);
    socket.emit("offer", offer, roomName);
})

// Exec on another browser
// Peer B - get Offer , set B's Connection Local/Remote Desc , send Answer to Peer A
socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (data)=> {
            console.log(data.data);
        });
    });
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
    const peerFace = document.querySelector("#peerVoice")
    peerFace.srcObject = data.stream;
}
