const { deployProject, reDeployProject } = require("../controllers/deploy")

const express = require("express")
const router = express.Router()

router.post('/deploy',deployProject)
router.post('/redeploy',reDeployProject)

module.exports = router