const button = document.getElementById("connectBtn");

button.addEventListener("click", () => {
  const socket = io("ws://localhost:3000");

  socket.on("hello", (arg) => {
    console.log(arg);
  });

  socket.emit("howdy", "stranger");
});