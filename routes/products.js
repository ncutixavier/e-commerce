const express = require('express')
const { Product } = require('../models/product')
const { Category } = require('../models/category')
const mongoose = require('mongoose')
const router = express.Router()
const multer = require('multer')

const FILE_TYPE_MAP = {
    'image/png': 'png',
    'image/jpg': 'jpg',
    'image/jpeg': 'jpeg',
}
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const isValid = FILE_TYPE_MAP[file.mimetype];
        let upload_error = new Error('Invalid image type')
        if (isValid) {
            upload_error = null
        }
        cb(upload_error, 'public/uploads')
    },
    filename: function (req, file, cb) {
        const fileName = file.originalname.split(' ').join('_')
        const extension = FILE_TYPE_MAP[file.mimetype]
        cb(null, `${fileName}_${Date.now()}.${extension}`)
    }
})

const uploadOptions = multer({ storage: storage })

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

router.post('/', uploadOptions.single('image'), async (req, res) => {
    let cat = await Category.findById(req.body.category)
    if (!cat)
        return res.status(400).send('Invalid category')

    let file = req.file
    if (!file)
        return res.status(400).send('Image is required!')

    const file_name = req.file.filename
    const base_path = `${req.protocol}://${req.get('host')}/public/uploads/`
    let product = new Product({
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: `${base_path}${file_name}`,
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

router.put('/:id', uploadOptions.single('image'), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Product is no longer existed')
    }
    let cat = await Category.findById(req.body.category)
    if (!cat)
        return res.status(400).send('Invalid category')

    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).send('Invalid product')

    const file = req.file
    let image_path
    if (file) {
        const file_name = req.file.filename
        const base_path = `${req.protocol}://${req.get('host')}/public/uploads/`
        image_path = `${base_path}${file_name}`
    } else {
        image_path = product.image
    }

    let updatedProduct = await Product.findByIdAndUpdate(
        req.params.id, {
        name: req.body.name,
        description: req.body.description,
        richDescription: req.body.richDescription,
        image: image_path,
        brand: req.body.brand,
        price: req.body.price,
        category: req.body.category,
        countInStock: req.body.countInStock,
        rating: req.body.rating,
        numReviews: req.body.numReviews,
        isFeatured: req.body.isFeatured
    }, { new: true }
    )
    if (!updatedProduct)
        return res.status(400).send('product cannot be updated')

    res.send(updatedProduct)
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
                message: 'user not existed'
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

router.put('/gallery-images/:id', uploadOptions.array('images', 10), async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        return res.status(400).send('Product is no longer existed')
    }

    const files = req.files
    let images_path = []
    const base_path = `${req.protocol}://${req.get('host')}/public/uploads/`

    if (files) {
        files.map(file => {
            images_path.push(`${base_path}${file.filename}`)
        })
    }
    let updatedProduct = await Product.findByIdAndUpdate(
        req.params.id, {
        images: images_path
    }, { new: true })
    if (!updatedProduct)
        return res.status(400).send('product cannot be updated')

    res.send(updatedProduct)
})

module.exports = router
