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
      
      //const menuC=client.db("bistroDb").collection("menu");
      const userCollection=client.db("LinkUp").collection("users");
      //user related apis
      app.post('/users',async(req,res)=>{
        console.log("in side the backend /users")
        const user = req.body;
        console.log(user);
        const query = {email:user.email};
        const existingUser = await userCollection.findOne(query);
        // console.log('existing user',existingUser);
        if(existingUser){
          return res.send({message:'user already exists'});
        }
        const result = await userCollection.insertOne(user);
        res.send(result);
  
      });

      
      // app.get('/users', async (req, res) => {
      //   //  const result = await userCollection.find().toArray();
        
      //    res.send(result);
      // })

      app.get('/users',async(req,res)=>{
        const result = await userCollection.find().toArray();
        res.send(result);
      })

      app.get('/users/:email', async (req, res) => {
        const query = { email: req.params.email };
        const user = await userCollection.findOne(query);
        // const user =req.params.email;  
        res.send(user);
      })
      app.patch('/users/:id',async(req,res)=>{
        console.log('log in')
        const id=req.params.id;
             const { first_name, last_name,additional_name,headline,education,country,city} = req.body;
             console.log(req.body)
        console.log('user admin id => ',id);
        const filter = {_id:new ObjectId(id)};
        const updateDoc = {
          $set: {
                  first_name: first_name,
                  last_name: last_name,
                  additional_name: additional_name,
                  headline: headline,
                  education: education,
                  country: country,
                  city: city,
                  ok:'not ok 1'
          },
        };
  
        const result = await userCollection.updateOne(filter,updateDoc);
        res.send(result);
        
      })
      // app.post('/users/:email', async (req, res) => {
      //   console.log('in email  post')
      //   const emailToUpdate = req.params.email;
      //   console.log("email check ",emailToUpdate)
      //   const { first_name, last_name,additional_name,headline,education,country,city} = req.body;
      //   console.log(req.body);
  
      //     userCollection.updateOne(
      //       { email: emailToUpdate },
      //       {
      //         $set: {
      //           first_name: first_name,
      //           last_name: last_name,
      //           additional_name: additional_name,
      //           headline: headline,
      //           education: education,
      //           country: country,
      //           city: city,
      //         },
      //       }
      //     ).then(res=>{

      //       console.log('res',res)

      //     });
      //     // console.log(result);
  
      //     // if (result.matchedCount === 0) {
      //     //   return res.status(404).send({ message: 'User not found' });
      //     // }
      //     // console.log('res.send({ message: ')
      //     res.send({ message: 'User updated successfully'});
      //   } )
      
      
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


