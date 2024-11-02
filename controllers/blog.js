const blogRouter = require('express').Router();
const Blog = require('../models/blog');
const mongoose = require('mongoose');

blogRouter.get('/', async (request, response) => {
  const blogs = await Blog.find({});
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

blogRouter.post('/', async (request, response) => {
  const blog = new Blog(request.body);

  if (!blog.title || !blog.url) {
    return response.status(400).json({ error: 'Title and URL are required' });
  }

  const savedBlog = await blog.save();
  response.status(201).json(savedBlog);
});

blogRouter.delete('/:id', async (request, response) => {
  const id = request.params.id; // Obtener el ID desde los parámetros
  const result = await Blog.findByIdAndDelete(new mongoose.Types.ObjectId(id)); // Usar new

  if (!result) {
    return response.status(404).json({ error: 'Blog not found' });
  }

  response.status(204).end();
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
