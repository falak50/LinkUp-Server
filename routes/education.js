const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');

const eduCollection = client.db("LinkUp").collection("education");

router.get('/', async (req, res) => {
    const result = await eduCollection.find().toArray();
    res.send(result);
});

router.get('/:uid', async (req, res) => {
    const query = { uid: req.params.uid };
    const education = await eduCollection.find(query).toArray();
    res.send(education);
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
