const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');
const jobsCollection = client.db("LinkUp").collection("jobs");
const userCollection = client.db("LinkUp").collection("users");
// Route to get all job posts


router.get('/', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1; // Default to page 1
        const limit = parseInt(req.query.limit) || 5; // Default to 5 items per page
        const skip = (page - 1) * limit; // Calculate the number of items to skip

        // Extract search parameters from query
        const { title, location, workType } = req.query;

        // Build the search criteria
        const matchCriteria = {
            $and: [
                { uid: { $ne: null } }, // Ensure uid is not null
                { $expr: { $eq: [{ $strLenCP: "$uid" }, 24] } } // Check if `uid` has a valid length for ObjectId
            ]
        };

        if (title) {
            matchCriteria.$and.push({ title: { $regex: title, $options: 'i' } }); // Case-insensitive search for title
        }
        if (location) {
            matchCriteria.$and.push({ location: { $regex: location, $options: 'i' } }); // Case-insensitive search for location
        }
        if (workType) {
            matchCriteria.$and.push({ workType: { $regex: workType, $options: 'i' } }); // Case-insensitive search for workType
        }

        const posts = await jobsCollection.aggregate([
            {
                $match: matchCriteria
            },
            {
                $addFields: {
                    uidObjectId: { $toObjectId: "$uid" } // Convert `uid` to ObjectId
                }
            },
            {
                $lookup: {
                    from: 'users', // Join with the `users` collection
                    localField: 'uidObjectId', // Field from the posts collection (ObjectId)
                    foreignField: '_id', // Field from the users collection (ObjectId)
                    as: 'userInfo' // Resulting field in the posts collection
                }
            },
            {
                $unwind: {
                    path: '$userInfo',
                    preserveNullAndEmptyArrays: true // Include posts even if no matching user is found
                }
            },
            {
                $project: {
                    title: 1,
                    location: 1,
                    workType: 1,
                    description: 1,
                    uid: 1,
                    createdAt: 1,
                    likes: 1,
                    'userInfo.first_name': 1,
                    'userInfo.last_name': 1,
                    'userInfo.email': 1,
                    'userInfo.ProfileImgURL': 1
                }
            },
            {
                $sort: { createdAt: -1 } // Sort posts by creation date in descending order
            },
            {
                $skip: skip // Skip the number of items based on the current page
            },
            {
                $limit: limit // Limit the number of items per page
            }
        ]).toArray();

        res.send(posts);

    } catch (error) {
        res.status(500).send({ message: 'An error occurred', error: error.message });
    }
});



// Route to get a single job post by id
router.get('/:id', async (req, res) => {
    const jobId = req.params.id;

    try {
        const job = await jobsCollection.findOne({ _id: new ObjectId(jobId) });
        if (job) {
            res.send(job);
        } else {
            res.status(404).send({ message: "Job not found" });
        }
    } catch (error) {
        res.status(500).send({ message: "Error fetching job", error });
    }
});

// Route to create a new job post
router.post('/', async (req, res) => {
    const data = req.body;
    data.createdAt = new Date(); // Add createdAt timestamp

    try {
        const result = await jobsCollection.insertOne(data); // Insert new job post
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Error creating job", error });
    }
});

module.exports = router;
