const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');

const skillsCollection = client.db("LinkUp").collection("skills");

router.get('/',(req,res)=>{
    res.send('skills route connected')
})
router.post('/', async (req, res) => {
    const data = req.body;
    const result = await skillsCollection.insertOne(data);
    res.send(result);
});

router.get('/:uid', async (req, res) => {
    const query = { uid: req.params.uid };
    const skills = await skillsCollection.find(query).toArray();
    res.send(skills);
});

router.patch('/:_id', async (req, res) => {
    const skillsId = req.params._id;
    const updateData = req.body;
    delete updateData._id;
    try {
        const result = await skillsCollection.updateOne(
            { _id: new ObjectId(skillsId) },
            { $set: updateData }
        );
        if (result.modifiedCount > 0) {
            res.status(200).json({ message: 'Skills record updated successfully' });
        } else {
            res.status(404).json({ message: 'Skills record not found' });
        }
    } catch (error) {
        console.error('Error updating skills record', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.delete('/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) };
    const result = await skillsCollection.deleteOne(query);
    res.send(result);
});

module.exports = router;
