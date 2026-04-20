const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Project",
    required: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  version: { type: Number, required: true },

  buildId: { type: String, required: true, unique: true },

  status: {
    type: String,
    enum: [
      "queued",
      "cloning",
      "analysing",
      "building",
      "uploading",
      "completed",
      "failed",
    ],
    default: "queued",
  },

  s3Path: String,
  cdnUrl: String,

  env: { type: Object },

  createdAt: { type: Date, default: Date.now },
  completedAt: Date,
});

module.exports = mongoose.model("Deployment", deploymentSchema);
