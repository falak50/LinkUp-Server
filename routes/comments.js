const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');
const upload = require('../multerConfig');


const commentsCollection = client.db("LinkUp").collection("comments");

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

router.post('/', async (req, res) => {
    // res.status(201).json({ message: 'Comment added successfully', commentId: result.insertedId });
    try {
        const data = req.body;
        
        // Validate the input
        if (!data.text) {
            return res.status(400).json({ message: 'Invalid input data' });
        }
        
        // Add current timestamp
        data.createdAt = new Date();

        // Save the comment to the database
        const result = await commentsCollection.insertOne(data);
        console.log('Comment saved:', result.insertedId);
        
        res.status(201).json({ message: 'Comment added successfully', commentId: result.insertedId });
    } catch (error) {
        console.error('Error saving comment:', error);
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
       
        res.status(200).json(comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;
