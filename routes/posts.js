const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');
const upload = require('../multerConfig');


const commentsCollection = client.db("LinkUp").collection("comments");
const postsCollection = client.db("LinkUp").collection("posts");
const userCollection = client.db("LinkUp").collection("users");
const path = require('path') 
const fs = require('fs').promises; 


router.get('/publicPost', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 20; // Default to 5 items per page
        const skip = (page - 1) * limit; // Calculate the number of items to skip
   console.log('fasdfsadasfasfdasf')
        const posts = await postsCollection.aggregate([
            {
                $match: {
                    $and: [
                        { uid: { $ne: null } }, // Ensure uid is not null
                        { $expr: { $eq: [{ $strLenCP: "$uid" }, 24] } } // Check if `uid` has a valid length for ObjectId
                    ]
                }
            },
            {
                $addFields: {
                    uidObjectId: { $toObjectId: "$uid" } // Convert `uid` to ObjectId
                }
            },
            {
                $lookup: {
                    from: 'users', // Join with the `users` collection
                    localField: 'uidObjectId', // Field from the posts collection (ObjectId)
                    foreignField: '_id', // Field from the users collection (ObjectId)
                    as: 'userInfo' // Resulting field in the posts collection
                }
            },
            {
                $unwind: {
                    path: '$userInfo',
                    preserveNullAndEmptyArrays: true // Include posts even if no matching user is found
                }
            },
            {
                // Filter to ensure only posts from users whose `isPrivate` is false or undefined
                $match: {
                    $or: [
                        { 'userInfo.isPrivate': { $eq: false } }, // User's `isPrivate` is false
                        { 'userInfo.isPrivate': { $exists: false } } // User's `isPrivate` is undefined
                    ]
                }
            },
            {
                $lookup: {
                    from: 'comments', // Join with the `comments` collection
                    let: { postId: '$_id' }, // Define variable for the post's _id
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    { post_id: { $ne: null } }, // Ensure post_id is not null
                                    { uid: { $ne: null } }, // Ensure uid is not null
                                    { $expr: { $eq: [{ $strLenCP: "$post_id" }, 24] } }, // Check if `post_id` has a valid length for ObjectId
                                    { $expr: { $eq: [{ $strLenCP: "$uid" }, 24] } } // Check if `uid` has a valid length for ObjectId
                                ]
                            }
                        },
                        {
                            $addFields: {
                                post_idObjectId: { $toObjectId: "$post_id" }, // Convert post_id to ObjectId
                                uidObjectId: { $toObjectId: "$uid" } // Convert uid to ObjectId
                            }
                        },
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$post_idObjectId', { $toObjectId: '$$postId' }] // Match post_id with post's _id
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'users', // Join with the `users` collection for comments
                                localField: 'uidObjectId', // Field from the comments collection
                                foreignField: '_id', // Field from the users collection
                                as: 'commentUserInfo' // Resulting field in the comments array
                            }
                        },
                        {
                            $unwind: {
                                path: '$commentUserInfo',
                                preserveNullAndEmptyArrays: true // Include comments even if no matching user is found
                            }
                        },
                        {
                            $sort: { createdAt: -1 } // Sort comments by creation date in descending order (reverse order)
                        }
                    ],
                    as: 'comments' // Resulting field in the posts collection
                }
            },
            {
                $project: {
                    description: 1,
                    imgUrls: 1,
                    uid: 1,
                    createdAt: 1,
                    likes: 1,
                    'userInfo.first_name': 1,
                    'userInfo.last_name': 1,
                    'userInfo.email': 1,
                    'userInfo.ProfileImgURL': 1,
                    comments: {
                        _id: 1,
                        uid: 1,
                        text: 1,
                        post_id: 1,
                        parent_comment_id: 1,
                        createdAt: 1,
                        likes: 1,
                        'commentUserInfo.first_name': 1,
                        'commentUserInfo.last_name': 1,
                        'commentUserInfo.ProfileImgURL': 1,
                        'commentUserInfo.email': 1
                    } // Include user info for comments
                }
            },
            {
                $sort: { createdAt: -1 } // Sort posts by creation date in descending order
            },
            {
                $skip: skip // Skip the number of items based on the current page
            },
            {
                $limit: limit // Limit the number of items per page
            }
        ]).toArray();

        res.send(posts);

    } catch (error) {
        res.status(500).send({ message: 'An error occurred', error: error.message });
    }
});
router.get('/friendsPost/:id', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default to 5 items per page
        const skip = (page - 1) * limit; // Calculate the number of items to skip
            const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const user = await userCollection.findOne(query);
    if (!user) {
        return res.status(404).send("User not found");
    }
    let FriendIdArray = [id]; 
    if (user.friends && Array.isArray(user.friends)) {
        const friendIds = user.friends.map(friend => {
            if (friend instanceof ObjectId) {
                return friend.toString();
            } else {
                return friend._id ? friend._id.toString() : undefined;
            }
        });
        FriendIdArray = FriendIdArray.concat(friendIds.filter(id => id));
    }
    console.log('Final FriendIdArray: --- > ', FriendIdArray);
        const posts = await postsCollection.aggregate([
            {
                $match: {
                    $and: [
                        { uid: { $ne: null } }, 
                        { $expr: { $eq: [{ $strLenCP: "$uid" }, 24] } },
                        // {  uid: { $in: FriendIdArray }}
                    ]
                }
            },
            {
                $addFields: {
                    uidObjectId: { $toObjectId: "$uid" } // Convert `uid` to ObjectId
                }
            },
            {
                $lookup: {
                    from: 'users', // Join with the `users` collection
                    localField: 'uidObjectId', // Field from the posts collection (ObjectId)
                    foreignField: '_id', // Field from the users collection (ObjectId)
                    as: 'userInfo' // Resulting field in the posts collection
                }
            },
            {
                $unwind: {
                    path: '$userInfo',
                    preserveNullAndEmptyArrays: true // Include posts even if no matching user is found
                }
            },
            // {
            //     // Filter to ensure only posts from users whose `isPrivate` is false or undefined
            //     $match: {
            //         $or: [
            //             { 'userInfo.isPrivate': { $eq: false } }, // User's `isPrivate` is false
            //             { 'userInfo.isPrivate': { $exists: false } } // User's `isPrivate` is undefined
            //         ]
            //     }
            // },
            {
                $lookup: {
                    from: 'comments', // Join with the `comments` collection
                    let: { postId: '$_id' }, // Define variable for the post's _id
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    { post_id: { $ne: null } }, // Ensure post_id is not null
                                    { uid: { $ne: null } }, // Ensure uid is not null
                                    { $expr: { $eq: [{ $strLenCP: "$post_id" }, 24] } }, // Check if `post_id` has a valid length for ObjectId
                                    { $expr: { $eq: [{ $strLenCP: "$uid" }, 24] } } // Check if `uid` has a valid length for ObjectId
                                ]
                            }
                        },
                        {
                            $addFields: {
                                post_idObjectId: { $toObjectId: "$post_id" }, // Convert post_id to ObjectId
                                uidObjectId: { $toObjectId: "$uid" } // Convert uid to ObjectId
                            }
                        },
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$post_idObjectId', { $toObjectId: '$$postId' }] // Match post_id with post's _id
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'users', // Join with the `users` collection for comments
                                localField: 'uidObjectId', // Field from the comments collection
                                foreignField: '_id', // Field from the users collection
                                as: 'commentUserInfo' // Resulting field in the comments array
                            }
                        },
                        {
                            $unwind: {
                                path: '$commentUserInfo',
                                preserveNullAndEmptyArrays: true // Include comments even if no matching user is found
                            }
                        },
                        {
                            $sort: { createdAt: -1 } // Sort comments by creation date in descending order (reverse order)
                        }
                    ],
                    as: 'comments' // Resulting field in the posts collection
                }
            },
            {
                $project: {
                    description: 1,
                    imgUrls: 1,
                    uid: 1,
                    createdAt: 1,
                    likes: 1,
                    'userInfo.first_name': 1,
                    'userInfo.last_name': 1,
                    'userInfo.email': 1,
                    'userInfo.ProfileImgURL': 1,
                    comments: {
                        _id: 1,
                        uid: 1,
                        text: 1,
                        post_id: 1,
                        parent_comment_id: 1,
                        createdAt: 1,
                        likes: 1,
                        'commentUserInfo.first_name': 1,
                        'commentUserInfo.last_name': 1,
                        'commentUserInfo.ProfileImgURL': 1,
                        'commentUserInfo.email': 1
                    } // Include user info for comments
                }
            },
            {
                $sort: { createdAt: -1 } // Sort posts by creation date in descending order
            },
            {
                $skip: skip // Skip the number of items based on the current page
            },
            {
                $limit: limit // Limit the number of items per page
            }
        ]).toArray();

        res.send(posts);

    } catch (error) {
        res.status(500).send({ message: 'An error occurred', error: error.message });
    }
});
router.post('/like', async (req, res) => {
    try {
        const { post_id, liker_id, isAdd } = req.body;

        if (!ObjectId.isValid(post_id) || !ObjectId.isValid(liker_id)) {
            return res.status(400).json({ message: 'Invalid post ID or liker ID' });
        }

        const post = await postsCollection.findOne({ _id: new ObjectId(post_id) });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const update = {};
        
        if (!post.likes) {
            // If likes array does not exist, initialize it and push the liker_id
            update.$set = { likes: [liker_id] };
        } else {
            // If likes array exists
            if (isAdd) {
                // Add liker_id to the likes array if isAdd is true and it's not already present
                if (!post.likes.includes(liker_id)) {
                    update.$push = { likes: liker_id };
                }
            } else {
                // Remove liker_id from the likes array if isAdd is false
                update.$pull = { likes: liker_id };
            }
        }

        const result = await postsCollection.updateOne({ _id: new ObjectId(post_id) }, update);
        const updatedPost = await postsCollection.findOne({ _id: new ObjectId(post_id) });

        if (result.modifiedCount > 0) {
            return res.status(200).json({ likeCount: updatedPost.likes.length });
        } else {
            return res.status(500).json({ message: 'Failed to update like status' });
        }
    } catch (error) {
        console.error('Error updating like status:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



router.post('/', upload.array('file'), async (req, res) => {
    const files = req.files || [];
    const imgUrls = files.map(file => file.filename);
    req.body.imgUrls = imgUrls;
    const data = req.body;

    // Add current timestamp
    data.createdAt = new Date();

    // console.log('post-->',data);
    const result = await postsCollection.insertOne(data);
    // console.log(result);
    res.send(result);
});
router.post('/:uid', upload.array('file'), async (req, res) => {
    const files = req.files || [];
    const imgUrls = files.map(file => file.filename);
    req.body.imgUrls = imgUrls;
    const data = req.body;
    const uid = req.params.uid;

    // console.log(data);

    if (!ObjectId.isValid(uid)) {
        return res.status(400).json({ message: 'Invalid post ID' });
    }

    const filter = { _id: new ObjectId(uid) };
    const existingPost = await postsCollection.findOne(filter);

    if (!existingPost) { 
        return res.status(404).json({ message: 'Post not found' });
    }

    // Delete old images
    if (existingPost.imgUrls && existingPost.imgUrls.length > 0) {
        for (const imgUrl of existingPost.imgUrls) {
            const imagePath = path.join(__dirname, '../uploads/images', imgUrl);

            // Validate the image URL to prevent directory traversal attacks
            if (path.isAbsolute(imgUrl) || imgUrl.includes('..')) {
                return res.status(400).json({ message: 'Invalid image path' });
            }

            // Check if the file exists and delete it
            try {
                await fs.access(imagePath); // Check if file exists
                await fs.unlink(imagePath); // Delete the file
                console.log('File deleted:', imagePath);
            } catch (fileError) {
                console.warn('File not found or cannot be accessed:', imagePath);
            }
        }
    }

    // Update the post document
    const update = {
        $set: data
    };

    const result = await postsCollection.updateOne(filter, update);

    if (result.modifiedCount === 1) {
        res.status(200).json({ message: 'Post updated successfully' });
    } else {
        res.status(500).json({ message: 'Failed to update post' });
    }
});


router.post('/delete/:uid', async (req, res) => {
    try {
        const uid = req.params.uid;
        console.log(uid);

        if (!ObjectId.isValid(uid)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

        const filter = { _id: new ObjectId(uid) };
        const existingPost = await postsCollection.findOne(filter);

        if (!existingPost) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Delete associated images
        if (existingPost.imgUrls && existingPost.imgUrls.length > 0) {
            for (const imgUrl of existingPost.imgUrls) {
                const imagePath = path.join(__dirname, '../uploads/images', imgUrl);

                // Validate the image URL to prevent directory traversal attacks
                if (path.isAbsolute(imgUrl) || imgUrl.includes('..')) {
                    return res.status(400).json({ message: 'Invalid image path' });
                }

                // Check if the file exists and delete it
                try {
                    await fs.access(imagePath); // Check if file exists
                    await fs.unlink(imagePath); // Delete the file
                    console.log('File deleted:', imagePath);
                } catch (fileError) {
                    console.warn('File not found or cannot be accessed:', imagePath);
                }
            }
        }

        // Delete the post document
        const result = await postsCollection.deleteOne(filter);

        if (result.deletedCount === 1) {
            res.status(200).json({ message: 'Post deleted successfully' });
        } else {
            res.status(500).json({ message: 'Failed to delete post' });
        }
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// router.get('/:email', async (req, res) => {
//     try {
//         const queryUser = { email: req.params.email };
//         const user = await userCollection.findOne(queryUser);
//         if (!user) {
//             return res.status(404).send({ message: 'User not found' });
//         }

//         const query = { uid: user._id.toString() };
//        // const query = { uid: '6598d037b67bd57e6b290949' 
//         const posts = await postsCollection.find(query).toArray();
//         res.send(posts);

//     } catch (error) {
//         res.status(500).send({ message: 'An error occurred', error: error.message });
//     }
// });
// Route to fetch paginated posts by user's email
router.get('/:email', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default to 5 items per page
        const skip = (page - 1) * limit; // Calculate the number of items to skip
        const { email } = req.params; 
        const posts = await postsCollection.aggregate([
            {
                $match: {
                    $and: [
                        { uid: { $ne: null } }, // Ensure uid is not null
                        { $expr: { $eq: [{ $strLenCP: "$uid" }, 24] } } // Check if `uid` has a valid length for ObjectId
                    ]
                }
            },
            {
                $addFields: {
                    uidObjectId: { $toObjectId: "$uid" } // Convert `uid` to ObjectId
                }
            },
            {
                $lookup: {
                    from: 'users', // Join with the `users` collection
                    localField: 'uidObjectId', // Field from the posts collection (ObjectId)
                    foreignField: '_id', // Field from the users collection (ObjectId)
                    as: 'userInfo' // Resulting field in the posts collection
                }
            },
            {
                $unwind: {
                    path: '$userInfo',
                    preserveNullAndEmptyArrays: true // Include posts even if no matching user is found
                }
            },
            {
                $lookup: {
                    from: 'comments', // Join with the `comments` collection
                    let: { postId: '$_id' }, // Define variable for the post's _id
                    pipeline: [
                        {
                            $match: {
                                $and: [
                                    { post_id: { $ne: null } }, // Ensure post_id is not null
                                    { uid: { $ne: null } }, // Ensure uid is not null
                                    { $expr: { $eq: [{ $strLenCP: "$post_id" }, 24] } }, // Check if `post_id` has a valid length for ObjectId
                                    { $expr: { $eq: [{ $strLenCP: "$uid" }, 24] } } // Check if `uid` has a valid length for ObjectId
                                ]
                            }
                        },
                        {
                            $addFields: {
                                post_idObjectId: { $toObjectId: "$post_id" }, // Convert post_id to ObjectId
                                uidObjectId: { $toObjectId: "$uid" } // Convert uid to ObjectId
                            }
                        },
                        {
                            $match: {
                                $expr: {
                                    $eq: ['$post_idObjectId', { $toObjectId: '$$postId' }] // Match post_id with post's _id
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: 'users', // Join with the `users` collection for comments
                                localField: 'uidObjectId', // Field from the comments collection
                                foreignField: '_id', // Field from the users collection
                                as: 'commentUserInfo' // Resulting field in the comments array
                            }
                        },
                        {
                            $unwind: {
                                path: '$commentUserInfo',
                                preserveNullAndEmptyArrays: true // Include comments even if no matching user is found
                            }
                        },
                        {
                            $sort: { createdAt: -1 } // Sort comments by creation date in descending order (reverse order)
                        }
                    ],
                    as: 'comments' // Resulting field in the posts collection
                }
            },
            {
                $project: {
                    description: 1,
                    imgUrls: 1,
                    uid: 1,
                    createdAt: 1,
                    likes: 1,
                    'userInfo.first_name': 1,
                    'userInfo.last_name': 1,
                    'userInfo.email': 1,
                    'userInfo.ProfileImgURL': 1,
                    comments: {
                        _id: 1,
                        uid: 1,
                        text: 1,
                        post_id: 1,
                        parent_comment_id: 1,
                        createdAt: 1,
                        likes: 1,
                        'commentUserInfo.first_name': 1,
                        'commentUserInfo.last_name': 1,
                        'commentUserInfo.ProfileImgURL': 1,
                        'commentUserInfo.email': 1
                    } // Include user info for comments
                }
            },
            {
                $sort: { createdAt: -1 } // Sort posts by creation date in descending order
            },
            {
                $skip: skip // Skip the number of items based on the current page
            },
            {
                $limit: limit // Limit the number of items per page
            }
        ]).toArray();
        const filteredPosts = posts.filter(post => post.userInfo.email === email);

        res.send(filteredPosts);
        // const fetchPostByEmail = run a map which post user is == email 
        // res.send(posts);

    } catch (error) {
        res.status(500).send({ message: 'An error occurred', error: error.message });
    }
});



// //working 29sep
// router.get('/', async (req, res) => {
//     try {
//         const page = parseInt(req.query.page) || 1; // Default to page 1
//         const limit = parseInt(req.query.limit) || 5; // Default to 5 items per page
//         const skip = (page - 1) * limit; // Calculate the number of items to skip

//         const posts = await postsCollection.aggregate([
//             {
//                 $match: {
//                     $and: [
//                         { uid: { $ne: null } }, // Ensure uid is not null
//                         { $expr: { $eq: [{ $strLenCP: "$uid" }, 24] } } // Check if `uid` has a valid length for ObjectId
//                     ]
//                 }
//             },
//             {
//                 $addFields: {
//                     uidObjectId: { $toObjectId: "$uid" } // Convert `uid` to ObjectId
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'users', // Join with the `users` collection
//                     localField: 'uidObjectId', // Field from the posts collection (ObjectId)
//                     foreignField: '_id', // Field from the users collection (ObjectId)
//                     as: 'userInfo' // Resulting field in the posts collection
//                 }
//             },
//             {
//                 $unwind: {
//                     path: '$userInfo',
//                     preserveNullAndEmptyArrays: true // Include posts even if no matching user is found
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'comments', // Join with the `comments` collection
//                     let: { postId: '$_id' }, // Define variable for the post's _id
//                     pipeline: [
//                         {
//                             $match: {
//                                 $and: [
//                                     { post_id: { $ne: null } }, // Ensure post_id is not null
//                                     { uid: { $ne: null } }, // Ensure uid is not null
//                                     { $expr: { $eq: [{ $strLenCP: "$post_id" }, 24] } }, // Check if `post_id` has a valid length for ObjectId
//                                     { $expr: { $eq: [{ $strLenCP: "$uid" }, 24] } } // Check if `uid` has a valid length for ObjectId
//                                 ]
//                             }
//                         },
//                         {
//                             $addFields: {
//                                 post_idObjectId: { $toObjectId: "$post_id" }, // Convert post_id to ObjectId
//                                 uidObjectId: { $toObjectId: "$uid" } // Convert uid to ObjectId
//                             }
//                         },
//                         {
//                             $match: {
//                                 $expr: {
//                                     $eq: ['$post_idObjectId', { $toObjectId: '$$postId' }] // Match post_id with post's _id
//                                 }
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: 'users', // Join with the `users` collection for comments
//                                 localField: 'uidObjectId', // Field from the comments collection
//                                 foreignField: '_id', // Field from the users collection
//                                 as: 'commentUserInfo' // Resulting field in the comments array
//                             }
//                         },
//                         {
//                             $unwind: {
//                                 path: '$commentUserInfo',
//                                 preserveNullAndEmptyArrays: true // Include comments even if no matching user is found
//                             }
//                         },
//                         {
//                             $sort: { createdAt: -1 } // Sort comments by creation date in descending order (reverse order)
//                         }
//                     ],
//                     as: 'comments' // Resulting field in the posts collection
//                 }
//             },
//             {
//                 $project: {
//                     description: 1,
//                     imgUrls: 1,
//                     uid: 1,
//                     createdAt: 1,
//                     likes: 1,
//                     'userInfo.first_name': 1,
//                     'userInfo.last_name': 1,
//                     'userInfo.email': 1,
//                     'userInfo.ProfileImgURL': 1,
//                     comments: {
//                         _id: 1,
//                         uid: 1,
//                         text: 1,
//                         post_id: 1,
//                         parent_comment_id: 1,
//                         createdAt: 1,
//                         likes: 1,
//                         'commentUserInfo.first_name': 1,
//                         'commentUserInfo.last_name': 1,
//                         'commentUserInfo.ProfileImgURL': 1,
//                         'commentUserInfo.email': 1
//                     } // Include user info for comments
//                 }
//             },
//             {
//                 $sort: { createdAt: -1 } // Sort posts by creation date in descending order
//             },
//             {
//                 $skip: skip // Skip the number of items based on the current page
//             },
//             {
//                 $limit: limit // Limit the number of items per page
//             }
//         ]).toArray();

//         res.send(posts);

//     } catch (error) {
//         res.status(500).send({ message: 'An error occurred', error: error.message });
//     }
// });






// router.get('/friendspost/:id', async (req, res) => {
//     const page = parseInt(req.query.page) || 1; 
//     const limit = parseInt(req.query.limit) || 20; 
//     const skip = (page - 1) * limit; 
//     const id = req.params.id;
//     const query = { _id: new ObjectId(id) };
    
//     // Fetch the user
//     const user = await userCollection.findOne(query);
//     if (!user) {
//         return res.status(404).send("User not found");
//     }

//     let FriendIdArray = [id]; // Start with the route parameter ID

//     // Log the initial state of FriendIdArray
//     console.log('Initial FriendIdArray: ', FriendIdArray);

//     // Adjust the mapping based on the structure of user.friends
//     if (user.friends && Array.isArray(user.friends)) {
//         // Map friends to strings and add them to FriendIdArray
//         const friendIds = user.friends.map(friend => {
//             if (friend instanceof ObjectId) {
//                 return friend.toString(); // Convert ObjectId to string
//             } else {
//                 // Assuming the structure has _id
//                 return friend._id ? friend._id.toString() : undefined; // Adjust based on your schema
//             }
//         });

//         // Filter out any undefined values from friendIds
//         FriendIdArray = FriendIdArray.concat(friendIds.filter(id => id)); // Combine with friend IDs, excluding undefined
//     }

//     // Log the final state of FriendIdArray
//     console.log('Final FriendIdArray: --- > ', FriendIdArray);

//     try {
//         const posts = await postsCollection.aggregate([
//             {
//                 $match: {
//                     uid: { $in: FriendIdArray } // Match uid against the FriendIdArray (now strings)
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'users',
//                     localField: 'uid',
//                     foreignField: '_id',
//                     as: 'userInfo'
//                 }
//             },
//             {
//                 $unwind: {
//                     path: '$userInfo',
//                     preserveNullAndEmptyArrays: true
//                 }
//             },
//             {
//                 $match: {
//                     $or: [
//                         { 'userInfo.isPrivate': { $eq: false } },
//                         { 'userInfo.isPrivate': { $exists: false } }
//                     ]
//                 }
//             },
//             {
//                 $lookup: {
//                     from: 'comments',
//                     let: { postId: '$_id' },
//                     pipeline: [
//                         {
//                             $match: {
//                                 post_id: { $eq: '$$postId' }
//                             }
//                         },
//                         {
//                             $lookup: {
//                                 from: 'users',
//                                 localField: 'uid',
//                                 foreignField: '_id',
//                                 as: 'commentUserInfo'
//                             }
//                         },
//                         {
//                             $unwind: {
//                                 path: '$commentUserInfo',
//                                 preserveNullAndEmptyArrays: true
//                             }
//                         },
//                         {
//                             $sort: { createdAt: -1 }
//                         }
//                     ],
//                     as: 'comments'
//                 }
//             },
//             {
//                 $project: {
//                     description: 1,
//                     imgUrls: 1,
//                     uid: 1,
//                     createdAt: 1,
//                     likes: 1,
//                     'userInfo.first_name': 1,
//                     'userInfo.last_name': 1,
//                     'userInfo.email': 1,
//                     'userInfo.ProfileImgURL': 1,
//                     comments: {
//                         _id: 1,
//                         uid: 1,
//                         text: 1,
//                         post_id: 1,
//                         createdAt: 1,
//                         'commentUserInfo.first_name': 1,
//                         'commentUserInfo.last_name': 1,
//                         'commentUserInfo.ProfileImgURL': 1,
//                         'commentUserInfo.email': 1
//                     }
//                 }
//             },
//             {
//                 $sort: { createdAt: -1 }
//             },
//             {
//                 $skip: skip
//             },
//             {
//                 $limit: limit
//             }
//         ]).toArray();

//         res.send(posts);
//     } catch (error) {
//         console.error('Error during aggregation:', error);
//         res.status(500).send({ message: 'An error occurred', error: error.message });
//     }
// });




module.exports = router;
