const express = require("express")
const { setVersion, getWebHook, getMyProjects, getMyEnv, updateEnv } = require("../controllers/project")
const router = express.Router()

router.post('/project/set-active-version',setVersion)
router.get('/getProjects',getMyProjects)
router.get('/project/:projectId/env',getMyEnv)
router.post('/project/:projectId/env',updateEnv)
module.exports = router