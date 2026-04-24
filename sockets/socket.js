
const userSockets = new Map(); 
let ioInstance;

const setIO = (io) => {
  ioInstance = io;
};

const getIO = () => ioInstance;

const initSocket = (io) => {
  setIO(io); 

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("register", (userId) => {
      if (!userId) return;

      userSockets.set(userId.toString(), socket.id);
      console.log(`User ${userId} mapped to socket ${socket.id}`);
    });

    socket.on("join_room", (jobId) => {
      socket.join(jobId);
      console.log(`Socket joined room: ${jobId}`);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);

      for (const [userId, sockId] of userSockets.entries()) {
        if (sockId === socket.id) {
          userSockets.delete(userId);
          break;
        }
      }
    });
  });
};

module.exports = { initSocket, getIO, userSockets };