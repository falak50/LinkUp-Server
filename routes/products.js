const express = require('express');
const router = express.Router();
const { ObjectId } = require('mongodb');
const client = require('../db');
const upload = require('../multerConfig');

const postsCollection = client.db("LinkUp").collection("products");
const userCollection = client.db("LinkUp").collection("users");
const path = require('path');
const fs = require('fs').promises;

router.post('/addSellPost', upload.array('images'), async (req, res) => {
    try {
        const { uid, title, category, location, condition, brand, model, edition, authenticity, features, specifications, priceAmount, price } = req.body;

        // Log category for debugging
        console.log("category", category);

        // Ensure that uid is of the ObjectId type if necessary
        const userId = new ObjectId(uid);

        // Process the images
        const imagePaths = [];
        if (req.files) {
            for (const file of req.files) {
                const uploadPath = path.join(__dirname, 'uploads', file.filename); // Adjust the path as needed
                imagePaths.push(file.filename); // Store paths to the uploaded images
            }
        }

        // Ensure unique categories
        // const uniqueCategories = [...new Set(category)];

        // Create the product object
        const product = {
            uid: userId,
            title: title || "No Title", // Default value if undefined
            category: category[0],
            location: location || "No Location",
            condition: condition || "Unknown Condition",
            brand: brand || "Unknown Brand",
            model: model || "Unknown Model",
            edition: edition || "Unknown Edition",
            authenticity: authenticity || "Unknown Authenticity",
            features: features || "No Features",
            specifications: specifications || "No Specifications",
            priceAmount: Number(priceAmount) || 0, // Ensure it's a number
            price: price !== "undefined" ? price : "Not Specified",
            images: imagePaths.length ? imagePaths : [] // Use processed image paths

        };
        product.createdAt = new Date();

        // Save the product to the database
        const result = await postsCollection.insertOne(product); // Insert the product

        // Respond with the created product
        res.status(201).json({ message: "Product added successfully", product: { ...product, _id: result.insertedId } });
      
    } catch (error) {
        console.error("Error adding product", error);
        res.status(500).json({ message: "Error adding product", error: error.message });
    }
});
// Route to update an existing product
router.put('/updateSellPost/:id', upload.array('images'), async (req, res) => {
    try {
        const productId = req.params.id;
        const { uid, title, category, location, condition, brand, model, edition, authenticity, features, specifications, priceAmount, price, imagesToRemove } = req.body;

        const userId = new ObjectId(uid);
        const imagePaths = [];

        // Fetch existing product data first
        const existingProduct = await postsCollection.findOne({ _id: new ObjectId(productId) });

        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Process uploaded images
        if (req.files) {
            req.files.forEach(file => {
                imagePaths.push(file.filename);
            });
        }

        // Create the product object to update
        const updatedProduct = {
            uid: userId,
            title: title || existingProduct.title,
            category: Array.isArray(category) && category.length > 0 ? category[0] : existingProduct.category,
            location: location || existingProduct.location,
            condition: condition || existingProduct.condition,
            brand: brand || existingProduct.brand,
            model: model || existingProduct.model,
            edition: edition || existingProduct.edition,
            authenticity: authenticity || existingProduct.authenticity,
            features: features || existingProduct.features,
            specifications: specifications || existingProduct.specifications,
            priceAmount: Number(priceAmount) || existingProduct.priceAmount,
            price: price !== undefined ? price : existingProduct.price,
            images: [...existingProduct.images, ...imagePaths] // Combine old and new images
        };

        // Handle image removal
        if (Array.isArray(imagesToRemove) && imagesToRemove.length > 0) {
            // Filter out the images to be removed
            updatedProduct.images = updatedProduct.images.filter(image => !imagesToRemove.includes(image));

            // Optional: Delete the actual image files from the server
            await Promise.all(imagesToRemove.map(async (image) => {
                const imagePath = path.join(__dirname, 'uploads', image); // Adjust path as needed
                try {
                    await fs.access(imagePath);
                    await fs.unlink(imagePath);
                    console.log(`Deleted image: ${imagePath}`);
                } catch (err) {
                    console.error(`File not found or cannot be accessed: ${imagePath}`, err);
                }
            }));
        }

        const result = await postsCollection.updateOne(
            { _id: new ObjectId(productId) },
            { $set: updatedProduct }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.status(200).json({ message: "Product updated successfully", product: { ...updatedProduct, _id: productId } });
    } catch (error) {
        console.error("Error updating product", error);
        res.status(500).json({ message: "Error updating product", error: error.message });
    }
});

// Route to delete a product
router.post('/deleteSellPost/:id', async (req, res) => {
    try {
        const productId = req.params.id;

        // Validate product ID
        if (!ObjectId.isValid(productId)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        // Fetch the existing product to get image URLs
        const existingProduct = await postsCollection.findOne({ _id: new ObjectId(productId) });

        if (!existingProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Delete associated images if they exist
        if (existingProduct.images && existingProduct.images.length > 0) {
            await Promise.all(existingProduct.images.map(async (image) => {
                const imagePath = path.join(__dirname, 'uploads', image); // Adjust path as needed
                try {
                    await fs.access(imagePath); // Check if file exists
                    await fs.unlink(imagePath); // Delete the file
                    console.log(`Deleted image: ${imagePath}`);
                } catch (err) {
                    console.error(`File not found or cannot be accessed: ${imagePath}`, err);
                }
            }));
        }

        // Delete the product document
        const result = await postsCollection.deleteOne({ _id: new ObjectId(productId) });

        if (result.deletedCount === 1) {
            res.status(200).json({ message: 'Product deleted successfully' });
        } else {
            res.status(500).json({ message: 'Failed to delete product' });
        }
    } catch (error) {
        console.error('Error deleting product', error);
        res.status(500).json({ message: 'Error deleting product', error: error.message });
    }
});


// GET route to retrieve products by category
router.get('/category/:categoryName', async (req, res) => {
    const { categoryName } = req.params;
    const { title = '', location = '' } = req.query; // Default to empty strings if not provided

    try {
        // Build the filter for products
        const filter = { category: categoryName };

        // Apply title and location filters only if they are provided
        if (title) {
            filter.title = { $regex: title, $options: 'i' }; // Case-insensitive search
        }
        if (location) {
            filter.location = { $regex: location, $options: 'i' }; // Case-insensitive search
        }

        // Fetch products from the database that match the filter
        const filteredProducts = await postsCollection.find(filter).toArray();

        // Respond with the filtered products or an empty array if none found
        res.status(200).json(filteredProducts);
    } catch (error) {
        console.error("Error retrieving products:", error);
        res.status(500).json({
            message: "Error retrieving products",
            error: error.message // Return error message
        });
    }
});



router.get('/product/:productId', async (req, res) => {
    const { productId } = req.params;

    try {
        const product = await postsCollection.findOne({ _id: new ObjectId(productId) });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.status(200).json(product);
    } catch (error) {
        console.error("Error retrieving product:", error);
        res.status(500).json({ message: "Error retrieving product", error: error.message });
    }
});

router.get('/', async (req, res) => {
    try {
        // Retrieve all posts from the products collection
        const posts = await postsCollection.find({}).toArray();

        // Check if posts are found
        if (posts.length === 0) {
            return res.status(404).json({ message: "No posts found" });
        }

        // Send the posts as the response
        res.status(200).json(posts);
    } catch (error) {
        console.error("Error retrieving posts", error);
        res.status(500).json({ message: "Error retrieving posts", error: error.message });
    }
});
// DELETE route to remove all products
// router.get('/deleteAllSellPosts', async (req, res) => {
//     try {
//         // Delete all products from the products collection
//         const result = await postsCollection.deleteMany({});

//         // Respond with the number of deleted products
//         res.status(200).json({ message: `${result.deletedCount} products deleted successfully` });
//     } catch (error) {
//         console.error("Error deleting products", error);
//         res.status(500).json({ message: "Error deleting products", error: error.message });
//     }
// });


module.exports = router;
