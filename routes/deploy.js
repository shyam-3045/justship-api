const { deployProject, reDeployProject, getMyDeployments } = require("../controllers/deploy")

const express = require("express")
const router = express.Router()

router.post('/deploy',deployProject)
router.post('/redeploy',reDeployProject)
// get my deployments 
router.get('/getDeployments/:projectId',getMyDeployments)

module.exports = router