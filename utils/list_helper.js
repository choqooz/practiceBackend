const dummy = (blogs) => {
  return 1;
};

const totalLikes = (blogs) => {
  return blogs.reduce((sum, blog) => sum + blog.likes, 0);
};

const favoriteBlog = (blogs) => {
  return blogs.reduce(
    (max, blog) => (max.likes > blog.likes ? max : blog),
    blogs[0]
  );
};

const mostBlogs = (blogs) => {
  const authors = blogs.reduce((authors, blog) => {
    authors[blog.author] = (authors[blog.author] || 0) + 1;
    return authors;
  }, {});

  return Object.entries(authors).reduce(
    (max, author) => (max[1] > author[1] ? max : author),
    ['', 0]
  );
};

const mostLikes = (blogs) => {
  const authors = blogs.reduce((authors, blog) => {
    authors[blog.author] = (authors[blog.author] || 0) + blog.likes;
    return authors;
  }, {});

  return Object.entries(authors).reduce(
    (max, author) => (max[1] > author[1] ? max : author),
    ['', 0]
  );
};

module.exports = { dummy, totalLikes, favoriteBlog, mostBlogs, mostLikes };
