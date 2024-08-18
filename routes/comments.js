const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');
const upload = require('../multerConfig');


const commentsCollection = client.db("LinkUp").collection("comments");
const userCollection = client.db("LinkUp").collection("users");

router.post('/like', async (req, res) => {
    try {
        const { comment_id, liker_id, isAdd } = req.body;

        if (!ObjectId.isValid(comment_id) || !ObjectId.isValid(liker_id)) {
            return res.status(400).json({ message: 'Invalid comment ID or liker ID' });
        }

        const post = await commentsCollection.findOne({ _id: new ObjectId(comment_id) });

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

        const result = await commentsCollection.updateOne({ _id: new ObjectId(comment_id) }, update);
        const updatedPost = await commentsCollection.findOne({ _id: new ObjectId(comment_id) });

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

router.get('/', async (req, res) => {
    try {
        // Retrieve all comments from the commentsCollection
        const comments = await commentsCollection.find({}).toArray();
        
        // Send the comments as the response
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// router.post('/', async (req, res) => {
//     // res.status(201).json({ message: 'Comment added successfully', commentId: result.insertedId });
//     try {
//         const data = req.body;
        
//         // Validate the input
//         if (!data.text) {
//             return res.status(400).json({ message: 'Invalid input data' });
//         }
        
//         // Add current timestamp
//         data.createdAt = new Date();

//         // Save the comment to the database
//         const result = await commentsCollection.insertOne(data);
//         console.log('Comment saved:', result.insertedId);
//         const comment_id = result.insertedId
//         res.status(201).json(result);
//     } catch (error) {
//         console.error('Error saving comment:', error);
//         res.status(500).json({ message: 'Internal server error' });
//     }
// });
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        // Validate the input
        if (!data.text || !data.uid) {
            return res.status(400).json({ message: 'Invalid input data' });
        }

        console.log('2')
        // Add current timestamp
        data.createdAt = new Date();

        // Save the comment to the database
        const result = await commentsCollection.insertOne(data);
        console.log('Comment saved:', result.insertedId);
        const comment_id = result.insertedId;
        // Fetch the user information associated with the comment's uid
        const userInfo = await userCollection.findOne(
            { _id: new ObjectId(data.uid) },
            { projection: { first_name: 1, last_name: 1, email: 1, ProfileImgURL: 1 } }
        );

        // Build the response object with comment and user info
        const response = {
            _id: comment_id,
            text: data.text,
            post_id: data.post_id,
            parent_comment_id: data.parent_comment_id,
            createdAt: data.createdAt,
            likes: [],
            commentUserInfo: userInfo
        };
        console.log('5')

        // Send the response
        res.status(201).json({ message: 'Comment added successfully', comment: response });

    } catch (error) {
        console.error('Error saving comment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/edit/:comment_id', async (req, res) => {
    try {
        const comment_id = req.params.comment_id;
        const { text } = req.body;

        // Validate comment_id and input data
        if (!ObjectId.isValid(comment_id)) {
            return res.status(400).json({ message: 'Invalid comment ID' });
        }
        if (!text) {
            return res.status(400).json({ message: 'Invalid input data' });
        }

        // Update the comment text
        const result = await commentsCollection.updateOne(
            { _id: new ObjectId(comment_id) },
            { $set: { text: text, updatedAt: new Date() } }
        );

        if (result.modifiedCount > 0) {
            // Fetch the updated comment
            const updatedComment = await commentsCollection.findOne({ _id: new ObjectId(comment_id) });
            res.status(200).json({ message: 'Comment updated successfully', comment: updatedComment });
        } else {
            res.status(404).json({ message: 'Comment not found or no changes made' });
        }
    } catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});



// Get Comments by Post ID
router.get('/:post_id', async (req, res) => {
    // res.status(200).json('dasd');
    try {
        
        const post_id = req.params.post_id;
        console.log('post_id:', post_id);

        // Validate the post_id
        if (!ObjectId.isValid(post_id)) {
            return res.status(400).json({ message: 'Invalid post ID' });
        }

   
       const comments = await commentsCollection.find({ post_id: post_id }).toArray();
    //    console.log()
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.post('/delete/:comment_id', async (req, res) => {
    try {
        const comment_id = req.params.comment_id;

        // Validate comment_id
        if (!ObjectId.isValid(comment_id)) {
            return res.status(400).json({ message: 'Invalid comment ID' });
        }

        // Delete the comment
        const result = await commentsCollection.deleteOne({ _id: new ObjectId(comment_id) });

        if (result.deletedCount > 0) {
            res.status(200).json({ message: 'Comment deleted successfully' });
        } else {
            res.status(404).json({ message: 'Comment not found' });
        }
    } catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/reply/:parent_comment_id', async (req, res) => {
    try {
        const parent_comment_id = req.params.parent_comment_id;

        const replies = await commentsCollection.aggregate([
            { $match: { parent_comment_id: parent_comment_id } }, // Match the parent_comment_id
            { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order (latest first)
            {
                $addFields: {
                    uidObjectId: { $toObjectId: "$uid" } // Convert `uid` to ObjectId
                }
            },
            {
                $lookup: {
                    from: 'users', // Join with the `users` collection
                    localField: 'uidObjectId', // Field from the comments collection (ObjectId)
                    foreignField: '_id', // Field from the users collection (ObjectId)
                    as: 'userInfo' // Resulting field in the comments array
                }
            },
            {
                $unwind: {
                    path: '$userInfo',
                    preserveNullAndEmptyArrays: true // Include comments even if no matching user is found
                }
            },
            {
                $project: {
                    text: 1,
                    post_id: 1,
                    parent_comment_id: 1,
                    createdAt: 1,
                    'userInfo.first_name': 1,
                    'userInfo.last_name': 1,
                    'userInfo.email': 1,
                    'userInfo.ProfileImgURL': 1
                }
            }
        ]).toArray();

        res.status(200).json(replies);
    } catch (error) {
        console.error('Error fetching replies:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;
