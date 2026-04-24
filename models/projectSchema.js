const mongoose = require("mongoose");

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  currentVersion: { type: Number, default: 0 },
  lastVersion: {
    type: Number,
    default: 0,
  },
  branch: {
    type: String,
    required: true,
  },
  autoDeploy : {
    type : Boolean ,
    default : true

  },
  repoFullName  :{
    type : String,
    required :true
  },
  repoUrl: { type: String, required: true },
  framework: String,
  subfolder: String,
  url: String,
  env: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Project", projectSchema);
