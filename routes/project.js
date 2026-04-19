const express = require("express")
const { setVersion, getWebHook, getMyProjects } = require("../controllers/project")
const router = express.Router()

router.post('/project/set-active-version',setVersion)
//router.post('/webhook/Github',getWebHook)
//get my projects 
router.get('/getProjects',getMyProjects)
module.exports = router