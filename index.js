//middleware 
const app = require('./middleware');
// const express = require('express');
// const cors =  require('cors')
// const app = express();
// app.use(cors());
// app.use(express.json());
// app.use(express.static('uploads'))
// midleware end 
const client = require('./db');
const port = process.env.PORT || 5000;
require('dotenv').config()
// const multer = require('multer');
// const path = require('path')
// const { v4: uuidv4 } = require('uuid');
// const fs = require('fs'); 

//middleware  
/// this image fun


// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/images');
//   },
//   filename: (req, file, cb) => {
//     const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
//     cb(null, uniqueFilename);
//   },
// });

// const upload = multer({ storage: storage });

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rhxzu.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
// const client = new MongoClient(uri, {
//   serverApi: {
//     version: ServerApiVersion.v1,
//     strict: true,
//     deprecationErrors: true,
//   }
// });

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
     

      // app.get('/users',async(req,res)=>{
      //   const result = await userCollection.find().toArray();
      //   res.send(result);
      // })

      //user related apis
      // app.post('/users',async(req,res)=>{
      //   // console.log("in side the backend /users")
      //   const user = req.body;
      //  // console.log(user);
      //   const query = {email:user.email};
      //   const existingUser = await userCollection.findOne(query);
      //   // console.log('existing user',existingUser);
      //   if(existingUser){
      //     return res.send({message:'user already exists'});
      //   }
      //   const result = await userCollection.insertOne(user);
      //   res.send(result);
      // });

      
    //   // app.get('/users', async (req, res) => {
    //   //   //  const result = await userCollection.find().toArray();
        
    //   //    res.send(result);
    //   // })

  

    //   app.get('/users/:email', async (req, res) => {
    //     const query = { email: req.params.email };
    //     const user = await userCollection.findOne(query);
    //     // const user =req.params.email;  
    //     res.send(user);
    //   })
    //   app.patch('/users/:id',async(req,res)=>{
    //   //  console.log('log in')
    //     const id=req.params.id;
    //          const { first_name, last_name,additional_name,headline,education,country,city} = req.body;
    //        //  console.log(req.body)
    //  //   console.log('user admin id => ',id);
    //     const filter = {_id:new ObjectId(id)};
    //     const updateDoc = {
    //       $set: {
    //               first_name: first_name,
    //               last_name: last_name,
    //               additional_name: additional_name,
    //               headline: headline,
    //               education: education,
    //               country: country,
    //               city: city,
    //       },
    //     };
  
    //     const result = await userCollection.updateOne(filter,updateDoc);
    //     res.send(result);
        
    //   })
      
      
      
       //user related apis

      ///Education api----------------------------

    //   app.get('/education', async (req, res) => {
    //     const result = await eduCollection.find().toArray();
    //    res.send(result);
    //   })
      

    //   app.get('/education/:uid', async (req, res) => {
    //   //  console.log('hit for collect all edu with uid')
    //     const query = { uid:req.params.uid };
    //     const education = await eduCollection.find(query).toArray();
    //  //   console.log(education);
    //     res.send(education);
    //     // res.send(req.params.uid); .

    // });
      
    //   //INSERT OR ADD ONE EDUCATION DATA BY POST
    //   app.post('/education',async(req,res)=>{
    //    // console.log("in side the backend /users")
    //     const  data = req.body;
    //  //   console.log(data);
    //     const result = await eduCollection.insertOne(data);
    //     res.send(result);
  
    //   });
    
    //   // UPDATE OEN EDU DATA BY PATCH
    //   app.patch('/education/:_id', async (req, res) => {
    //    /// console.log('hit edit id ',req.params._id)
    //     const educationId = req.params._id;
    //     const updateData = req.body;
    
    //     try {
    //         const result = await eduCollection.updateOne(
    //             { _id: new ObjectId(educationId) },
    //             { $set: updateData }
    //         );
    
    //         if (result.modifiedCount > 0) {
    //           console.log('update done')
    //             res.status(200).json({ message: 'Education record updated successfully' });
    //         } else {
    //           console.log('update not done')
    //             res.status(404).json({ message: 'Education record not found' });
    //         }
    //     } catch (error) {
    //         console.error('Error updating education record', error);
    //         res.status(500).json({ message: 'Internal server error' });
    //     }
    // });

    // // DELETE ONE EDUCATION INFO BY ID
    // app.delete('/education/:id',async(req,res)=>{
    //  /// console.log('hit delete');
    //   const id = req.params.id;
    //   const query = { _id: new ObjectId(id) };
    //   const result = await eduCollection.deleteOne(query);
    //   res.send(result);
    // })

      // SKILLS START ---------------------------//////

    //     // INSERT OR ADD ONE skills DATA BY POST
    //     app.post('/skills',async(req,res)=>{
    //      // console.log("in side the backend /skills ")
    //       const  data = req.body;
    //      // console.log(data);
    //       const result = await skillsCollection.insertOne(data);
    //       res.send(result);

    //     });
    //   //SKILLS DATA COLLECT BY GET METHOD
    //     app.get('/skills/:uid', async (req, res) => {
    //       //  console.log('hit for collect all edu with uid')
    //         const query = { uid:req.params.uid };
    //         const skills = await skillsCollection.find(query).toArray();
    //      //  console.log("RESULT ==> ",skills);
    //         res.send(skills);
    //         // res.send(req.params.uid); .
    
    //     });
    //     // UPDATE one skill DATA BY PATCH
    //   app.patch('/skills/:_id', async (req, res) => {
    //    //  console.log('shills hit edit id ',req.params._id)
       
    //      const skillsId = req.params._id;
    //      const updateData = req.body;
    //      delete updateData._id;
    //     // console.log("data come => ",updateData)
     
    //      try {
    //          const result = await skillsCollection.updateOne(
    //              { _id: new ObjectId(skillsId) },
    //              { $set: updateData }
    //          );
     
    //          if (result.modifiedCount > 0) {
    //            console.log('update done')
    //              res.status(200).json({ message: 'Education record updated successfully' });
    //          } else {
    //            console.log('update not done')
    //              res.status(404).json({ message: 'Education record not found' });
    //          }
    //      } catch (error) {
    //          console.error('Error updating education record', error);
    //          res.status(500).json({ message: 'Internal server error' });
    //      }
    //  });

    //      // DELETE ONE skill INFO BY ID
    // app.delete('/skills/:id',async(req,res)=>{
    //  //  console.log('hit delete of skills');
    //    const id = req.params.id;
    //    const query = { _id: new ObjectId(id) };
    //    const result = await skillsCollection.deleteOne(query);
    //    res.send(result);
    //  })

 // SKILLS POST end---------------------------//////

        // INSERT OR ADD ONE POST DATA BY POSTmethod
      //   app.post('/posts',upload.array('file'),async(req,res)=>{
      //  //   console.log("in side the backend /posts ")
      //     const files = req.files || [];
    
      //     // Process files if present
      //     const imgUrls = files.map(file => {
      //       console.log("pic link = ", file.filename);
      //       return file.filename;
      //     });
      //    // console.log(imgUrls)
      //     req.body.imgUrls = imgUrls;
      //   //  console.log("all in one -> ",req.body);
        
      //     // Process other ata in the body
      //   //  console.log("des : ", req.body.description);
      //   //  console.log("des : ", req.body.uid);
    
      //     const  data = req.body;
      //   //  console.log(" fianl data ",data);
      //     const result = await postsCollection.insertOne(data);
      //     res.send(result);

      //   });

      //   //SKILLS DATA COLLECT BY GET METHOD
      //   app.get('/myposts/:uid', async (req, res) => {
      //      console.log('hit get post  with uid')
      //       const query = { uid:req.params.uid };
      //       const myposts = await postsCollection.find(query).toArray();
      //      console.log("RESULT ==> ",myposts);
      //       res.send(myposts);
      //       // res.send(req.params.uid); .
    
      //   });

