const express = require("express")
const { getRepos, getBranch } = require("../controllers/repos")
const router = express.Router()

router.get("/repos",getRepos)
router.get('/github/branches',getBranch)

module.exports = router