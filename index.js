if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const express = require('express');
const app = express();
const path = require('path')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const Joi = require('joi');

const User = require('./models/user')
const catchAsync = require('./utils/catchAsync')
const ExpressError = require('./utils/ExpressError')
const users = require('./routes/users')


const Port = process.env.PORT;
const dbUrl = process.env.DB_URL
const mongoose = require('mongoose');
mongoose.connect(dbUrl)
    .then(() => {
        console.log("DB Connected");
    })
    .catch((e) => {
        console.log("Mongo Error");
        console.log(e);
    })


app.engine('ejs', ejsMate)

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));
app.use(express.static('public'));

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use('/user', users)

app.get('/', (req, res) => {
    res.render('home');
})


app.get('/login', (req, res) => {
    res.render('login')
})

app.all('*', (req, res, next) => {
    next(new ExpressError('Page Not Found !', 404));
})

app.use((err, req, res, next) => {
    const { statusCode = 500 } = err;
    if (!err.message) {
        err.message = "Oh no ! Something went wrong !"
    }
    res.status(statusCode).render('error', { err });
})

app.listen(Port, () => {
    console.log(`Listening at Port : ${Port} `);
})