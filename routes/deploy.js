const { deployProject } = require("../controllers/deploy")

const express = require("express")
const router = express.Router()

router.post('/deploy',deployProject)

module.exports = router