const { deployProject, reDeployProject, getMyDeployments, getLogs } = require("../controllers/deploy")

const express = require("express")
const router = express.Router()

router.post('/deploy',deployProject)
router.post('/redeploy',reDeployProject)
router.get('/getDeployments/:projectId',getMyDeployments)
router.get('/logs/:jobId',getLogs)

module.exports = router