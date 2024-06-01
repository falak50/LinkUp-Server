// middleware.js
const express = require('express');
const cors = require('cors');
const path = require('path');  // <-- Add this line
const app = express();

app.use(cors());
app.use(express.json());
// app.use(express.static('/uploads'));
app.use('/images', express.static(path.join(__dirname, 'uploads/images')));

module.exports = app;