const mongoose = require('mongoose');
const { test, before, after, beforeEach, describe } = require('node:test');
const supertest = require('supertest');
const app = require('../app');
const assert = require('assert');
const Blog = require('../models/blog');
const helper = require('./test_helper');
const bcrypt = require('bcrypt');
const User = require('../models/user');

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
    const processedBlog = blogsAtEnd.find(
      (blog) => blog.id === blogToUpdate.id
    );
    assert.strictEqual(processedBlog.likes, 100);
  });
});

describe('when there is initially one user in db', () => {
  beforeEach(async () => {
    await User.deleteMany({});

    const passwordHash = await bcrypt.hash('sekret', 10);
    const user = new User({ username: 'root', passwordHash });

    await user.save();
  });

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    };

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1);

    const usernames = usersAtEnd.map((u) => u.username);
    assert(usernames.includes(newUser.username));
  });

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();

    assert(result.body.error.includes('username must be unique'));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test('creation fails with proper statuscode and message if username is less than 3 characters', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'ro',
      name: 'Superuser',
      password: 'salainen',
    };

    console.log('newUser', newUser);

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();

    assert(
      result.body.error.includes('username must be at least 3 characters long')
    );

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test('creation fails with proper statuscode and message if password is less than 3 characters', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'root2',
      name: 'Superuser',
      password: 'sa',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();

    assert(
      result.body.error.includes('password must be at least 3 characters long')
    );

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });

  test('creation fails with proper statuscode and message if name is missing', async () => {
    const usersAtStart = await helper.usersInDb();

    const newUser = {
      username: 'root2',
      password: 'salainen',
    };

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/);

    const usersAtEnd = await helper.usersInDb();

    assert(result.body.error.includes('name is required'));

    assert.strictEqual(usersAtEnd.length, usersAtStart.length);
  });
});

describe.only('adding a new blog with a token', () => {
  test.only('a valid blog can be added', async () => {
    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    };

    await api.post('/api/users').send(newUser);

    const loginResponse = await api.post('/api/login').send(newUser);

    const newBlog = {
      title: 'Third blog',
      author: 'Them',
      url: 'http://www.example.com',
      likes: 15,
    };

    await api
      .post('/api/blogs')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .send(newBlog)
      .expect(201)
      .expect('Content-Type', /application\/json/);

    const blogsAtEnd = await helper.blogsInDb();
    assert.strictEqual(blogsAtEnd.length, helper.initialBlogs.length + 1);

    const contents = blogsAtEnd.map((r) => r.author);
    assert(contents.includes('Them'));
  });
});
after(async () => {
  await mongoose.connection.close();
});
