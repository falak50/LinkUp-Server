const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');
const upload = require('../multerConfig');
const userCollection = client.db("LinkUp").collection("users");
const path = require('path')
const fs = require('fs');

// router.post('/', async (req, res) => {
//     const user = req.body;
//     const query = { email: user.email };
//     const existingUser = await userCollection.findOne(query);
//     if (existingUser) {
//         return res.send({ message: 'user already exists' });
//     }
//     const result = await userCollection.insertOne(user);
//     res.send(result);
// });
router.post('/', async (req, res) => {
    const user = req.body;
    const query = { email: user.email };
    const existingUser = await userCollection.findOne(query);
    
    if (existingUser) {
        return res.send({ message: 'user already exists' });
    }
    
    const result = await userCollection.insertOne(user);
    
    if (result.acknowledged) {
        const newUser = await userCollection.findOne({ _id: result.insertedId });
        return res.send(newUser);
    } else {
        return res.send();
    }
});
 
router.get('/', async (req, res) => {
    const result = await userCollection.find().toArray();
    res.send(result);
});



router.get('/networks/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const query = { _id: new ObjectId(id) };
    const user = await userCollection.findOne(query);

    if (!user) {
      return res.status(404).send("User not found");
    }
    console.log(user);

    // Use optional chaining and default values to handle possible undefined fields
    const friends = user.friends || [];
    const sendRequests = user.send_request || [];
    const getRequests = user.get_request || []; // Adjust field name if different

    // Combine user's own ID, send_request, and friends into an exclusion list
    const exclusionListID = [
      new ObjectId(id),  // Exclude the user's own ID
      ...sendRequests.map(requestId => new ObjectId(requestId)), // Exclude send_request IDs
      ...friends.map(friendId => new ObjectId(friendId)) // Exclude friends IDs
    ];
    console.log('exclusionListID ', exclusionListID);

    // Find all users whose IDs are not in the exclusion list
    const makeFriendUsers = await userCollection.find({
      _id: { $nin: exclusionListID }
    }).toArray();

    // Find all users who are friends with the current user
    const friendUsers = await userCollection.find({
      _id: { $in: friends.map(friendId => new ObjectId(friendId)) }
    }).toArray();

    // Find all users who have sent a friend request to the current user
    const friendrequestUsers = await userCollection.find({
      _id: { $in: getRequests.map(requestId => new ObjectId(requestId)) }
    }).toArray();

    // Find all users to whom the current user has sent a friend request
    const sentfriendrequestUsers = await userCollection.find({
      _id: { $in: sendRequests.map(requestId => new ObjectId(requestId)) }
    }).toArray();

    // Construct the response object
    const obj = {
      makeFriendUsers,
      friendUsers,
      friendrequestUsers,
      sentfriendrequestUsers
    };
    res.send(obj);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.get('/networks/makeFriendUsers/:id', async (req, res) => {
  const id = req.params.id;
  const { search, page = 1, limit = 12 } = req.query; // Extract search, page, and limit from query

  try {
    const query = { _id: new ObjectId(id) };
    const user = await userCollection.findOne(query);

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Use optional chaining and default values to handle possible undefined fields
    const friends = user.friends || [];
    const sendRequests = user.send_request || [];
    const getRequests = user.get_request || [];

    // Exclusion list of user IDs
    const exclusionListID = [
      new ObjectId(id), 
      ...sendRequests.map(requestId => new ObjectId(requestId)), 
      ...friends.map(friendId => new ObjectId(friendId)),
      ...getRequests.map(getRequestID => new ObjectId(getRequestID))
    ];

    // Build the search query
    let searchQuery = {};
    if (search) {
      const regex = new RegExp(search, 'i'); // Case-insensitive search
      searchQuery = {
        $or: [
          { first_name: regex }, // Match first name
          { last_name: regex } // Match last name
        ]
      };
    }

    // Calculate total number of users that match the criteria (excluding friends, sent requests, and received requests)
    const totalUsers = await userCollection.countDocuments({
      _id: { $nin: exclusionListID },
      ...searchQuery // Include the search query
    });

    // Pagination logic
    const skip = (page - 1) * limit;

    // Fetch users who are not friends, not in send/receive requests, and match the search query (if any)
    const makeFriendUsers = await userCollection.find({
      _id: { $nin: exclusionListID },
      ...searchQuery
    })
    .skip(skip)
    .limit(parseInt(limit))
    .toArray();

    // Send the response with pagination info
    res.send({
      makeFriendUsers,
      total: totalUsers, // Total matching users
      page: parseInt(page), // Current page
      limit: parseInt(limit) // Number of users per page
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

router.get('/networks/friendrequestUsers/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const query = { _id: new ObjectId(id) };
    const user = await userCollection.findOne(query);

    if (!user) {
      return res.status(404).send("User not found");
    }
    const getRequests = user.get_request || []; // Adjust field name if different

    const friendrequestUsers = await userCollection.find({
      _id: { $in: getRequests.map(requestId => new ObjectId(requestId)) }
    }).toArray();

    const obj = {
      friendrequestUsers
    };
    res.send(obj);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
router.get('/networks/sentfriendrequestUsers/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const query = { _id: new ObjectId(id) };
    const user = await userCollection.findOne(query);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const sendRequests = user.send_request || [];

    const sentfriendrequestUsers = await userCollection.find({
      _id: { $in: sendRequests.map(requestId => new ObjectId(requestId)) }
    }).toArray();

    const obj = {
      sentfriendrequestUsers
    };
    res.send(obj);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
// router.get('/connections/:id', async (req, res) => {
//     const id = req.params.id;
//     try {
//       const query = { _id: new ObjectId(id) };
//       const user = await userCollection.findOne(query);
  
//       if (!user) {
//         return res.status(404).send("User not found");
//       }
  
//       const friends = user.friends || []; // Get friends list (array of IDs)
      
//       // Find friends with only the required fields
//       const friendUsers = await userCollection.find({
//         _id: { $in: friends.map(friendId => new ObjectId(friendId)) }
//       }, {
//         projection: {
//           first_name: 1,
//           last_name: 1,
//           ProfileImgURL: 1,
//           education: 1,
//           email: 1,
//           headline: 1
//         }
//       }).toArray();
  
//       res.send(friendUsers);
//     } catch (error) {
//       res.status(500).send(error.message);
//     }
//   });
router.get('/connections/:id', async (req, res) => {
  const id = req.params.id;
  const { search, sort, page = 1, limit = 2 } = req.query; // Extract search, sort, page, and limit parameters from query

  try {
    const query = { _id: new ObjectId(id) };
    const user = await userCollection.findOne(query);

    if (!user) {
      return res.status(404).send("User not found");
    }

    const friends = user.friends || []; // Get friends list (array of IDs)

    // Create a filter for searching friends by first_name or last_name (case-insensitive)
    let searchQuery = {};
    if (search) {
      const regex = new RegExp(search, 'i'); // Create regex once
      searchQuery = {
        $or: [
          { first_name: regex }, // Case-insensitive search
          { last_name: regex }
        ]
      };
    }

    // Calculate pagination
    const totalFriends = await userCollection.countDocuments({
      _id: { $in: friends.map(friendId => new ObjectId(friendId)) },
      ...searchQuery // Include the search query here
    });

    const skip = (page - 1) * limit; // Calculate the number of documents to skip
    const friendUsers = await userCollection.find({
      _id: { $in: friends.map(friendId => new ObjectId(friendId)) },
      ...searchQuery // Include the search query here
    }, {
      projection: {
        first_name: 1,
        last_name: 1,
        ProfileImgURL: 1,
        education: 1,
        email: 1,
        headline: 1
      }
    })
    .skip(skip) // Skip the documents based on pagination
    .limit(parseInt(limit)) // Limit the number of documents to return
    .toArray();

    // Sort friendUsers based on the sort parameter
    if (sort) {
      if (sort === 'first_name') {
        friendUsers.sort((a, b) => (a.first_name || '').localeCompare(b.first_name || ''));
      } else if (sort === 'last_name') {
        friendUsers.sort((a, b) => (a.last_name || '').localeCompare(b.last_name || ''));
      } else if (sort === 'recent') {
      }
    }

    // Return pagination info along with the friend users
    res.send({
      result: totalFriends,
      total: friends.length,
      page: parseInt(page),
      limit: parseInt(limit),
      friends: friendUsers
    });
  } catch (error) {
    res.status(500).send(error.message);
  }
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
//     res.send(user);n
// });

router.patch('/:id', async (req, res) => {
    console.log('todo')
    const id = req.params.id;
    const { first_name, last_name, additional_name, headline, education, country, city } = req.body;
    const filter = { _id: new ObjectId(id) };
    const updateDoc = {
        $set: {
            first_name, last_name, additional_name, headline, education, country, city
        },
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
});


//connections
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
    return res.json(result);
  });
  router.post('/coverImg', upload.array('file'), async(req, res) => {
    console.log('come in profileimg');
    const files = req.files || [];
  
    // Process files if present
    const imgUrls = files.map(file => {
      console.log("pic link = ", file.filename);
      return file.filename;
    });
    const CoverImgURL = imgUrls[0];
    req.body.imgUrls = imgUrls;
  
    const id = req.body.uid;
    console.log("uid", id);
    const filter = { _id: new ObjectId(id) };
  
    const updateDoc = {
      $set: {
        CoverImgURL: CoverImgURL,
      },
    };
  
    const result = await userCollection.updateOne(filter, updateDoc)
    return res.json(result);
  });


  router.post('/private', async (req, res) => {
    try {
      const { uid, isPrivate } = req.body;
  
      if (!uid) {
        return res.status(400).send({ message: 'User ID is required' });
      }
  
      // Find the user by ID and update the `isPrivate` field
      const filter = { _id: new ObjectId(uid) };
      const updateDoc = {
        $set: { isPrivate }
      };
  
      const result = await userCollection.updateOne(filter, updateDoc);
  
      if (result.modifiedCount === 0) {
        return res.status(404).send({ message: 'User not found or privacy setting already set to the provided value' });
      }
  
      res.status(200).send({ message: 'User privacy updated successfully', isPrivate });
    } catch (error) {
      console.error(error);
      res.status(500).send({ message: 'An error occurred while updating privacy settings', error: error.message });
    }
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
      console.log('imagePath',imagePath)
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


// friends array

// router.post('/friendRequest', async (req, res) => {
//     try {
//       const { sentFriendRequestEmail, ownerEmail } = req.body;
  
//       // Here you can add logic to handle friend requests
//       // For example, updating a "friendRequests" field in the user documents
  
//       const owner = await userCollection.findOne({ email:ownerEmail  });
//       const friend = await userCollection.findOne({ email: sentFriendRequestEmail });
//     //  return res.send({ message: 'Friend request sent successfully', owner  });
//       if (!owner || !friend) {
//         return res.status(404).send({ message: 'User not found' });
//       }
  
//     } catch (error) {
//       res.status(500).send({ message: 'An error occurred', error: error.message });
//     }

//   });  

router.post('/friendRequest', async (req, res) => {
  console.log('add friend request');
  try {
    const { sentFriendRequestEmail, ownerEmail } = req.body;

    const owner = await userCollection.findOne({ email: ownerEmail });
    const friend = await userCollection.findOne({ email: sentFriendRequestEmail });

    if (!owner || !friend) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Ensure owner.friends and friend.friends are arrays
    owner.friends = owner.friends || [];
    friend.friends = friend.friends || [];

    // Check if they are already friends
    if (owner.friends.some(friendId => friendId.equals(friend._id))) {
      return res.status(400).send({ message: 'Already friends' });
    }

    // Ensure owner.send_request and friend.get_request are arrays
    owner.send_request = owner.send_request || [];
    friend.get_request = friend.get_request || [];

    // Update owner's send_request array
    const updateOwnerResult = await userCollection.updateOne(
      { email: ownerEmail },
      { $addToSet: { send_request: friend._id } }
    );

    // Update friend's get_request array
    const updateFriendResult = await userCollection.updateOne(
      { email: sentFriendRequestEmail },
      { $addToSet: { get_request: owner._id } }
    );

    if (updateOwnerResult.modifiedCount === 1 && updateFriendResult.modifiedCount === 1) {
      console.log('Friend request sent successfully');
      res.send({ message: 'Friend request sent successfully', owner, friend });
    } else {
      res.status(500).send({ message: 'Failed to send friend request' });
    }
  } catch (error) {
    res.status(500).send({ message: 'An error occurred', error: error.message });
  }
});
router.post('/cancelFriendRequest', async (req, res) => {
  try {
    const { sentFriendRequestEmail, ownerEmail } = req.body;

    const [owner, friend] = await Promise.all([
      userCollection.findOne({ email: ownerEmail }),
      userCollection.findOne({ email: sentFriendRequestEmail })
    ]);

    if (!owner || !friend) {
      return res.status(404).send({ message: 'User not found' });
    }

    const updateOperations = [];

    // Check if the request exists from owner to friend
    if (owner.send_request && owner.send_request.some(requestId => requestId.equals(friend._id))) {
      updateOperations.push(
        userCollection.updateOne(
          { email: ownerEmail },
          { $pull: { send_request: friend._id } }
        ),
        userCollection.updateOne(
          { email: sentFriendRequestEmail },
          { $pull: { get_request: owner._id } }
        )
      );
    }

    // Check if the request exists from friend to owner
    if (friend.send_request && friend.send_request.some(requestId => requestId.equals(owner._id))) {
      updateOperations.push(
        userCollection.updateOne(
          { email: sentFriendRequestEmail },
          { $pull: { send_request: owner._id } }
        ),
        userCollection.updateOne(
          { email: ownerEmail },
          { $pull: { get_request: friend._id } }
        )
      );
    }

    const results = await Promise.all(updateOperations);

    const successfulUpdates = results.filter(result => result.modifiedCount > 0);

    if (successfulUpdates.length > 0) {
      res.send({ message: 'Friend request canceled successfully', owner, friend });
    } else {
      res.status(500).send({ message: 'Failed to cancel friend request' });
    }
  } catch (error) {
    res.status(500).send({ message: 'An error occurred', error: error.message });
  }
});
 
// router.post('/cancelFriendRequest', async (req, res) => {
//   try {
//     const { sentFriendRequestEmail, ownerEmail } = req.body;

//     const [owner, friend] = await Promise.all([
//       userCollection.findOne({ email: ownerEmail }),
//       userCollection.findOne({ email: sentFriendRequestEmail })
//     ]);

//     if (!owner || !friend) {
//       return res.status(404).send({ message: 'User not found' });
//     }

//     const updateOperations = [];

//     // Check if the request exists from owner to friend
//     if (owner.send_request.some(requestId => requestId.equals(friend._id))) {
//       updateOperations.push(
//         userCollection.updateOne(
//           { email: ownerEmail },
//           { $pull: { send_request: friend._id } }
//         ),
//         userCollection.updateOne(
//           { email: sentFriendRequestEmail },
//           { $pull: { get_request: owner._id } }
//         )
//       );
//     }

//     // Check if the request exists from friend to owner
//     if (friend.send_request.some(requestId => requestId.equals(owner._id))) {
//       updateOperations.push(
//         userCollection.updateOne(
//           { email: sentFriendRequestEmail },
//           { $pull: { send_request: owner._id } }
//         ),
//         userCollection.updateOne(
//           { email: ownerEmail },
//           { $pull: { get_request: friend._id } }
//         )
//       );
//     }

//     const results = await Promise.all(updateOperations);

//     const successfulUpdates = results.filter(result => result.modifiedCount > 0);

//     if (successfulUpdates.length > 0) {
//       res.send({ message: 'Friend request canceled successfully', owner, friend });
//     } else {
//       res.status(500).send({ message: 'Failed to cancel friend request' });
//     }
//   } catch (error) {
//     res.status(500).send({ message: 'An error occurred', error: error.message });
//   }
// });


 
router.post('/acceptFriendRequest', async (req, res) => {
  try {
    const { sentFriendRequestEmail, ownerEmail } = req.body;

    const owner = await userCollection.findOne({ email: ownerEmail });
    const friend = await userCollection.findOne({ email: sentFriendRequestEmail });

    if (!owner || !friend) {
      return res.status(404).send({ message: 'User not found' });
    }

    // Add each user's ID to the other's friends array and remove from get_request and send_request
    const updateOwnerResult = await userCollection.updateOne(
      { email: ownerEmail },
      {
        $addToSet: { friends: friend._id },
        $pull: { get_request: friend._id, send_request: sentFriendRequestEmail }
      }
    );

    const updateFriendResult = await userCollection.updateOne(
      { email: sentFriendRequestEmail },
      {
        $addToSet: { friends: owner._id },
        $pull: { send_request: owner._id, get_request: ownerEmail }
      }
    );

    if (updateOwnerResult.modifiedCount === 1 && updateFriendResult.modifiedCount === 1) {
      res.send({ message: 'Friend request accepted successfully', owner, friend });
    } else {
      res.status(500).send({ message: 'Failed to accept friend request' });
    }
  } catch (error) {
    res.status(500).send({ message: 'An error occurred', error: error.message });
  }
});
  
  router.post('/removefriend', async (req, res) => {
    try {
        // sentFriendRequestEmail mean friend email 
      const { sentFriendRequestEmail, ownerEmail } = req.body;
      const friendEmail=sentFriendRequestEmail;

      const owner = await userCollection.findOne({ email: ownerEmail });
      const friend = await userCollection.findOne({ email: friendEmail });
      
      if (!owner || !friend) {
        return res.status(404).send({ message: 'User not found' });
      }
  
      // Remove each user's ID from the other's friends array
      const updateOwnerResult = await userCollection.updateOne(
        { email: ownerEmail },
        { $pull: { friends: friend._id } }
      );
  
      const updateFriendResult = await userCollection.updateOne(
        { email: friendEmail },
        { $pull: { friends: owner._id } }
      );
  
      if (updateOwnerResult.modifiedCount === 1 && updateFriendResult.modifiedCount === 1) {
        res.send({ message: 'Unfriended successfully', owner, friend });
      } else {
        res.status(500).send({ message: 'Failed to unfriend' });
      }
    } catch (error) {
      res.status(500).send({ message: 'An error occurred', error: error.message });
    }
  });

  // router.post('/active-button-code', async (req, res) => {
  //   try {
  //     const { sentFriendRequestEmail, ownerEmail } = req.body;
  //     const friendEmail = sentFriendRequestEmail;
  
  //     const owner = await userCollection.findOne({ email: ownerEmail });
  //     const otherUser = await userCollection.findOne({ email: friendEmail });
  
  //     if (!owner || !otherUser) {
  //       return res.status(404).send({ message: 'User not found' });
  //     }
  
  //     let relation;
  
  //     const isFriend = owner.friends.some(friendId => friendId.equals(otherUser._id)) && 
  //                      otherUser.friends.some(friendId => friendId.equals(owner._id));
  //     const hasSentRequest = owner.send_request.some(requestId => requestId.equals(otherUser._id)) &&
  //                            otherUser.get_request.some(requestId => requestId.equals(owner._id));
  //     const hasReceivedRequest = owner.get_request.some(requestId => requestId.equals(otherUser._id)) &&
  //                                otherUser.send_request.some(requestId => requestId.equals(owner._id));
  
  //     if (isFriend) {
  //       relation = "unfriend";
  //     } else if (hasSentRequest) {
  //       relation = "cancel_request";
  //     } else if (hasReceivedRequest) {
  //       relation = "accept_&_cancel_request";
  //     } else {
  //       relation = "add_friend";
  //     }
  
  //     res.send({ message: relation });
  //   } catch (error) {
  //     res.status(500).send({ message: 'An error occurred', error: error.message });
  //   }
  // });
  
  router.post('/active-button-code', async (req, res) => {
    try {
      const { sentFriendRequestEmail, ownerEmail } = req.body;
      const friendEmail = sentFriendRequestEmail;
  
      const owner = await userCollection.findOne({ email: ownerEmail });
      const otherUser = await userCollection.findOne({ email: friendEmail });
  
      if (!owner || !otherUser) {
        return res.status(404).send({ message: 'User not found' });
      }
  
      let relation;
  
      const isFriend = owner.friends?.some(friendId => friendId.equals(otherUser._id)) && 
                       otherUser.friends?.some(friendId => friendId.equals(owner._id));
      const hasSentRequest = owner.send_request?.some(requestId => requestId.equals(otherUser._id)) &&
                             otherUser.get_request?.some(requestId => requestId.equals(owner._id));
      const hasReceivedRequest = owner.get_request?.some(requestId => requestId.equals(otherUser._id)) &&
                                 otherUser.send_request?.some(requestId => requestId.equals(owner._id));
  
      if (isFriend) {
        relation = "unfriend";
      } else if (hasSentRequest) {
        relation = "cancel_request";
      } else if (hasReceivedRequest) {
        relation = "accept_&_cancel_request";
      } else {
        relation = "add_friend";
      }
  
      res.send({ message: relation });
    } catch (error) {
      res.status(500).send({ message: 'An error occurred', error: error.message });
    }
  });
  
  

module.exports = router;
 