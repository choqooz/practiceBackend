const express = require('express');
const app = express();
const cors = require('cors');
const blogRouter = require('./controllers/blog');
const userRouter = require('./controllers/user');
const loginRouter = require('./controllers/login');
const {
  errorHandler,
  unknownEndpoint,
  tokenExtractor,
  userExtractor,
} = require('./utils/middleware');
require('express-async-errors');
// Middlewares
app.use(cors());
app.use(express.json());
app.use(tokenExtractor);

// Rutas
app.use('/api/blogs', userExtractor, blogRouter);
app.use('/api/users', userRouter);
app.use('/api/login', loginRouter);

// Manejo de errores
app.use(unknownEndpoint);
app.use(errorHandler);
// Exporta la aplicación sin iniciar el servidor
module.exports = app;
