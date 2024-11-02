const mongoose = require('mongoose');
const { test, before, after, beforeEach, describe } = require('node:test');
const supertest = require('supertest');
const app = require('../app');
const assert = require('assert');
const Blog = require('../models/blog');
const helper = require('./test_helper');

const api = supertest(app);

before(async () => {
  await mongoose.connect(process.env.TEST_MONGODB_URI);
});

beforeEach(async () => {
  await Blog.deleteMany({});

  const blogObjects = helper.initialBlogs.map((blog) => new Blog(blog));
  const promiseArray = blogObjects.map((blog) => blog.save());
  await Promise.all(promiseArray);
});

describe('Initial blogs', () => {
  test('there are two notes', async () => {
    const response = await api.get('/api/blogs');
    assert.strictEqual(response.body.length, helper.initialBlogs.length);
  });

  test('the first note is about HTTP methods', async () => {
    const response = await api.get('/api/blogs');
    const contents = response.body.map((e) => e.author);
    assert(contents.includes('Me'));
  });
});

describe('Adding blogs', () => {
  test('a valid blog can be added', async () => {
    const newBlog = {
      title: 'Third blog',
      author: 'Them',
      url: 'http://www.example.com',
      likes: 15,
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);

    const contents = blogsAtEnd.map((r) => r.author);
    assert(contents.includes('Them'));
  });

  test('blog without content is not added', async () => {
    const newBlog = { likes: 10 };

    await api.post('/api/blogs').send(newBlog).expect(400);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length);
  });

  test('likes default to 0', async () => {
    const newBlog = {
      title: 'Third blog',
      author: 'Them',
      url: 'http://www.example.com',
    };

    await api
      .post('/api/blogs')
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    const addedBlog = blogsAtEnd.find((blog) => blog.author === 'Them');
    assert.strictEqual(addedBlog.likes, 0);
  });
});

describe('Viewing a specific blog', () => {
  test('a specific blog can be viewed', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToView = blogsAtStart[0];

    const resultBlog = await api
      .get(`/api/blogs/${blogToView.id}`)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const expectedBlog = { ...blogToView, id: blogToView.id.toString() };
    assert.deepStrictEqual(resultBlog.body, expectedBlog);
  });
});

describe('Deleting a blog', () => {
  test('a blog can be deleted', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToDelete = blogsAtStart[0];

    await api.delete(`/api/blogs/${blogToDelete.id.toString()}`).expect(204);

    const blogsAtEnd = await helper.blogsInDb();
    const contents = blogsAtEnd.map((r) => r.author);
    assert(!contents.includes(blogToDelete.author));

    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length - 1);
  });
});

describe('Blog properties', () => {
  test('attribute id exists', async () => {
    const response = await api.get('/api/blogs');
    assert(response.body[0].id);
  });
});

describe('Updating a blog', () => {
  test('a blog can be updated', async () => {
    const blogsAtStart = await helper.blogsInDb();
    const blogToUpdate = blogsAtStart[0];

    const updatedBlog = { ...blogToUpdate, likes: 100 };

    await api
      .put(`/api/blogs/${blogToUpdate.id}`)
      .send(updatedBlog)
      .expect(200)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    const processedBlog = blogsAtEnd.find((blog) => blog.id === blogToUpdate.id);
    assert.strictEqual(processedBlog.likes, 100);
  });
});

after(async () => {
  await mongoose.connection.close();
});
