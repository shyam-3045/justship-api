const Project = require("../models/projectSchema");
const AppError = require("../errors/AppError");
const logger = require("../config/logger");

exports.getNextVersion= async (projectId)=>  {
  try {
    logger.info(`projectId:${projectId}`)
    const project = await Project.findByIdAndUpdate(
      projectId,
      { $inc: { lastVersion: 1 } },
      { new: true }
    );

    if (!project) {
      throw new AppError("Project not found", 404);
    }

    return project.lastVersion;

  } catch (error) {
    console.error("REAL ERROR:", error);
    throw new AppError("Cannot get next version");
  }
};

