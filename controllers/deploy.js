const logger = require("../config/logger");
const AppError = require("../errors/AppError");
const Project = require("../models/projectSchema");
const { deployProjectService } = require("../services/deploy");
const { addJobToQ } = require("../utils/addJobToQ");

exports.deployProject = async (req, res, next) => {
  try {
    const jobId = await deployProjectService(req.body)
    logger.info("JOB ID:",jobId)
    return res.status(200).send(
      {
        msg : "Job Added to Queue",
        jobID:jobId
      }
    )
  } catch (error) {
    next(error)
  }
};


exports.reDeployProject=async(req,res,next)=>
{
  try {
    // implement JWT
    const {projectId , userId} = req.body
    //// const userId = req.cookies.userId
    if(!projectId)
    {
      throw new AppError("Project Id required",400)
    }
    const project = await Project.findById(projectId)

    if(!project)
    {
      throw new AppError("Project Not found",401)
    }

    const jobData = {
    projectId: projectId,
    repoUrl: project.repoUrl,
    env: project.env || {},
    buildPath: project.subfolder || "/",
    projectName:project.name,
    userId:userId,
    framework:project.framework
  }

  const jobId = await addJobToQ(jobData)
  logger.info("JOB ID:",jobId)
    return res.status(200).send(
      {
        msg : "Job Added to Queue",
        jobID:jobId
      }
    )

  } catch (error) {
    next(error)
  }
}

exports.getMyDeployments=async(req,res,next)=>
{
  try {
    const userId = "69e3ad542e945401fcd30939"
    const {projectId}=req.body

    if(!userId)
    {
      throw new AppError("Unauthorized",401)
    }
    if(!projectId)
    {
      throw new AppError("Project Id required ",401)
    }

    const



  } catch (error) {
    next(error)
  }
}