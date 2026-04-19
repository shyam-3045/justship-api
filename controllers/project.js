const AppError = require("../errors/AppError");
const Project = require("../models/projectSchema");

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

    

  } catch (error) {
    next(error);
  }
};
