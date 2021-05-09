const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const authJwt = require('./helpers/jwt')
const errorHandler = require('./helpers/error-handler')
const cors = require('cors')

require('dotenv').config()
const app = express()

app.use(cors())
app.options('*', cors())

app.get('/', (req, res) => {
    res.send("This is e-shop API")
})

app.use(bodyParser.json())
app.use(morgan('tiny'))
app.use(authJwt())
app.use(errorHandler)

const user_routes = require('./routes/users')
const product_routes = require('./routes/products')
const categories_routes = require('./routes/categories')

app.use('/api/v1/users', user_routes)
app.use('/api/v1/products', product_routes)
app.use('/api/v1/categories', categories_routes)

mongoose.connect(process.env.CON, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    dbName: 'eshop-db'
})
    .then(() => console.log('DB Connected!'))
    .catch(err => console.log(err))

app.listen(3000, () => {
    console.log('listening on port 3000')
})
