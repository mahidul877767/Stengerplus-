
const socket = io();
let localStream;
let peerConnection;
const config = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
};
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

async function start() {
  localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  localVideo.srcObject = localStream;
  socket.emit("find-stranger");
}

socket.on("offer", async (id, description) => {
  peerConnection = new RTCPeerConnection(config);
  localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  await peerConnection.setRemoteDescription(description);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit("answer", id, answer);
  peerConnection.ontrack = e => remoteVideo.srcObject = e.streams[0];
});

socket.on("answer", description => peerConnection.setRemoteDescription(description));
socket.on("candidate", candidate => peerConnection.addIceCandidate(new RTCIceCandidate(candidate)));

function disconnect() {
  if (peerConnection) peerConnection.close();
  socket.emit("disconnect-peer");
}
