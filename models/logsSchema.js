const mongoose = require("mongoose");

const deploymentSchema = new mongoose.Schema(
  {
    jobId: { type: String, required: true, unique: true ,index:true},
    logs: { type: [String], default: [] },
    status: {
      type: String,
      enum: [
        "cloning",
        "analysing",
        "building",
        "uploading",
        "completed",
        "failed",
      ],
      default: "cloning",
    },
    url: { type: String, default: "" },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Log", deploymentSchema);
