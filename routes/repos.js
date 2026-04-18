const express = require("express")
const { getRepos } = require("../controllers/repos")
const router = express.Router()

router.get("/repos",getRepos)

module.exports = router