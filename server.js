const express = require("express")
const cors=require("cors")
const dotenv = require("dotenv")
const globalErrorHandler = require("./middlewares/globalErrorHandler")
const ConnectDb = require("./config/mongoDbConnection")
const cookieParser = require("cookie-parser")
const app = express()
const http = require("http")
const {Server}=require('socket.io')
const initSubscriber = require("./redis/subscriber")
const { initSocket } = require("./sockets/socket")

const PORT = 8080
dotenv.config()

const server = http.createServer(app)
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

initSocket(io);
initSubscriber(io);
app.use(cors({
    origin : process.env.ENV == "dev" ? process.env.FRONTEND_URL : process.env.FRONTEND_URL_PROD,
    credentials:true
}))
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({extended:true}))
ConnectDb()

app.get('/health',(req,res)=>
{
    res.status(200).send({msg : "Server is Running "})
})


app.use('/api/v1',require('./routes/deploy'))
app.use('/api/v1/auth',require("./routes/auth"))
app.use("/api/v1",require('./routes/repos'))
app.use("/api/v1",require("./routes/project"))

app.use(globalErrorHandler)

server.listen(PORT,()=>
{
    console.log(`Server is running at Port :${PORT}`)
})


