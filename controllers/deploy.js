const logger = require("../config/logger");
const { deployProjectService } = require("../services/deploy");

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
