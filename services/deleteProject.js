const Project = require("../models/projectSchema")
const Log = require('../models/logsSchema')
const Deployment = require('../models/deploymentModel')
const deleteS3Folder = require("../utils/deleteS3Folder")
const AppError = require("../errors/AppError")
exports.deleteProjectService = async (projectId, userId) => {
  
  const project = await Project.findOne({ _id: projectId, userId })

  if (!project) {
    throw new AppError("Project not found or unauthorized",400)
  }

  const projectSlug = project.name


  await deleteS3Folder(projectSlug)

  
  await Deployment.deleteMany({ projectId })

  
  await Log.deleteMany({ projectId })


  await Project.deleteOne({ _id: projectId })
}