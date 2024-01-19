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
      const eduCollection=client.db("LinkUp").collection("education");
      const skillsCollection=client.db("LinkUp").collection("skills");
      //user related apis
      app.post('/users',async(req,res)=>{
        console.log("in side the backend /users")
        const user = req.body;
       // console.log(user);
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
      //  console.log('log in')
        const id=req.params.id;
             const { first_name, last_name,additional_name,headline,education,country,city} = req.body;
           //  console.log(req.body)
     //   console.log('user admin id => ',id);
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
          },
        };
  
        const result = await userCollection.updateOne(filter,updateDoc);
        res.send(result);
        
      })
      
      
      
       //user related apis

      ///Education api----------------------------

      app.get('/education', async (req, res) => {
        const result = await eduCollection.find().toArray();
       res.send(result);
      })
      

      app.get('/education/:uid', async (req, res) => {
      //  console.log('hit for collect all edu with uid')
        const query = { uid:req.params.uid };
        const education = await eduCollection.find(query).toArray();
     //   console.log(education);
        res.send(education);
        // res.send(req.params.uid); .

    });
      
      //INSERT OR ADD ONE EDUCATION DATA BY POST
      app.post('/education',async(req,res)=>{
       // console.log("in side the backend /users")
        const  data = req.body;
     //   console.log(data);
        const result = await eduCollection.insertOne(data);
        res.send(result);
  
      });
    
      // UPDATE OEN EDU DATA BY PATCH
      app.patch('/education/:_id', async (req, res) => {
       /// console.log('hit edit id ',req.params._id)
        const educationId = req.params._id;
        const updateData = req.body;
    
        try {
            const result = await eduCollection.updateOne(
                { _id: new ObjectId(educationId) },
                { $set: updateData }
            );
    
            if (result.modifiedCount > 0) {
              console.log('update done')
                res.status(200).json({ message: 'Education record updated successfully' });
            } else {
              console.log('update not done')
                res.status(404).json({ message: 'Education record not found' });
            }
        } catch (error) {
            console.error('Error updating education record', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    });

    // DELETE ONE EDUCATION INFO BY ID
    app.delete('/education/:id',async(req,res)=>{
     /// console.log('hit delete');
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await eduCollection.deleteOne(query);
      res.send(result);
    })

      // SKILLS START ---------------------------//////

        // INSERT OR ADD ONE skills DATA BY POST
        app.post('/skills',async(req,res)=>{
          console.log("in side the backend /skills ")
          const  data = req.body;
          console.log(data);
          const result = await skillsCollection.insertOne(data);
          res.send(result);

        });
      //SKILLS DATA COLLECT BY GET METHOD
        app.get('/skills/:uid', async (req, res) => {
          //  console.log('hit for collect all edu with uid')
            const query = { uid:req.params.uid };
            const skills = await skillsCollection.find(query).toArray();
           console.log("RESULT ==> ",skills);
            res.send(skills);
            // res.send(req.params.uid); .
    
        });
        // UPDATE one skill DATA BY PATCH
      app.patch('/skills/:_id', async (req, res) => {
         console.log('shills hit edit id ',req.params._id)
       
         const skillsId = req.params._id;
         const updateData = req.body;
         delete updateData._id;
         console.log("data come => ",updateData)
     
         try {
             const result = await skillsCollection.updateOne(
                 { _id: new ObjectId(skillsId) },
                 { $set: updateData }
             );
     
             if (result.modifiedCount > 0) {
               console.log('update done')
                 res.status(200).json({ message: 'Education record updated successfully' });
             } else {
               console.log('update not done')
                 res.status(404).json({ message: 'Education record not found' });
             }
         } catch (error) {
             console.error('Error updating education record', error);
             res.status(500).json({ message: 'Internal server error' });
         }
     });

         // DELETE ONE skill INFO BY ID
    app.delete('/skills/:id',async(req,res)=>{
       console.log('hit delete of skills');
       const id = req.params.id;
       const query = { _id: new ObjectId(id) };
       const result = await skillsCollection.deleteOne(query);
       res.send(result);
     })


     //----------end-----------------///

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

