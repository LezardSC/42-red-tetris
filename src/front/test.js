const connectButton = document.getElementById("connectBtn");
const disconnectButton = document.getElementById("disconnectBtn");
const joinButton = document.getElementById("joinBtn");
const leaveButton = document.getElementById("leaveBtn");
const startButton = document.getElementById("startBtn");
const roomText = document.getElementById("roomId");

let socket = null;

connectButton.addEventListener("click", () => {
  if (socket) {
    console.log("This client already possesses a socket.")
    return;
  }
  socket = io("ws://localhost:3000");

  socket.on("handshake", (arg) => {
    console.log("Connecting socket: " + socket.id); 
  })

  socket.on("roomstatus", (arg) => {
    console.log(`Room name: ${arg.name}`);
    console.log(`Room host: ${arg.host}`);
    console.log(`Room players: ${arg.players}`);
    console.log(`Max players: ${arg.maxPlayers}`);
  })

  socket.on("gamestarted", () => {
    console.log("Game started");
  })

  socket.on("gamestatus", (arg) => {
    console.log(`time: ${arg.time}`);
  })
});

disconnectButton.addEventListener("click", () => {
  console.log("Disconnecting socket: " + socket.id);
  socket.disconnect();
  socket = null;
});

joinButton.addEventListener("click", () => {
  socket.emit('join', roomText.value);
});

leaveButton.addEventListener("click", () => {
  socket.emit('leave', roomText.value);
})

startButton.addEventListener("click", () => {
  socket.emit('start', roomText.value);
})
