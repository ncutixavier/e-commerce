const express = require('express')
const { Category } = require('../models/category')
const router = express.Router()

router.get('/', async (req, res) => {
    const category_list = await Category.find()
    if (!category_list) {
        res.status(500).json({
            success: 'false'
        })
    }
    res.status(200).send(category_list)
})

router.get('/:id', async (req, res) => {
    const category = await Category.findById(req.params.id)
    if (!category) {
        return res.status(500).json({
            message: 'category is no longer existed'
        })
    }
    res.status(200).send(category)
})

router.post('/', async (req, res) => {
    const { name, icon, color } = req.body
    let category = new Category({
        name, icon, color
    })

    category = await category.save()
    if (!category) {
        return res.status(404).send('The category cannot be created')
    }
    res.send(category)
})

router.put('/:id', async (req, res) => {
    const { name, icon, color } = req.body
    let category = await Category.findByIdAndUpdate(
        req.params.id, { name, icon, color }, { new: true }
    )
    if (!category)
        return res.status(400).send('category cannot be updated')

    res.send(category)
})

router.delete('/:id', (req, res) => {
    Category.findByIdAndRemove(req.params.id)
        .then(category => {
            if (category) {
                return res.status(200).json({
                    message: 'category is deleted'
                })
            } else {
                return res.status(404).json({
                    message: 'category not found'
                })
            }
        })
        .catch(err => {
            return res.status(400).json({
                message: 'category not existed'
            })
        })
})

module.exports = router
