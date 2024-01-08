const express = require('express');
const router = express.Router();
const catchAsync = require('../utils/catchAsync')
const User = require('../models/user')
const Joi = require('joi');

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


router.get('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id)
    if (!user) {
        req.flash('error', "Cannot Find The User !");
        return res.redirect('/')
    }
    res.render('show', { user });
}))

router.post('/register', validateUser, catchAsync(async (req, res, next) => {
    const user = new User(req.body);
    await user.save();
    req.flash('success', 'Successfully Created Your Account !');
    res.redirect(`/user/${user._id}`)

}))


router.get('/:id/edit', catchAsync(async (req, res) => {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
        req.flash('error', "Cannot Find The User !");
        return res.redirect('/')
    }
    res.render('edit', { user });
}))


router.put('/:id', validateUser, catchAsync(async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndUpdate(id, req.body);
    req.flash('success', "Successfully Updated Account Details !")
    res.redirect(`/user/${id}`)
}))

router.delete('/:id', catchAsync(async (req, res) => {
    const { id } = req.params;
    await User.findByIdAndDelete(id)
    req.flash('success', "Successfully Deleted Your Account !")
    res.redirect('/')
}))

module.exports = router;
