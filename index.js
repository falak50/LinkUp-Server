const app = require('./middleware');
const client = require('./db');
const port = process.env.PORT || 5000;
require('dotenv').config();

const { Server } = require("socket.io");
const http = require("http");
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rhxzu.mongodb.net/?retryWrites=true&w=majority`;

async function saveMessage(senderId, receiverId, message) {
  console.log('save massage')
  try {
    const db = client.db('LinkUp');
    const messagesCollection = db.collection('chat');
    const chat_id = [senderId, receiverId].sort().join('_');
    const payload = {
      chat_id,
      senderId:senderId,
      receiverId:receiverId,
      message,
      timestamp: new Date(),
    }

    const result = await messagesCollection.insertOne(payload);
    console.log('Message saved:', result.insertedId);
    console.log('payload ',payload)
  } catch (err) {
    console.error('Error saving message:', err);
  }
}

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join_room", ({ userId }) => {
    const roomId = userId;
    socket.join(roomId);
   console.log(`User ${userId} joined room ${roomId}`);
  });

  socket.on("send_message", async ({ otherUserId, message,senderId }) => {
    const roomId = otherUserId;
    socket.to(roomId).emit("receive_message", { message, senderId });
    console.log(`Message sent from ${senderId} to ${otherUserId} in room ${roomId}`);

    // Save message to MongoDB
    await saveMessage(senderId, otherUserId, message);
  });
});

const usersRouter = require('./routes/users');
const educationRouter = require('./routes/education');
const skillsRouter = require('./routes/skills');
const postsRouter = require('./routes/posts');
const productRouter = require('./routes/products')
const commentsRouter = require('./routes/comments');
const chatsRouter = require('./routes/chats');
const jobsRouter = require('./routes/jobs');

app.use('/users', usersRouter);
app.use('/education', educationRouter);
app.use('/skills', skillsRouter);
app.use('/posts', postsRouter);
app.use('/comments', commentsRouter);
app.use('/chats',chatsRouter);
app.use('/jobs',jobsRouter);
app.use('/products', productRouter);


app.get('/', (req, res) => {
  res.send('LinkUp is running finally');
});

server.listen(port, () => {
  console.log(`LinkUp running on port ${port}`);
});

async function connectToDb() {
  try {
    await client.connect();
    console.log("Connected to MongoDB! ");
  } catch (err) {
    console.error('Error connecting to MongoDB:', err);
  }
}

connectToDb();
