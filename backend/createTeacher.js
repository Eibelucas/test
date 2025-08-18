// backend/createTeacher.js
const Datastore = require('@seald-io/nedb');
const path = require('path');

const usersDB = new Datastore({ filename: path.join(__dirname, 'data/users.db'), autoload: true });

const createTeacher = async (username, password) => {
  if (!username || !password) {
    console.log('Usage: node createTeacher.js <username> <password>');
    process.exit(1);
  }

  try {
    const existingUser = await usersDB.findOneAsync({ username });
    if (existingUser) {
      console.log('Error: Username already exists.');
      return;
    }

    const teacher = {
      username,
      password, // In a real app, hash this!
      role: 'teacher',
      status: 'active'
    };
    await usersDB.insertAsync(teacher);
    console.log(`Teacher ${username} created successfully.`);
  } catch (error) {
    console.error('Error creating teacher:', error.message);
  }
};

const [,, username, password] = process.argv;
createTeacher(username, password);
