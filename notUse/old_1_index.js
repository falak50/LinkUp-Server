//middleware 
const app = require('./middleware');

const client = require('./db');
const port = process.env.PORT || 5000;
require('dotenv').config()


const { Server } = require("socket.io");
const http = require("http")
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// io.on("connection", (socket) => {
//   console.log(`User Connected: ${socket.id}`);

//   socket.on("join_room", (data) => {
//     socket.join(data);
//   });

//   socket.on("send_message", (data) => {
//     socket.to(data.room).emit("receive_message", data);
//   });
  
// });

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", ({ userId }) => {
    // const roomId = [userId, otherUserId].sort().join('_');
    const roomId =userId
    socket.join(roomId);
    console.log(`User ${userId} joined room ${roomId}`);
  });

  socket.on("send_message", ({ otherUserId, message }) => {
    // const roomId = [userId, otherUserId].sort().join('_');
    const roomId = otherUserId;
    const userId = 'falak is checking ';
    socket.to(roomId).emit("receive_message", { message, sender: userId });
    console.log(`Message sent from ${userId} to ${otherUserId} in room ${roomId}`);
  });
});

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rhxzu.mongodb.net/?retryWrites=true&w=majority`;


const usersRouter = require('./routes/users');
const educationRouter = require('./routes/education');
const skillsRouter = require('./routes/skills');
const postsRouter = require('./routes/posts');



async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      
      //const menuC=client.db("bistroDb").collection("menu");
      const userCollection=client.db("LinkUp").collection("users");
      const eduCollection=client.db("LinkUp").collection("education");
      const skillsCollection=client.db("LinkUp").collection("skills");
      const postsCollection=client.db("LinkUp").collection("posts");

      app.use('/users', usersRouter);   
      app.use('/education', educationRouter);
      app.use('/skills', skillsRouter);
      app.use('/posts', postsRouter);
     
      
     app.get('/falak',async(req,res)=>{
      const uid = '65b6a8e07b0dcc08436c9831';

      const result = "falak bai is a boosss"
      res.send(result);
    })
      app.get('/menu',async(req,res)=>{
        // const uid = 65b6a8e07b0dcc08436c9831;

        const result = "falak bai is a boosss"
        res.send(result);
      })
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
      // Ensures that the client will close when you finish/error
      // await client.close(); // need comnt out
    }
  }
  run().catch(console.dir);
  


app.get('/',(req,res)=>{
    res.send('LinkUp is running finally')
})
server.listen(port,()=>{
    console.log(`LinkUp running on port ${port}`)
})


