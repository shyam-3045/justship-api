const logger = require("../config/logger");
const AppError = require("../errors/AppError");
const Project = require("../models/projectSchema");
const { addJobToQ } = require("../utils/addJobToQ");

exports.deployProjectService = async (data,userId,jobId) => {
  logger.info("build received!");

  const { url,buildPath,env, projectName,framework } = data;
  

  if (!url) {
    throw new AppError("GitHub url is required", 400);
  }

  if(!userId)
  {
    throw new AppError("UserId is required", 400)
  }
  if(!jobId)
  {
    throw new AppError("jobId is required", 400)
  }

  if (!framework) {
    throw new AppError("FrameWork  is missing", 400);
  }

  if (!projectName) {
    throw new AppError("Project Name is missing", 400);
  }

  if (!url.includes("github.com")) {
    throw new AppError("Only GitHub repositories are supported", 400);
  }

  const githubRegex = /^https:\/\/github\.com\/[^\/]+\/[^\/]+/;
  if (!githubRegex.test(url)) {
    throw new AppError("Invalid GitHub repository URL", 400);
  }

  let project;
  const projectUrl = `https://${projectName}.just-ship.app`

  try {
    project = await Project.create({
      name: projectName,
      userId,
      repoUrl: url,
      subfolder: buildPath || "/",
      currentVersion: 0,
      framework:framework,
      url:projectUrl
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError("Project name already exists", 400);
    }
    throw err;
  }

  const jobData = {
    projectId: project._id,
    repoUrl: url,
    env: env || {},
    buildPath: buildPath || "/",
    projectName,
    userId,
    framework,
    jobId
  };
  console.log(`jobData from service:${jobData.toString()}`)

  const jobID = await addJobToQ(jobData);

  return jobID;
};
