const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');
const userCollection = client.db("LinkUp").collection("users");
const eduCollection = client.db("LinkUp").collection("education");

router.get('/', async (req, res) => {
    const result = await eduCollection.find().toArray();
    res.send(result);
});

// router.get('/:uid', async (req, res) => {
//     // const query = { uid: req.params.uid };
//     const query = { uid: '6598d037b67bd57e6b290949' }
//     console.log(query);
//     const education = await eduCollection.find(query).toArray();
//     res.send(education);
// });
// router.get('/:email', async (req, res) => {
//     const queryUser = { email: req.params.email };
//     const user = await userCollection.findOne(queryUser);
//     // return res.send(user._id);
//     const query = { uid: user._id};
//     // return res.send(query);
//     const education = await eduCollection.find(query).toArray();
//     res.send(education);
// });
router.get('/:email', async (req, res) => {
    // return res.send('dd')
    try {
        const queryUser = { email: req.params.email };
        const user = await userCollection.findOne(queryUser);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        const query = { uid: user._id.toString() };
       // const query = { uid: '6598d037b67bd57e6b290949' 
        const education = await eduCollection.find(query).toArray();
        

        res.send(education);
    } catch (error) {
        res.status(500).send({ message: 'An error occurred', error: error.message });
    }
});

router.post('/', async (req, res) => {
    const data = req.body;
    const result = await eduCollection.insertOne(data);
    res.send(result);
});

router.patch('/:_id', async (req, res) => {
    const educationId = req.params._id;
    const updateData = req.body;
    try {
        const result = await eduCollection.updateOne(
            { _id: new ObjectId(educationId) },
            { $set: updateData }
        );
        if (result.modifiedCount > 0) {
            res.status(200).json({ message: 'Education record updated successfully' });
        } else {
            res.status(404).json({ message: 'Education record not found' });
        }
    } catch (error) {
        console.error('Error updating education record', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await eduCollection.deleteOne(query);
    res.send(result);
});

module.exports = router;

