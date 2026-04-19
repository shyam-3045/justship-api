const AppError = require("../errors/AppError");
const Deployment = require("../models/deploymentModel");
const Project = require("../models/projectSchema");
const { switchVersion } = require("../utils/switchVersion");

exports.setVersion = async (req, res, next) => {
  try {
    const { projetId, version, userId } = req.body;
    //const userId = req.cookies.userId

    if(!projetId)
    {
        throw new AppError("Project Id requiured",400)
    }
    if(!version)
    {
        throw new AppError("version No requiured",400)
    }
    if(!userId)
    {
        throw new AppError("User Id requiured",400)
    }

    const project = await Project.findById(projetId)
     if(!project)
    {
        throw new AppError("Invalid Project ",400)
    }

    const deploy = await Deployment.findOne({
      projectId:projetId,
      version:version,
      status:'success'
    })

    if(!deploy)
    {
      throw new AppError("Version not Supported Or Version not Success",400)
    }

    const projectname = project.name
    await switchVersion(projectname,version)

    project.currentVersion=version
    await project.save()

    return res.status(200).json({
      message: "Version switched successfully",
      activeVersion: version
    });


  } catch (error) {
    next(error);
  }
};


exports.getWebHook=async(req,res)=>
{
  
}