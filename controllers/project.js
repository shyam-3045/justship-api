const AppError = require("../errors/AppError");
const Deployment = require("../models/deploymentModel");
const Project = require("../models/projectSchema");
const { switchVersion } = require("../utils/switchVersion");
const User = require("../models/userSchema");
const logger = require("../config/logger");
exports.setVersion = async (req, res, next) => {
  try {
    const { projetId, version } = req.body;
    const userId = req.cookies.userId;

    if (!projetId) {
      throw new AppError("Project Id requiured", 400);
    }
    if (!version) {
      throw new AppError("version No requiured", 400);
    }
    if (!userId) {
      throw new AppError("User Id requiured", 400);
    }

    const project = await Project.findById(projetId);
    if (!project) {
      throw new AppError("Invalid Project ", 400);
    }

    const deploy = await Deployment.findOne({
      projectId: projetId,
      status: "completed",
      version:version
    })


    if (!deploy) {
      throw new AppError("Version not Supported Or Version not Success", 400);
    }

    const projectname = project.name;
    await switchVersion(projectname, version);

    project.currentVersion = version;
    await project.save();

    return res.status(200).json({
      message: "Version switched successfully",
      activeVersion: version,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyProjects = async (req, res, next) => {
  try {
    const userId = req.cookies.userId;
    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User Doesn't Exist", 400);
    }

    const projects = await Project.find({
      userId: userId,
    });
    console.log("projects :", projects);

    return res
      .status(200)
      .json({
        msg: "Projects fetched successfully",
        success: true,
        projects: projects,
      });
  } catch (error) {
    next(error);
  }
};
