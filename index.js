if (process.env.NODE_ENV !== "production") {
    require('dotenv').config();
}
const express = require('express');
const app = express();
const path = require('path')

const User = require('./models/user')

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

app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.get('/', (req, res) => {
    res.render('home');
})

app.post('/register', async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.send("Done !!");
})


app.get('/login', (req, res) => {
    res.render('login')
})

app.listen(Port, () => {
    console.log(`Listening at Port : ${Port} `);
})