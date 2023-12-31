const express = require('express');
const app = express();
const cors =  require('cors')
const port = process.env.PORT || 5000;
require('dotenv').config()

//middleware 
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rhxzu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
    try {
      // Connect the client to the server	(optional starting in v4.7)
      await client.connect();
      
      const menuC=client.db("bistroDb").collection("menu");
      const usersCollection=client.db("LinkUp").collection("users");
      //user related apis
      app.post('/users',async(req,res)=>{
        console.log("in side the backend /users")
        const user = req.body;
        console.log(user);
        const query = {email:user.email};
        const existingUser = await usersCollection.findOne(query);
        // console.log('existing user',existingUser);
        if(existingUser){
          return res.send({message:'user already exists'});
        }
        const result = await usersCollection.insertOne(user);
        res.send(result);
  
      });
      


       //user related apis
      app.get('/menu',async(req,res)=>{
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
app.listen(port,()=>{
    console.log(`LinkUp running on port ${port}`)
})


/** 
 * -------------------
 * naming convention
 * -------------------
 * users:userCoolection
 * app.get('users')
 * app.get('/users/:id')
 * app.post('/users') // add
 * app.patch('/users/:id') only update
 * app.put('users/:id') // create and update if already have only update
 * app.delete('users/:id')
*/