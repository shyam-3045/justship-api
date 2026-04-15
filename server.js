const express = require("express")
const cors=require("cors")
const dotenv = require("dotenv")
const globalErrorHandler = require("./middlewares/globalErrorHandler")
const ConnectDb = require("./config/mongoDbConnection")
const app = express()

const PORT = 8080
dotenv.config()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
ConnectDb()

app.get('/health',(req,res)=>
{
    res.status(200).send({msg : "Server is Running "})
})


app.use('/api/v1',require('./routes/deploy'))
app.use(globalErrorHandler)

app.listen(PORT,()=>
{
    console.log(`Server is running at Port :${PORT}`)
})

