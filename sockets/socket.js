const initSocket = (io) => {
  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join_room", (jobId) => {
      socket.join(jobId);
      console.log(`Socket joined room: ${jobId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};

module.exports = initSocket;