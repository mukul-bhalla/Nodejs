const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync')
const User = require('../models/user')
const Joi = require('joi');
const bcrypt = require('bcrypt');
const ExpressError = require('../utils/ExpressError')

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
    res.redirect('/user/login');

})

router.get('/:id', requireLogin, catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id)
    if (!user) {
        req.flash('error', "Cannot Find The User !");
        return res.redirect('/user/login')
    }
    if (user._id.equals(req.session.user_id) || user.isAdmin) {
        res.render('show', { user });
    }
    else {
        req.flash('error', "You are not authenticated !");
        res.redirect('/user/login');
    }

}))

router.post('/register', validateUser, catchAsync(async (req, res, next) => {
    try {
        const { password } = req.body;
        const hash = await bcrypt.hash(password, 12);
        const user = new User({ ...req.body, password: hash });
        await user.save();
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
    if (user._id.equals(req.session.user_id || user.isAdmin)) {

        res.render('edit', { user });
    }
    else {
        req.flash('error', "You are not authenticated !");
        return res.redirect('/user/login')
    }
}))


router.put('/:id', requireLogin, validateUser, catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (user._id.equals(req.session.user_id) || user.isAdmin) {
        await User.findByIdAndUpdate(id, { ...req.body });
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
    if (user._id.equals(req.session.user_id) || user.isAdmin) {
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
