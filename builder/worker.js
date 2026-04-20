const { Worker } = require("bullmq");
const logger = require("../config/logger");
const { spawn } = require("child_process");
const AppError = require("../errors/AppError");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fsPromises = require("fs/promises");
const Redis = require("ioredis");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const { uploadDirectory } = require("../utils/uploadDirectory");
const Deployment = require("../models/deploymentModel");
const Log = require("../models/logsSchema")
const { getNextVersion } = require("../utils/getNextVersion");

const connection = {
  host: "127.0.0.1",
  port: 6379,
};

const pub = new Redis(connection);

const runBuild = (job) => {
  return new Promise(async (resolve, reject) => {
    const {
      repoUrl,
      projectName,
      projectId,
      userId,
      buildPath = "",
      env = {},
      jobId, 
    } = job.data;

    logger.info(`jobId: ${jobId}`);

    try {
      
      await Log.updateOne(
        { jobId },
        { status: "cloning", logs: [] },
        { upsert: true }
      );

      pub.publish("deployment_logs", JSON.stringify({
        jobId,
        type: "status",
        status: "cloning"
      }));

    
      await Log.updateOne({ jobId }, { status: "analysing" });

      pub.publish("deployment_logs", JSON.stringify({
        jobId,
        type: "status",
        status: "analysing"
      }));

      const dockerPath =
        "C:/Users/shyam/OneDrive/Desktop/JustShip/justship-api/output";

      const envArgs = [
        "-e", `REPO_URL=${repoUrl}`,
        "-e", `PROJECT_NAME=${projectName}`,
        "-e", `SUBFOLDER=${buildPath}`,
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

      
      await Log.updateOne({ jobId }, { status: "building" });

      pub.publish("deployment_logs", JSON.stringify({
        jobId,
        type: "status",
        status: "building"
      }));

      let buffer = [];
      proc.stdout.on("data", async (data) => {
        const log = data.toString();
        logger.info(log);

        buffer.push(log);

        await Log.updateOne(
          { jobId },
          { $push: { logs: log } }
        );
      });

     
      proc.stderr.on("data", async (data) => {
        const log = data.toString();
        logger.error(log);

        buffer.push(log);

        await Log.updateOne(
          { jobId },
          { $push: { logs: log } }
        );
      });

      const interval = setInterval(() => {
        if (buffer.length === 0) return;

        pub.publish("deployment_logs", JSON.stringify({
          jobId,
          logs: buffer,
        }));

        buffer = [];
      }, 200);

      
      proc.on("close", async (code) => {
        clearInterval(interval);

        if (buffer.length > 0) {
          pub.publish("deployment_logs", JSON.stringify({
            jobId,
            logs: buffer,
          }));
        }

        if (code !== 0) {
          await Log.updateOne({ jobId }, { status: "failed" });

          pub.publish("deployment_logs", JSON.stringify({
            jobId,
            type: "failed"
          }));

          return reject(new AppError("Build failed"));
        }

        await Log.updateOne({ jobId }, { status: "uploading" });

        pub.publish("deployment_logs", JSON.stringify({
          jobId,
          type: "status",
          status: "uploading"
        }));

        const localPath = path.join(
          "C:/Users/shyam/OneDrive/Desktop/JustShip/justship-api",
          "output",
          projectName
        );

        const version = await getNextVersion(projectId);
        const s3Prefix = `${projectName}/v${version}`;

        let deployment;

        try {
          deployment = await Deployment.create({
            projectId,
            userId,
            version,
            buildId: jobId,
            status: "building",
            env
          });

          await uploadDirectory(
            localPath,
            `${projectName}/v${version}`,
            `${projectName}/current`
          );

          deployment.status = "success";
          deployment.s3Path = s3Prefix;
          deployment.cdnUrl = `https://${projectName}.just-ship.app`;
          deployment.completedAt = new Date();

          await deployment.save();

        
          await Log.updateOne(
            { jobId },
            {
              status: "completed",
              url: deployment.cdnUrl
            }
          );

          pub.publish("deployment_logs", JSON.stringify({
            jobId,
            type: "complete",
            url: deployment.cdnUrl
          }));

          resolve({
            projectName,
            version,
            s3Prefix
          });

        } catch (err) {
          if (deployment) {
            deployment.status = "failed";
            deployment.completedAt = new Date();
            await deployment.save();
          }

          await Log.updateOne({ jobId }, { status: "failed" });

          pub.publish("deployment_logs", JSON.stringify({
            jobId,
            type: "failed"
          }));

          reject(err);

        } finally {
          await fsPromises.rm(localPath, {
            recursive: true,
            force: true,
          });
        }
      });

      proc.on("error", (err) => {
        reject(err);
      });

    } catch (err) {
      await Log.updateOne({ jobId }, { status: "failed" });

      pub.publish("deployment_logs", JSON.stringify({
        jobId,
        type: "failed"
      }));

      reject(err);
    }
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
    });

    worker.on("failed", (job, err) => {
      logger.error(`Job failed with jobId :${job?.id} error: ${err.message}`);
    });
  })
  .catch((err) => {
    logger.error(`❌ Worker DB connection error:${err}`);
  });