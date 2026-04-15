const mongoose = require("mongoose")


const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  currentVersion: { type: Number, default: 0 },
  repoUrl: { type: String, required: true },
  framework: String,
  subfolder: String,

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Project",projectSchema)