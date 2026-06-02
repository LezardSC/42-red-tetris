const connectButton = document.getElementById("connectBtn");
const disconnectButton = document.getElementById("disconnectBtn");
const joinButton = document.getElementById("joinBtn");
const leaveButton = document.getElementById("leaveBtn");
const startButton = document.getElementById("startBtn");
const roomText = document.getElementById("roomId");
var canvas = document.getElementById("canvas");
var ctx = canvas.getContext("2d");


/*------On socket opening-------*/
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

  socket.on("gamestarting", () => {
    console.log("Game starting");
  })

  socket.on("gamestatus", (arg) => {
    console.log(`time: ${arg.time}`);
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    let board = arg.players[0][1].board;
    console.log(`Board len: ${board.length}`);
    for (let i = 0; i < board.length; i++) {
      let tile = board[i];
      ctx.fillStyle = `rgb(${tile[0]}, ${tile[1]}, ${tile[2]})`;
      if (tile[0] != 255) {
        console.log(`tile: x = ${50 * (i % 10)}; y = ${50 * Math.floor(i / 10)}`);
      }
      ctx.fillRect(50 * (i % 10), 50 * Math.floor(i / 10), 50, 50);
    }

    let p = arg.players[0][1].piece;
    ctx.fillStyle = `rgb(${p.color[0]}, ${p.color[1]}, ${p.color[2]})`
    p.tiles.forEach(
      t => {
        ctx.fillRect(50 * (t.x + p.center.x), 50 * (t.y + p.center.y), 50, 50);
      }
    )

  })
});

disconnectButton.addEventListener("click", () => {
  console.log("Disconnecting socket: " + socket.id);
  socket.disconnect();
  socket = null;
});


/*------Room tests-------*/
joinButton.addEventListener("click", () => {
  socket.emit('join', roomText.value);
});

leaveButton.addEventListener("click", () => {
  socket.emit('leave', roomText.value);
})

startButton.addEventListener("click", () => {
  socket.emit('start', roomText.value);
})


/*------Game management-------*/
document.addEventListener("keydown", (event) => {
  const keyname = event.key;

  socket.emit('keydown', event.key);
})

document.addEventListener("keyup", (event) => {
  const keyname = event.key;

  socket.emit('keyup', event.key);
})