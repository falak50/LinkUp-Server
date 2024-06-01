const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');
const upload = require('../multerConfig');

const postsCollection = client.db("LinkUp").collection("posts");

router.post('/', upload.array('file'), async (req, res) => {
    const files = req.files || [];
    const imgUrls = files.map(file => file.filename);
    req.body.imgUrls = imgUrls;
    const data = req.body;
    console.log(data);
    const result = await postsCollection.insertOne(data);
    console.log(result)
    res.send(result);
});

router.get('/:uid', async (req, res) => {
    const query = { uid: req.params.uid };
    console.log(query)
    const myposts = await postsCollection.find(query).toArray();
    res.send(myposts);
});

router.get('/',(req,res)=>{
    res.send('LinkUp is running finally')
})

module.exports = router;
