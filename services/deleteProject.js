const Project = require("../models/projectSchema")
const User = require('../models/userSchema')
const Log = require('../models/logsSchema')
const Deployment = require('../models/deploymentModel')
const deleteS3Folder = require("../utils/deleteS3Folder")
const AppError = require("../errors/AppError")
const { deleteWebhook } = require("../utils/deleteWbhook")
exports.deleteProjectService = async (projectId, userId) => {
  
  const project = await Project.findOne({ _id: projectId, userId })

  if (!project) {
    throw new AppError("Project not found or unauthorized",400)
  }

  const projectSlug = project.name

  const user = await User.findById(userId)

  const accessToken = user.accessToken
  const repoFullName=project.repoFullName


  await deleteS3Folder(projectSlug)

  
  await Deployment.deleteMany({ projectId })

  
  await Log.deleteMany({ projectId })


  await Project.deleteOne({ _id: projectId })

  await deleteWebhook(repoFullName, accessToken)
}