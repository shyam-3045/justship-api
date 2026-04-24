const express = require("express")
const { setVersion, getWebHook, getMyProjects, getMyEnv, updateEnv, deleteProject, setAutoDeploy } = require("../controllers/project")
const router = express.Router()

router.post('/project/set-active-version',setVersion)
router.get('/getProjects',getMyProjects)
router.get('/project/:projectId/env',getMyEnv)
router.post('/project/:projectId/env',updateEnv)
router.delete('/projects/:projectId',deleteProject)
router.patch('/projects/:projectId/auto-deploy',setAutoDeploy)
module.exports = router