const express = require('express')
const { Order } = require('../models/order')
const { OrderItem } = require('../models/order-item')
const router = express.Router()

router.get('/', async (req, res) => {
    const orders_list = await Order.find()
        .populate('user', 'name').sort({ 'dateCreated': -1 })
    if (!orders_list) {
        res.status(500).json({
            success: 'false'
        })
    }
    res.status(200).send(orders_list)
})

router.get('/:id', async (req, res) => {
    const order = await Order.findById(req.params.id)
        .populate('user', 'name')
        .populate({
            path: 'orderItem',
            populate: {
                path: 'product',
                populate: 'category'
            }
        })
    if (!order) {
        res.status(500).json({
            success: 'false'
        })
    }
    res.status(200).send(order)
})

router.put('/:id', async (req, res) => {
    const { status } = req.body
    let order = await Order.findByIdAndUpdate(
        req.params.id, { status }, { new: true }
    )
    if (!order)
        return res.status(400).send('order cannot be updated')

    res.send(order)
})

router.delete('/:id', (req, res) => {
    Order.findByIdAndRemove(req.params.id).then(async order => {
        if (order) {
            await order.orderItems.map(async orderItem => {
                await OrderItem.findByIdAndRemove(orderItem)
            })
            return res.status(200).json({ success: true, message: 'the order is deleted!' })
        } else {
            return res.status(404).json({ success: false, message: "order not found!" })
        }
    }).catch(err => {
        return res.status(500).json({ success: false, error: err })
    })
})

router.post('/', async (req, res) => {
    const orderItemsIds = Promise.all(req.body.orderItems.map(async orderItem => {
        let newOrderItem = new OrderItem({
            quantity: orderItem.quantity,
            product: orderItem.product
        })

        newOrderItem = await newOrderItem.save()
        return newOrderItem._id
    }))

    const orderItemsIdsResolved = await orderItemsIds

    const totalPrices = await Promise.all(orderItemsIdsResolved.map(async id => {
        const orderItem = await OrderItem.findById(id).populate('product', 'price')
        const totalPrice = orderItem.product.price * orderItem.quantity
        return totalPrice
    }))

    const totalPrice = totalPrices.reduce((a, b) => a + b, 0)

    let order = new Order({
        orderItems: orderItemsIdsResolved,
        shippingAddress1: req.body.shippingAddress1,
        shippingAddress2: req.body.shippingAddress2,
        city: req.body.city,
        country: req.body.country,
        phone: req.body.phone,
        status: req.body.status,
        totalPrice: totalPrice,
        user: req.body.user
    })
    order = await order.save()
    if (!order)
        return res.status(400).send('Order cannot be created')
    res.send(order)
})

module.exports = router
