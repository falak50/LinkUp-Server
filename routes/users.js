const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');

const userCollection = client.db("LinkUp").collection("users");

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
    const query = { email: req.params.email };
    const user = await userCollection.findOne(query);
    res.send(user);
});

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

module.exports = router;
