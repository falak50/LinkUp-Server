const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');

const userCollection = client.db("LinkUp").collection("users");



router.get('/', async (req, res) => {
    const result = await userCollection.find().toArray();
    res.send(result);
});



module.exports = router;