// --------------------------------------------------------------------
    // Profile image change start////
    // app.post('/profileimg',  async(req, res) => {
    //   console.log('come in profileimg');
     
    //   return res.json('hello');
    // });

    // app.post('/profileimg', upload.array('file'), async(req, res) => {
    //   console.log('come in profileimg');
    //   const files = req.files || [];
    
    //   // Process files if present
    //   const imgUrls = files.map(file => {
    //     console.log("pic link = ", file.filename);
    //     return file.filename;
    //   });
    //   const ProfileImgURL = imgUrls[0];
    //   req.body.imgUrls = imgUrls;
    
    //   const id = req.body.uid;
    //   console.log("uid", id);
    //   const filter = { _id: new ObjectId(id) };
    
    //   const updateDoc = {
    //     $set: {
    //       ProfileImgURL: ProfileImgURL,
    //     },
    //   };
    
    //   const result = await userCollection.updateOne(filter, updateDoc)
    //   //  => {
    //   //   if (err) {
    //   //     console.error('Error updating profile image:', err);
    //   //     return res.status(500).json({ message: 'Internal server error' });
    //   //   }
    
    //   //   console.log('Update result:', result);
    
       
    //   // });

    //   return res.json(result);
    // });
    // DELETE user profile image by UID
// app.delete('/profilePicdelete/:uid', async (req, res) => {
//   const uid = req.params.uid;
//   console.log(uid);
//   const filter = { _id: new ObjectId(uid) };

