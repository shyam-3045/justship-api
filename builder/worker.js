const { Worker } = require("bullmq");
const logger = require("../config/logger");
const { spawn } = require("child_process");
const AppError = require("../errors/AppError");

const connection = {
  host: "127.0.0.1",
  port: 6379,
};

const runBuild = (job) => {
  return new Promise((resolve, reject) => {
    const {
      repoUrl,
      projectName,
      buildPath = "",
      env = {},

    } = job.data;


    const dockerPath = "C:/Users/shyam/OneDrive/Desktop/JustShip/backend/output"

    const envArgs = [
      "-e", `REPO_URL=${repoUrl}`,
      "-e", `PROJECT_NAME=${projectName}`,
      "-e", `SUBFOLDER=${buildPath || ""}`,
    ];

    for (const [key, value] of Object.entries(env)) {
      if (key && value !== undefined) {
        envArgs.push("-e", `${key}=${value}`);
      }
    }

    const dockerArgs = [
      "run",
      "--rm",
      "--name", `deployx-builder-${job.id}`,

      ...envArgs,

      "-v", `${dockerPath}:/output`,
      "-w", "/app",

      "justship:v2"
    ];

    logger.info("🚀 Running Docker:", dockerArgs.join(" "));

    const proc = spawn("docker", dockerArgs);

    let finalProjectName = null;

    proc.stdout.on("data", (data) => {
      const msg = data.toString();
      logger.info(msg);

      if (msg.includes("BUILD_SUCCESS:")) {
        finalProjectName = msg.split("BUILD_SUCCESS:")[1].trim();
      }
    });

    proc.stderr.on("data", (data) => {
      logger.info(`Log : ${data.toString()}`);
    });

    proc.on("close", (code) => {
      if (code === 0 && finalProjectName) {
        resolve(finalProjectName);
      } else {
        reject(new AppError("Build failed"));
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
};
const worker = new Worker("deploy-queue", runBuild, {
  connection,
  concurrency: 3,
});

worker.on("completed", (job) => {
  logger.info("Job Completed JobId :",job.id);
});

worker.on("failed", (job, err) => {
  logger.error(`Job failed with jobId :${job?.id} with error${ err.message}`
  );
});