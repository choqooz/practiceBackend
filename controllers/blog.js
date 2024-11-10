const blogRouter = require('express').Router();
const Blog = require('../models/blog');
const User = require('../models/user');
const mongoose = require('mongoose');

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({}).populate('user', { username: 1, name: 1 });
  const userFromRequest = request.user; // Obtener el usuario desde la request

  response.json(blogs);
});

blogRouter.get('/:id', async (request, response) => {
  const blog = await Blog.findById(request.params.id);

  if (blog) {
    response.json(blog);
  } else {
    response.status(404).end();
  }
});
blogRouter.post('/', async (request, response, next) => {
  const body = request.body;
  const token = request.token; // Obtener el token desde la request
  const userFromRequest = request.user; // Obtener el usuario desde la request

  if (!token) {
    // Lanza un error específico si no hay token
    return next({ name: 'JsonWebTokenError', message: 'jwt must be provided' });
  }

  if (!userFromRequest._id.toString()) {
    return next({
      name: 'JsonWebTokenError',
      message: 'Token missing or invalid',
    });
  }

  const user = await User.findById(userFromRequest._id.toString());

  if (!body.title || !body.url) {
    return response.status(400).json({ error: 'Title and URL are required' });
  }

  const blog = new Blog({
    title: body.title,
    author: body.author,
    url: body.url,
    likes: body.likes || 0,
    user: user._id,
  });

  const savedBlog = await blog.save();
  user.blogs = user.blogs.concat(savedBlog._id);
  await user.save();

  response.status(201).json(savedBlog);
});

blogRouter.delete('/:id', async (request, response) => {
  const id = request.params.id; // Obtener el ID desde los parámetros
  const blog = await Blog.findById(id);
  const token = request.token; // Obtener el token desde la request
  const userFromRequest = request.user; // Obtener el usuario desde la request

  if (!blog) {
    return response.status(404).json({ error: 'Blog not found' });
  }

  if (!token) {
    return response.status(401).json({ error: 'jwt must be provided' });
  }

  if (!userFromRequest._id.toString()) {
    return response.status(401).json({ error: 'Token missing or invalid' });
  }

  if (blog.user.toString() !== userFromRequest._id.toString()) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const result = await Blog.findByIdAndDelete(new mongoose.Types.ObjectId(id)); // Usar new

  if (!result) {
    return response.status(404).json({ error: 'Blog not found' });
  }

  response.send(result).status(204);
});

blogRouter.put('/:id', async (request, response) => {
  const id = request.params.id;
  const body = request.body;

  const blog = {
    likes: body.likes,
  };

  const updatedBlog = await Blog.findByIdAndUpdate(id, blog, { new: true });
  response.status(200).json(updatedBlog);
});

module.exports = blogRouter;
