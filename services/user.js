const logger = require("../config/logger");
const AppError = require("../errors/AppError");
const User = require("../models/userSchema");

exports.storeUser = async (data) => {
  const user = await User.find({ email: data.email });
  if (!user) {
    const User = await User.create({
      email: data.email,
      githubId: data.githubId,
      username: data.username,
      accessToken: data.accessToken,
      avatar: data.avatar,
    });

    return User._id;
    console.log(user)
  }
  const userdet = await User.findOneAndUpdate(
  { githubId: data.githubId },
  {
    username: data.username,
    email: data.email,
    avatar: data.avatar,
    accessToken: data.accessToken,
  },
  {
    upsert: true,
    new: true,
  }
);

  logger.info("User Aldready Exists in DB");
  return userdet._id;
};
