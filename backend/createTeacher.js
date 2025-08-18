// backend/createTeacher.js
const mongoose = require('mongoose');
const User = require('./models/User');

// It's not ideal to have the connection string here and in index.js
// but for now this is fine for a simple script.
const mongoURI = 'mongodb://localhost:27017/classroom-money';

const createTeacher = async (username, password) => {
  if (!username || !password) {
    console.log('Usage: node createTeacher.js <username> <password>');
    process.exit(1);
  }

  await mongoose.connect(mongoURI);

  try {
    const teacher = new User({
      username,
      password, // In a real app, hash this!
      role: 'teacher',
      status: 'active'
    });
    await teacher.save();
    console.log(`Teacher ${username} created successfully.`);
  } catch (error) {
    console.error('Error creating teacher:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from database.');
  }
};

const [,, username, password] = process.argv;
createTeacher(username, password);
