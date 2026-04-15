const queue = require("../builder/queue")



exports.addJobToQ = async(data)=>
{
    const jobDetails=await queue.add("deploy-queue",data,{
        attempts:1,
        backoff:{
            type:"exponential",
            delay:2000
        }
    })

    return jobDetails.id
}