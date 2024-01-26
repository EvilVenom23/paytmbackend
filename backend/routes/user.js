
const express = require('express');
const zod = require('zod');
const {User, Account} = require('../db')
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../config');
const { authMiddleware } = require('../middleware');


const router = express.Router();

const signupBody = zod.object({
    username: zod.string().email(),
	firstName: zod.string(),
	lastName: zod.string(),
	password: zod.string()
})

router.post('/signup', async (req, res) => {
   
    const { success } = signupBody.safeParse(req.body);

    if (!success) {
        res.status(411).json({
            msg: "Incorrect inputs"
        });
        return;  
    }

    const existingUser = await User.findOne({ 
        username: req.body.username
    });

    if (existingUser) {
        res.status(411).json({
            msg: "Email already taken"
        });
        return;  
    }
    
   const user =  await User.create({
    username : req.body.username,
    firstName : req.body.firstName,
    lastName : req.body.lastName,
    password : req.body.password
   })

   const userId = user._id;

   await Account.create({
    userId,
    balance : 1 + Math.random()*10000
   })

   const token = jwt.sign({
    userId
   }, JWT_SECRET);

   res.json({
    message: "User created successfully",
    token: token
   })

})

const signinBody = zod.object({
    username : zod.string().email(),
    password : zod.string()
})
router.post('/signin', async (req, res) => {
    const body  = req.body;
    const {success} = signinBody.safeParse(body);
    
    if(!success){
        res.status(411).json({
            message: "Error while logging in as wrong input"
        })
    }
    const user = await User.findOne({
        username : body.username,
        password : body.password
    })

    if(!user){
        res.status(411).json({
            message: "Error while logging in"
        })
    }

    const token = jwt.sign({
        userId : user._id
    }, JWT_SECRET);

    res.status(200).json({
        token
    })

})

const updateBody = zod.object({
    password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),

})

router.put('/', authMiddleware ,async (req, res) => {
    const body = req.body;
     const {success} = updateBody.safeParse(body);

     if(!success){
        res.status(411).json({
            message: "Error while updating information"
        })
     }

     await User.updateOne(body ,{
        _id: req.userId
     })

     res.json({
        message: "Updated successfully"
    })

})

router.get('bulk', async (req, res) => {
    const filter = req.query.filter || "";
    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })

})

module.exports = router;



// npm audit fix --force