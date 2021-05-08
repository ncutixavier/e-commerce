const express = require('express')
const { Product } = require('../models/product')
const { Category } = require('../models/category')
const mongoose = require('mongoose')
const router = express.Router()

router.get('/', async (req, res) => {
    let filter = {}
    if (req.query.categories) {
        filter = { category: req.query.categories.split(',') }
    }
    const product_list = await Product.find().populate('category')
    if (!product_list) {
        res.status(500).json({
            success: 'false'
        })
    }
    res.send(product_list)
})

router.get('/:id', async (req, res) => {
    const product = await Product.findById(req.params.id).populate('category')
    if (!product) {
        return res.status(500).json({
            message: 'product is no longer existed'
        })
    }
    res.status(200).send(product)
})

router.post('/', async (req, res) => {
    let cat = await Category.findById(req.body.category)
    if (!cat)
        return res.status(400).send('Invalid category')
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
    })
    product = await product.save()
    if (!product)
        return res.status(400).send('Product cannot be created')
    res.send(product)
})

router.put('/:id', async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Product is no longer existed')
    }
    let cat = await Category.findById(req.body.category)
    if (!cat)
        return res.status(400).send('Invalid category')

    let product = await Product.findByIdAndUpdate(
        req.params.id, {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: req.body.image,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
    }, { new: true }
    )
    if (!product)
        return res.status(400).send('product cannot be updated')

    res.send(product)
})

router.delete('/:id', (req, res) => {
    Product.findByIdAndRemove(req.params.id)
        .then(product => {
            if (product) {
                return res.status(200).json({
                    message: 'product is deleted'
                })
            } else {
                return res.status(404).json({
                    message: 'product not found'
                })
            }
        })
        .catch(err => {
            return res.status(400).json({
                message: 'category not existed'
            })
        })
})

router.get('/get/count', async (req, res) => {
    const count_product = await Product.countDocuments(count => count)
    if (!count_product) {
        res.status(500).json({
            success: 'false'
        })
    }
    res.send({
        products_count: count_product
    })
})

router.get('/get/featured/:count', async (req, res) => {
    const count = req.params.count ? req.params.count : 0
    const featured_product = await Product.find({ isFeatured: true }).limit(+count)
    if (!featured_product) {
        res.status(500).json({
            success: 'false'
        })
    }
    res.send(featured_product)
})

module.exports = router
