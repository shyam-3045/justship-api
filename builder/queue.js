const { Queue } = require("bullmq");

const connection = {
  host: "127.0.0.1",
  port: 6379,
};

const queue = new Queue("deploy-queue", { connection });

module.exports = queue;