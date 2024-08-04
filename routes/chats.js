const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');
const userCollection = client.db("LinkUp").collection("users");
const messagesCollection = client.db("LinkUp").collection("chat");
// Example route to get all users with specific fields
router.get('/', async (req, res) => {
    try {
        const result = await userCollection.find({}, {
            projection: {
                _id: 1,
                email: 1,
                first_name: 1,
                last_name: 1,
                friends: 1 
            }
        }).toArray();
        res.json(result);
    } catch (error) {
        res.status(500).send(error.message);
    }
});



// Route to get a user's friends' information
router.get('/:email', async (req, res) => {
    const email = req.params.email;
    try {
        // Find the user's friends list
        const user = await userCollection.findOne({ email: email }, {
            projection: {
                friends: 1
            }
        });

        if (!user) {
            return res.status(404).send('User not found');
        }

        const friendIds = user.friends || [];

        if (friendIds.length === 0) {
            return res.json({ friends: [] });
        }

        // Find the details of all friends
        const friends = await userCollection.find({
            _id: { $in: friendIds.map(id => new ObjectId(id)) } // Convert IDs to ObjectId type
        }, {
            projection: {
                _id: 1,
                email: 1,
                first_name: 1,
                last_name: 1,
                ProfileImgURL:1
            }
        }).toArray();

        res.json({ friends });
    } catch (error) {
        res.status(500).send(error.message);
    }
});





// Route to get all messages for a specific chat_id
router.get('/messages/:chat_id', async (req, res) => {
    const chat_id = req.params.chat_id;
    try {
        // Query messages by chat_id
        const messages = await messagesCollection.find({ chat_id: chat_id }).sort({ timestamp: 1 }).toArray();

        res.json(messages);
    } catch (error) {
        res.status(500).send(error.message);
    }
});

module.exports = router;
