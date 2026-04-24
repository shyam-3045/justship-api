const express = require("express")
const { getRepos, getBranch, gitHubWebhook } = require("../controllers/repos")
const router = express.Router()

router.get("/repos",getRepos)
router.get('/github/branches',getBranch)
router.post('/webhook/github',gitHubWebhook)

module.exports = router