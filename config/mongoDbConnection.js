const mongoose = require("mongoose")
const logger = require("./logger")

const ConnectDb = async()=>
{
    await mongoose.connect(process.env.MONGO_URL)
    .then(()=>logger.info("Connected To mongoDB"))
    .catch((error)=>logger.error(`Error while connecting MongoDB : ${error}`)) 
}

module.exports=ConnectDb