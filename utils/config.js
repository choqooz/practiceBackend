const PORT = process.env.PORT || 3001;
const MONGODB_URI =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_MONGODB_URI
    : process.env.MONGODB_URI;

console.log('Database URI in use:', MONGODB_URI); // Para verificar URI correcta en consola
module.exports = { PORT, MONGODB_URI };
