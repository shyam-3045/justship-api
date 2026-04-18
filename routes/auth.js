const express = require("express")
const { githubCallback, gitLogin, getMe, logout } = require("../controllers/auth")
const router = express.Router()

router.get('/github/callback',githubCallback)
router.get('/github',gitLogin)
router.get('/me',getMe)
router.get('/logout',logout)

module.exports = router