const Redis = require("ioredis");

let io;

const connection = {
  host: "127.0.0.1",
  port: 6379
};

const sub = new Redis(connection);

const initSubscriber = (socketIO) => {
  io = socketIO;

  sub.subscribe("deployment_logs");

  sub.on("message", (_, message) => {
    try {
      const data = JSON.parse(message);
      const { jobId, logs, type, status, url } = data;

      
      if (type === "status") {
        io.to(jobId).emit("status", status);
        return;
      }

      if (type === "complete") {
        io.to(jobId).emit("complete", { url });
        return;
      }

      
      if (type === "failed") {
        io.to(jobId).emit("failed");
        return;
      }


      if (logs) {
        io.to(jobId).emit("logs", logs);
      }

    } catch (err) {
      console.error("Redis message parse error:", err);
    }
  });

  console.log("Redis subscriber initialized");
};

module.exports = initSubscriber;