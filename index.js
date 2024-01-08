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

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))


const validateUser = (req, res, next) => {
    const userSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
        phone: Joi.number().required(),
        password: Joi.string().required()
    });
    const { error } = userSchema.validate(req.body);

    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    else {
        next()
    }
}

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/user/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id)
    res.render('show', { user });
}))


app.get('/user/:id/edit', catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    res.render('edit', { user });
}))


app.post('/register', validateUser, catchAsync(async (req, res, next) => {
    const userSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
        phone: Joi.number().required(),
        password: Joi.string().required()
    })
    const { error } = userSchema.validate(req.body);

    if (error) {
        const msg = error.details.map(el => el.message).join(',');
        throw new ExpressError(msg, 400);
    }
    const user = new User(req.body);
    await user.save();
    res.redirect(`/user/${user._id}`)

}))


app.get('/login', (req, res) => {
    res.render('login')
})

app.put('/user/:id', validateUser, catchAsync(async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, req.body);
    res.redirect(`/user/${id}`)
}))

app.delete('/user/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndDelete(id)
    res.redirect('/')
}))

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