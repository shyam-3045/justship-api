const { default: axios } = require("axios");
const AppError = require("../errors/AppError");
const User = require("../models/userSchema");

exports.getRepos = async (req, res, next) => {
  try {
    const userId = req.cookies.userId;

    if (!userId) {
      throw new AppError("Unauthorized", 401);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User Not found", 401);
    }

    const response = await axios.get("https://api.github.com/user/repos", {
      headers: {
        Authorization: `Bearer ${user.accessToken}`,
      },
      params: {
        sort: "updated",
        per_page: 50,
        affiliation: "owner",
      },
    });

    const repos = response.data
      .filter((repo) => !repo.private)
      .map((repo) => ({
        id: repo.id,
        name: repo.name,
        fullName: repo.full_name,
        private: repo.private,
      }));

    res.status(200).json(repos);
  } catch (err) {
    next(err);
  }
};

exports.getBranch = async (req, res, next) => {
  try {
    const userId = req.cookies.userId;
    const { repo } = req.query;

    if (!userId) throw new AppError("Unauthorized", 401);
    if (!repo) throw new AppError("Repo is required", 400);

    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 401);

    const response = await axios.get(
      `https://api.github.com/repos/${repo}/branches`,
      {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
        params: {
          per_page: 50,
        },
      },
    );

    const branches = response.data.map((b) => ({
      name: b.name,
    }));

    res.status(200).json(branches);
  } catch (err) {
    next(err);
  }
};
