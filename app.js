const express = require('express');
const app = express();
const cors = require('cors');
const blogRouter = require('./controllers/blog');
require('express-async-errors');

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/blogs', blogRouter);

// Exporta la aplicación sin iniciar el servidor
module.exports = app;
