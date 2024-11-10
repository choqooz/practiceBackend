const userRouter = require('express').Router();
const bcrypt = require('bcrypt');
const User = require('../models/user');

userRouter.post('/', async (request, response) => {
  const body = request.body;

  // Validaciones
  if (!body.username || body.username.length < 3) {
    return response.status(400).json({
      error: 'username must be at least 3 characters long',
    });
  }

  if (!body.name) {
    return response.status(400).json({
      error: 'name is required',
    });
  }

  if (!body.password || body.password.length < 3) {
    return response.status(400).json({
      error: 'password must be at least 3 characters long',
    });
  }

  const existingUser = await User.findOne({
    username: body.username,
  });

  if (existingUser) {
    return response.status(400).json({
      error: 'username must be unique',
    });
  }

  // Hashear password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(body.password, saltRounds);

  // Crear usuario
  const user = new User({
    username: body.username,
    name: body.name,
    passwordHash,
  });

  const savedUser = await user.save();
  response.status(201).json(savedUser);
});

userRouter.get('/', async (request, response) => {
  const users = await User.find({}).populate('blogs', {
    url: 1,
    title: 1,
    author: 1,
  });
  response.json(users);
});

module.exports = userRouter;
