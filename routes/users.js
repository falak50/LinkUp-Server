const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');
const upload = require('../multerConfig');
const userCollection = client.db("LinkUp").collection("users");
const path = require('path')
const fs = require('fs'); 

router.post('/', async (req, res) => {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await userCollection.findOne(query);
    if (existingUser) {
        return res.send({ message: 'user already exists' });
    }
    const result = await userCollection.insertOne(user);
    res.send(result);
});

router.get('/', async (req, res) => {
    const result = await userCollection.find().toArray();
    res.send(result);
});
router.get('/:email', async (req, res) => {
    try {
        const query = { email: req.params.email };
        const user = await userCollection.findOne(query);
        if (!user) {
            res.status(404).send({ message: 'User not found' });
        } else {
            res.send(user);
        }
    } catch (error) {
        res.status(500).send({ message: 'An error occurred', error: error.message });
    }
});

// router.get('/:email', async (req, res) => {
//     const query = { email: req.params.email };
//     const user = await userCollection.findOne(query);
//     res.send(user);
// });

router.patch('/:id', async (req, res) => {
    const id = req.params.id;
    const { first_name, last_name, additional_name, headline, education, country, city } = req.body;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: {
            first_name, last_name, additional_name, headline, education, country, city,
        },
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
});


// router.post('/profileimg',  async(req, res) => {
//     console.log('come in profileimg asdasdd');
   
//     return res.json('hello');
//   });

router.post('/profileimg', upload.array('file'), async(req, res) => {
    console.log('come in profileimg');
    const files = req.files || [];
  
    // Process files if present
    const imgUrls = files.map(file => {
      console.log("pic link = ", file.filename);
      return file.filename;
    });
    const ProfileImgURL = imgUrls[0];
    req.body.imgUrls = imgUrls;
  
    const id = req.body.uid;
    console.log("uid", id);
    const filter = { _id: new ObjectId(id) };
  
    const updateDoc = {
      $set: {
        ProfileImgURL: ProfileImgURL,
      },
    };
  
    const result = await userCollection.updateOne(filter, updateDoc)
    //  => {
    //   if (err) {
    //     console.error('Error updating profile image:', err);
    //     return res.status(500).json({ message: 'Internal server error' });
    //   }
  
    //   console.log('Update result:', result);
  
     
    // });

    return res.json(result);
  });

  // router.delete('/profilePicdelete/:uid', async (req, res) => {
  //   console.log('delete route calll')

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

  //   // res.status(200).json({ message: 'Profile image deleted successfully'});
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
  // Delete profile image
router.delete('/profilePicdelete/:uid', async (req, res) => {
  try {
      console.log('delete route called');

      const uid = req.params.uid;
      console.log(uid);
      const filter = { _id: new ObjectId(uid) };
      const existingUser = await userCollection.findOne(filter);

      if (!existingUser) {
          return res.status(404).json({ message: 'User not found' });
      }
      if (!existingUser.ProfileImgURL) {
          return res.status(404).json({ message: 'Profile image not found' });
      }

      const currentProfileImgURL = existingUser.ProfileImgURL;
      console.log('currentProfileImgURL:', currentProfileImgURL);

      // Correct path to the image file
      const imagePath = path.join(__dirname, '../uploads/images', currentProfileImgURL);

      // Check if the file exists and delete it
      if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath); // Be cautious with this operation in a production environment
      } else {
          console.warn('File not found:', imagePath);
      }

      // Update the user document to remove the profile image URL
      const updateDoc = {
          $unset: {
              ProfileImgURL: 1,
          },
      };
      const result = await userCollection.updateOne(filter, updateDoc);

      res.status(200).json({ message: 'Profile image deleted successfully', result });
  } catch (error) {
      console.error('Error deleting profile image:', error);
      res.status(500).json({ message: 'Internal server error' });
  }
});

  
module.exports = router;
