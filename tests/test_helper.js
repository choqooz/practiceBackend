const Blog = require('../models/blog');
const User = require('../models/user');

const initialBlogs = [
  {
    title: 'First blog',
    author: 'Me',
    url: 'http://www.example.com',
    likes: 5,
  },
  {
    title: 'Second blog',
    author: 'You',
    url: 'http://www.example.com',
    likes: 10,
  },
];

const nonExistingId = async () => {
  const blog = new Blog({
    title: 'willremovethissoon',
    author: 'Me',
    url: 'http://www.example.com',
    likes: 5,
  });
  await blog.save();
  await blog.remove();

  return blog._id.toString();
};

const blogsInDb = async () => {
  const blogs = await Blog.find({});
  return blogs.map((blog) => blog.toJSON());
};

const usersInDb = async () => {
  const users = await User.find({});
  return users.map((u) => u.toJSON());
};

module.exports = {
  initialBlogs,
  nonExistingId,
  blogsInDb,
  usersInDb,
};
