const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');
const upload = require('../multerConfig');

const postsCollection = client.db("LinkUp").collection("posts");
const userCollection = client.db("LinkUp").collection("users");
const path = require('path') 
const fs = require('fs').promises; 
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
router.post('/:uid', upload.array('file'), async (req, res) => {
    const files = req.files || [];
    const imgUrls = files.map(file => file.filename);
    req.body.imgUrls = imgUrls;
    const data = req.body;
    console.log(data);
    const result = await postsCollection.insertOne(data);
    console.log(result)
    res.send(result);
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


router.get('/:email', async (req, res) => {
    try {
        const queryUser = { email: req.params.email };
        const user = await userCollection.findOne(queryUser);
        if (!user) {
            return res.status(404).send({ message: 'User not found' });
        }

        const query = { uid: user._id.toString() };
       // const query = { uid: '6598d037b67bd57e6b290949' 
        const posts = await postsCollection.find(query).toArray();
        res.send(posts);

    } catch (error) {
        res.status(500).send({ message: 'An error occurred', error: error.message });
    }
});
router.get('/',(req,res)=>{
    res.send('LinkUp is running finally')
})

module.exports = router;
