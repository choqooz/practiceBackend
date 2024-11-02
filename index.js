const mongoose = require('mongoose');
const config = require('./utils/config');
const app = require('./app');
const logger = require('./utils/logger');

if (process.env.NODE_ENV !== 'test') {
  mongoose
    .connect(config.MONGODB_URI)
    .then(() => {
      logger.info('Connected to MongoDB');
      app.listen(config.PORT, () => {
        logger.info(`Server running on port ${config.PORT}`);
      });
    })
    .catch((error) => {
      logger.error('Error connecting to MongoDB:', error.message);
    });
}
