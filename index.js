if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const express = require('express');
const app = express();
const path = require('path')
const methodOverride = require('method-override')
const ejsMate = require('ejs-mate')
const session = require('express-session');
const flash = require('connect-flash');


const ExpressError = require('./utils/ExpressError')
const users = require('./routes/users')


const Port = process.env.PORT;
const dbUrl = process.env.DB_URL
const mongoose = require('mongoose');
try {
    mongoose.connect(dbUrl, {
        writeConcern: { w: 'majority' },
    });
    console.log('Connected to MongoDB');
} catch (error) {
    console.error('Error connecting to MongoDB:', error);
}


app.engine('ejs', ejsMate)

app.use(express.urlencoded({ extended: true }))
app.use(methodOverride('_method'));
app.use(express.static('public'));

const sessionConfig = {
    secret: 'thisshouldbeasecret',
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly: true,
        expires: Date.now() + 1000 * 60 * 20,
        maxAge: 1000 * 60 * 20
    }
}
app.use(session(sessionConfig))
app.use(flash());

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user_id;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
})
app.use('/user', users)
app.get('/', (req, res) => {
    res.render('homepage')
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