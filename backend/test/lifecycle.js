const mongoose = require('mongoose');
const redis = require('../src/config/redis');
const { closeResources } = require('../src/config/resources');
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000, autoIndex: false });
  await mongoose.connection.dropDatabase();
  for (const name of ['User', 'Ambulance', 'EmergencySession', 'Hospital']) require('../src/models/' + name);
  await Promise.all(Object.values(mongoose.models).map(model => model.createIndexes()));
  await require('../src/config/redis').flushdb();
});
global.closeTestResources = async () => {
  await closeResources();
  if (redis.status !== 'end') await redis.quit();
  await mongoose.disconnect();
};
