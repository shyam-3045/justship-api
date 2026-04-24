const { default: axios } = require("axios");
const logger = require("../config/logger");
const { storeUser } = require("../services/user");
const User = require("../models/userSchema")

exports.gitLogin = async (req, res, next) => {
  try {
    const params = new URLSearchParams({
      client_id: process.env.GITHUB_CLIENT_ID,
      scope: "read:user user:email repo",
    });

    res.redirect(
      `https://github.com/login/oauth/authorize?${params.toString()}`,
    );
  } catch (error) {
    next(error);
  }
};

exports.githubCallback = async (req, res, next) => {
  const code = req.query.code;
  try {
    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      },
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const user = userRes.data;

    const emailRes = await axios.get("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const primaryEmail = emailRes.data.find((e) => e.primary)?.email

    

    const userData = {
      githubId: user.id,
      username: user.login,
      email: primaryEmail,
      accessToken:accessToken,
      avatar:user.avatar_url
    }

    console.log({githubId: user.id,
      username: user.login,
      email: primaryEmail,
      accessToken,
    avatar:user.avatar_url});
    
    const userId = await storeUser(userData)
    console.log(userId)


    res.cookie("userId",userId, {
      httpOnly: true,
      sameSite: "lax",
    })

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    next(error);
  }
};


exports.getMe=async(req,res)=>
{
  try {
    const userId = req.cookies.userId;

    if (!userId) {
      return res.status(401).json(null)
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json(null)
    }

    res.json({
      userId:userId,
      name: user.username,
      avatarUrl: user.avatar,
    });

  } catch (err) {
    res.status(500).json(null);
  }
}

exports.logout=(req,res)=>
{
  res.clearCookie("userId");
  return res.status(200).json({ message: "Logged out successfully" })
}