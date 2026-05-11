const button = document.getElementById("connectBtn");

button.addEventListener("click", () => {
  const socket = io("ws://localhost:3000");
});