const { Worker } = require("bullmq");
const logger = require("../config/logger");
const { spawn } = require("child_process");
const AppError = require("../errors/AppError");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const path = require("path");
dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});
const fsPromises = require("fs/promises");

const { uploadDirectory } = require("../utils/uploadDirectory");
const Deployment = require("../models/deploymentModel");
const { getNextVersion } = require("../utils/getNextVersion");

const connection = {
  host: "127.0.0.1",
  port: 6379,
};

const runBuild = (job) => {
  return new Promise((resolve, reject) => {
    const {
      repoUrl,
      projectName,
      projectId,
      userId,
      buildPath = "",
      env = {},
    } = job.data;

    logger.info(`url:${repoUrl}`);
    logger.info(`projectName:${projectName}`);
    logger.info(`projectId from worker:${projectId}`);
    logger.info(`userId:${userId}`);

    const dockerPath =
      "C:/Users/shyam/OneDrive/Desktop/JustShip/justship-api/output";

    const envArgs = [
      "-e",
      `REPO_URL=${repoUrl}`,
      "-e",
      `PROJECT_NAME=${projectName}`,
      "-e",
      `SUBFOLDER=${buildPath}`,
    ];

    for (const [key, value] of Object.entries(env)) {
      if (value !== undefined) {
        envArgs.push("-e", `${key}=${value}`);
      }
    }

    const dockerArgs = [
      "run",
      "--rm",
      "--name",
      `deployx-builder-${job.id}`,
      ...envArgs,
      "-v",
      `${dockerPath}:/output`,
      "-w",
      "/app",
      "justship:v2",
    ];

    logger.info(`Running Docker:${dockerArgs.join(" ")}`);

    const proc = spawn("docker", dockerArgs);

    proc.stdout.on("data", (data) => {
      logger.info(data.toString());
    });

    proc.stderr.on("data", (data) => {
      logger.error(data.toString());
    });

    proc.on("close", async (code) => {
      let deployment;

      try {
        if (code !== 0) {
          return reject(new AppError("Build failed"));
        }

        const localPath = path.join(
          "C:/Users/shyam/OneDrive/Desktop/JustShip/justship-api",
          "output",
          projectName,
        );

        const version = await getNextVersion(projectId);

        const s3Prefix = `${projectName}/v${version}`;

        deployment = await Deployment.create({
          projectId,
          userId,
          version,
          buildId: job.id.toString(),
          status: "building",
        });

        logger.info(`Uploading to S3: ${s3Prefix}`);

        try {
          await uploadDirectory(
            localPath,
            `${projectName}/v${version}`,
            `${projectName}/current`,
          );

          deployment.status = "success";
          deployment.s3Path = s3Prefix;
          deployment.cdnUrl = `https://${projectName}.just-ship.app`;
          deployment.completedAt = new Date();
        } catch (err) {
          deployment.status = "failed";
          deployment.completedAt = new Date();

          await deployment.save();
          return reject(err);
        } finally {
          await fsPromises.rm(localPath, {
            recursive: true,
            force: true,
          });
        }

        await deployment.save();

        logger.info("Upload + Cleanup done");

        resolve({
          projectName,
          version,
          s3Prefix,
        });
      } catch (err) {
        if (deployment) {
          deployment.status = "failed";
          deployment.completedAt = new Date();
          await deployment.save();
        }

        reject(err);
      }
    });

    proc.on("error", (err) => {
      reject(err);
    });
  });
};

mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    logger.info("✅ Worker connected to MongoDB");

    const worker = new Worker("deploy-queue", runBuild, {
      connection,
      concurrency: 3,
    });

    worker.on("completed", (job) => {
      logger.info("Job Completed JobId :", job.id);
      logger.info("Result:", job.returnvalue);
    });

    worker.on("failed", (job, err) => {
      logger.error(`Job failed with jobId :${job?.id} error: ${err.message}`);
    });
  })
  .catch((err) => {
    logger.error(`❌ Worker DB connection error:${err}`);
  });
