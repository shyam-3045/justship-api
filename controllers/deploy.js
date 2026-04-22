const logger = require("../config/logger");
const AppError = require("../errors/AppError");
const Project = require("../models/projectSchema");
const { deployProjectService } = require("../services/deploy");
const { addJobToQ } = require("../utils/addJobToQ");
const Deployment = require("../models/deploymentModel");
const User = require("../models/userSchema");
const { customAlphabet } = require("nanoid");
const Log = require("../models/logsSchema");

const nanoidAlpha = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  5,
);

exports.deployProject = async (req, res, next) => {
  try {
    const userId = req.cookies.userId;
    const jobId = nanoidAlpha();
    await deployProjectService(req.body, userId, jobId);
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
    const jobId = nanoidAlpha();
    if (!projectId) {
      throw new AppError("Project Id required", 400);
    }
    const project = await Project.findById(projectId);

    if (!project) {
      throw new AppError("Project Not found", 401);
    }

    
    const jobData = {
      projectId: projectId,
      repoUrl: project.repoUrl,
      env: project.env || {},
      buildPath: project.subfolder || "/",
      projectName: project.name,
      userId: userId,
      framework: project.framework,
      jobId: jobId,
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
      version: { $ne: projectDoc.currentVersion },
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
