const logger = require("../config/logger");
const AppError = require("../errors/AppError");
const { addJobToQ } = require("../utils/addJobToQ");

exports.deployProjectService = async (data) => {
  logger.info("build recieved !");
  const { url, buildPath, env , projectName } = data;
  if (!url) {
    throw new AppError("Git hub url is Required", 400);
  }

  if(!projectName)
  {
    throw new AppError("Project Name is missing",400)
  }

  if (!url.includes("github.com")) {
    throw new AppError("Only GitHub repositories are supported", 400);
  }
  const githubRegex = /^https:\/\/github\.com\/[^\/]+\/[^\/]+/;
  if (!githubRegex.test(url)) {
    throw new AppError("Invalid GitHub repository URL", 400);
  }

  const jobData={
    repoUrl : url,
    env:env||[],
    buildPath :buildPath || "/",
    projectName
  }

  const jobId = await addJobToQ(jobData)
 

  return jobId
};
