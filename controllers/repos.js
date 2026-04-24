const { default: axios } = require("axios");
const AppError = require("../errors/AppError");
const User = require("../models/userSchema");
const Project = require("../models/projectSchema");
const queue = require("../builder/queue");
const { customAlphabet } = require("nanoid");
const { userSockets, getIO } = require("../sockets/socket");

const nanoidAlpha = customAlphabet(
  "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
  5,
);

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

exports.gitHubWebhook = async (req, res, next) => {
  try {
    const event = req.headers["x-github-event"];
    if (event !== "push") return res.status(200).end();
    const jobId = nanoidAlpha();

    console.log("Webhook triggered");

    const payload = req.body;

    const repoFullName = payload.repository.full_name;
    const branch = payload.ref.split("/").pop();
    const commitHash = payload.after;

    const project = await Project.findOne({ repoFullName });
    if (!project) return res.status(200).end();
    if (!project.autoDeploy) return res.status(200).end();
    if (project.branch !== branch) return res.status(200).end();

    const waitingJobs = await queue.getJobs(["waiting"]);

    const alreadyQueued = waitingJobs.find(
      (job) => job.data.projectId === project._id.toString(),
    );

    if (alreadyQueued) {
      return res.status(200).json({ message: "Already queued" });
    }

    const queueRes = await queue.add("deploy", {
      repoUrl: project.repoUrl,
      projectName: project.name,
      projectId: project._id,
      userId: project.userId,
      branch: project.branch,
      hash: commitHash,
      jobId,
      buildPath: project.subfolder,
    });
    const io = getIO();

    if (!io) {
      console.log("⚠️ IO not ready");
      return res.status(200).end();
    }

    const socketId = userSockets.get(project.userId.toString());
    console.log("Map:", userSockets);
    console.log("SocketId:", socketId);

    console.log("added to queue", queueRes);
    if (socketId) {
      io.to(socketId).emit("deployment_triggered", {
        projectId: project._id,
        jobId,
        commitHash,
      });

      console.log("Notification sent to user:", project.userId);
    } else {
      console.log("❌ No socket found for user");
    }

    return res.status(200).json({ message: "Deployment triggered" });
  } catch (error) {
    next(error);
  }
};
