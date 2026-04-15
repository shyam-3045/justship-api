const mongoose = require("mongoose")


const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  githubId: String,

  projectLimit: { type: Number, default: 5 },
  isAllowed: { type: Boolean, default: true },

  createdAt: { type: Date, default: Date.now }
});

module.exports=mongoose.model('User',userSchema)