//   const existingUser = await userCollection.findOne(filter);

//   if (!existingUser) {
//     return res.status(404).json({ message: 'User not found' });
//   }
//   if (!existingUser.ProfileImgURL) {
//     return res.status(404).json({ message: 'NOT ProfileImgURLd' });
//   }
//   const currentProfileImgURL = existingUser.ProfileImgURL;
//   console.log('currentProfileImgURL ',currentProfileImgURL)
//   // Delete the current profile image file from the server (assuming it's stored in 'uploads/images')
//   const imagePath = path.join(__dirname, 'uploads/images', currentProfileImgURL);
//   fs.unlinkSync(imagePath); // Be cautious with this operation in a production environment

//   // Update the user document to remove the profile image URL
//   const updateDoc = {
//     $unset: {
//       ProfileImgURL: 1,
//     },
//   };

//   const result = await userCollection.updateOne(filter, updateDoc);

//   res.status(200).json({ message: 'Profile image deleted successfully', result });
// });

    // Profile image change start ////

    // app.post('/profileimg', upload.array('file'), (req, res) => {

    //   console.log('come in upload ')
    //   const files = req.files || [];
    
    //   // Process files if present
    //   const imgUrls = files.map(file => {
    //     console.log("pic link = ", file.filename);
    //     return file.filename;
    //   });
    //  const ProfileImgURL = imgUrls[0];
    
    //   req.body.imgUrls = imgUrls;
  
    //   res.json({ message: 'File uploaded successfully' });
    // });





     // Profile image change end ////

    // image test //---------------////


    // app.post('/upload', upload.array('file'), (req, res) => {

    //   console.log('come in upload ')
    //   const files = req.files || [];
    
    //   // Process files if present
    //   const imgUrls = files.map(file => {
    //     console.log("pic link = ", file.filename);
    //     return file.filename;
    //   });
    //  const ProfileImgURL = imgUrls[0];
    
    //   req.body.imgUrls = imgUrls;
  
    //   res.json({ message: 'File uploaded successfully' });
    // });


  //   app.get('/check', async (req, res) => {
  //     // const query = '65b6a8e07b0dcc08436c9831'
  //     // return query
  //     // const myposts = await postsCollection.find(query).toArray();
  //     res.send('dasd');
  // });



     //----------end-----------------///

      
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

