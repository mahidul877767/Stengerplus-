
const socket = io();
let localStream, peerConnection;
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const statusDiv = document.getElementById("status");

async function start() {
  statusDiv.innerText = "🔄 Waiting for a stranger...";
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
  socket.emit("join");
}

function next() {
  if (peerConnection) peerConnection.close();
  remoteVideo.srcObject = null;
  socket.emit("next");
  statusDiv.innerText = "🔄 Finding new partner...";
}

function createPeerConnection(isInitiator) {
  peerConnection = new RTCPeerConnection(config);

  // Send all tracks (audio + video)
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = event => {
    const [stream] = event.streams;
    remoteVideo.srcObject = stream;
    statusDiv.innerText = "✅ Connected!";
  };

  peerConnection.onicecandidate = e => {
    if (e.candidate) socket.emit("ice", e.candidate);
  };

  if (isInitiator) {
    peerConnection.createOffer().then(offer => {
      peerConnection.setLocalDescription(offer);
      socket.emit("offer", offer);
    });
  }
}

socket.on("ready", () => {
  createPeerConnection(true);
});

socket.on("offer", offer => {
  createPeerConnection(false);
  peerConnection.setRemoteDescription(offer).then(() => {
    peerConnection.createAnswer().then(answer => {
      peerConnection.setLocalDescription(answer);
      socket.emit("answer", answer);
    });
  });
});

socket.on("answer", answer => {
  peerConnection.setRemoteDescription(answer);
});

socket.on("ice", candidate => {
  peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
});

socket.on("disconnectPeer", () => {
  if (peerConnection) peerConnection.close();
  remoteVideo.srcObject = null;
  statusDiv.innerText = "❌ Stranger disconnected. Waiting...";
});
