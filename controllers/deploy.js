const logger = require("../config/logger");
const AppError = require("../errors/AppError");
const Project = require("../models/projectSchema");
const { deployProjectService } = require("../services/deploy");
const { addJobToQ } = require("../utils/addJobToQ");
const Deployment = require("../models/deploymentModel");
const User = require("../models/userSchema");
const { customAlphabet } = require("nanoid");
const Log = require("../models/logsSchema");
const { getCommitHash } = require("../utils/getLatestCommitHash");
const { createWebhook } = require("../utils/createWebhook");

const nanoidAlpha = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  5,
);

exports.deployProject = async (req, res, next) => {
  try {
    const userId = req.cookies.userId;

    const { url, branch, repoFullName } = req.body;

    if (!url || !branch || !repoFullName) {
      throw new AppError("Missing required fields", 400);
    }

    const userDet = await User.findById(userId);
    if (!userDet) throw new AppError("User not found", 404);

    const jobId = nanoidAlpha();

    let hash = "unknown";

    try {
      hash = await getCommitHash(repoFullName, branch, userDet.accessToken);
    } catch (err) {
      console.error("Commit fetch failed:", err.message);
    }

    await deployProjectService(
      req.body,
      userId,
      jobId,
      hash,
    );
    try {
      await createWebhook(repoFullName, userDet.accessToken);
      console.log("Webhook created");
    } catch (err) {
      console.log("Webhook may already exist or failed:", err.message);
    }

    console.log("JOB ID:", jobId);

    return res.status(200).send({
      msg: "Deployment Triggered",
      jobID: jobId,
    });
  } catch (error) {
    next(error);
  }
};

exports.reDeployProject = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const userId = req.cookies.userId;

    if (!projectId) {
      throw new AppError("Project Id required", 400);
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw new AppError("Project Not found", 401);
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new AppError("User not found", 401);
    }

    const jobId = nanoidAlpha();

    
    let commitHash = "unknown";
    try {
      commitHash = await getCommitHash(
        project.repoFullName,
        project.branch,
        user.accessToken
      );
    } catch (err) {
      console.error("Commit fetch failed:", err.message);
    }

    const jobData = {
      projectId,
      repoUrl: project.repoUrl,
      env: project.env || {},
      buildPath: project.subfolder || "/",
      projectName: project.name,
      userId,
      framework: project.framework,
      jobId,
      branch: project.branch,
      hash:commitHash 
    };

    await addJobToQ(jobData);

    logger.info(`JOB ID:${jobId}`);

    return res.status(200).send({
      msg: "Redeploy Triggered",
      jobID: jobId,
    });

  } catch (error) {
    next(error);
  }
};

exports.getMyDeployments = async (req, res, next) => {
  try {
    const userId = req.cookies.userId;
    const projectId = req.params.projectId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    if (!projectId) {
      throw new AppError("Project Id required ", 401);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User Doesn't Exist", 400);
    }

    const project = await Project.find({
      userId: userId,
    });
    if (!project) {
      throw new AppError("Project Doesn't Exist", 400);
    }

    const projectDoc = await Project.findById(projectId);

    const deployments = await Deployment.find({
      projectId: projectId,
      status: "completed",
    });

    console.log("deployments :", deployments);

    return res.status(200).json({
      msg: "Deployments fetched successfully",
      success: true,
      deployments: deployments,
    });
  } catch (error) {
    next(error);
  }
};

exports.getLogs = async (req, res, next) => {
  try {
    const { jobId } = req.params;

    const job = await Log.findOne({ jobId });
    if (!job) {
      return res.status(200).json({
        success: true,
        logs: [],
        status: "unknown",
      });
    }
    res.status(200).json({
      success: true,
      logs: job.logs,
      status: job.status,
      url: job.url,
    });
  } catch (error) {
    next(error);
  }
};
