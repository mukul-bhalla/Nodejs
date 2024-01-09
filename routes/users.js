const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync')
const User = require('../models/user')
const Joi = require('joi');
const bcrypt = require('bcrypt');
const ExpressError = require('../utils/ExpressError')
const multer = require('multer');
const cloudinary = require('cloudinary')
const { storage } = require('../cloudinary')
const upload = multer({ storage })

const validateUser = (req, res, next) => {
    const userSchema = Joi.object({
        name: Joi.string().required(),
        email: Joi.string()
            .email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } }),
        phone: Joi.number().required(),
        password: Joi.string()
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

const requireLogin = (req, res, next) => {
    if (!req.session.user_id) {
        req.flash('error', "You need to login !");
        return res.redirect('/user/login');
    }
    next();
}



router.get('/register', (req, res) => {
    res.render('home');
})

router.get('/login', (req, res) => {
    res.render('login')
})

router.get('/index', requireLogin, catchAsync(async (req, res) => {
    const current = await User.findById(req.session.user_id);
    if (current.isAdmin) {
        const all = await User.find({});
        return res.render('index', { all });
    }
    else {
        req.flash('error', "You are not authenticated !");
        res.redirect('/user/login')
    }
}))


router.post('/login2', async (req, res) => {
    const { phone, password } = req.body;
    const user = await User.findOne({ phone });
    if (!user) {
        req.flash('error', "Incorrect Username Or Password");
        return res.redirect('/user/login');
    }
    const validPassword = await bcrypt.compare(password, user.password);
    if (validPassword) {
        req.session.user_id = user._id;
        req.flash('success', "Successfully Logged In !")
        res.redirect(`/user/${user._id}`);
    }
    else {
        req.flash('error', "Incorrect Username Or Password");
        return res.redirect('/user/login');
    }

})

router.post('/logout', (req, res) => {
    req.session.user_id = null;
    req.flash('success', "Successfully Logged Out !");
    res.redirect('/');

})

router.get('/:id', requireLogin, catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id)
    if (!user) {
        req.flash('error', "Cannot Find The User !");
        return res.redirect('/user/login')
    }
    const current = await User.findById(req.session.user_id)
    if (user._id.equals(req.session.user_id) || current.isAdmin) {
        res.render('show', { user });
    }
    else {
        req.flash('error', "You are not authenticated !");
        res.redirect('/user/login');
    }

}))

router.post('/register', upload.single('profile'), validateUser, catchAsync(async (req, res, next) => {
    try {
        const { password } = req.body;
        const hash = await bcrypt.hash(password, 12);
        const user = new User({ ...req.body, password: hash });
        if (req.file) {
            const { filename, path } = req.file;
            user.profile = { filename: filename, url: path }
        }
        await user.save();
        // console.log(user);
        req.session.user_id = user._id;
        req.flash('success', 'Successfully Created Your Account !');
        res.redirect(`/user/${user._id}`)
    } catch (e) {
        req.flash('error', e.message)
        res.redirect('/user/register');
    }




}))


router.get('/:id/edit', requireLogin, catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        req.flash('error', "Cannot Find The User !");
        return res.redirect('/')
    }
    const current = await User.findById(req.session.user_id)
    if (user._id.equals(req.session.user_id) || current.isAdmin) {

        res.render('edit', { user });
    }
    else {
        req.flash('error', "You are not authenticated !");
        return res.redirect('/user/login')
    }
}))


router.put('/:id', requireLogin, upload.single('profile'), validateUser, catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    const current = await User.findById(req.session.user_id)
    if (user._id.equals(req.session.user_id) || current.isAdmin) {
        const user = await User.findByIdAndUpdate(id, { ...req.body });
        if (req.file) {
            const { filename, path } = req.file;
            await cloudinary.uploader.destroy(user.profile.filename);
            user.profile = { filename: filename, url: path };
        }
        await user.save();
        req.flash('success', "Successfully Updated Account Details !")
        return res.redirect(`/user/${id}`)
    }
    else {
        req.flash('error', "You are not authenticated !!")
        res.redirect('/user/login')
    }
}))

router.delete('/:id', requireLogin, catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    const current = await User.findById(req.session.user_id)
    if (user._id.equals(req.session.user_id) || current.isAdmin) {
        await User.findByIdAndDelete(id)
        req.flash('success', "Successfully Deleted Your Account !")
        res.redirect('/user/register');
    }
    else {
        req.flash('error', "You are not authenticated !!")
        res.redirect('/user/login')
    }

}))

module.exports = router;
