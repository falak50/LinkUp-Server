const express = require('express');
const router = express.Router();
const client = require('../db');

const notificationsCollection = client.db("LinkUp").collection("notifications");

// Route to get all notifications
router.get('/', async (req, res) => {
    try {
        // Fetch all notifications
        const notifications = await notificationsCollection.find().toArray();

        // Send notifications in response
        res.status(200).json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Route to get notifications by ownerId
router.get('/owner/:ownerId', async (req, res) => {
    try {
        // Get the ownerId from the URL parameters
        const { ownerId } = req.params;

        // Validate ownerId
        if (!ownerId) {
            return res.status(400).json({ message: 'ownerId is required' });
        }

        // Fetch notifications that match the ownerId
        const notifications = await notificationsCollection.find({ ownerId }).toArray();

        // Send notifications in response
        res.status(200).json({ notifications });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
