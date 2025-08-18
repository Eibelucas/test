const express = require('express');
const bodyParser = require('body-parser');
const Datastore = require('@seald-io/nedb');
const path = require('path');

const app = express();
const port = 3000;

// --- Middleware ---
app.use(bodyParser.json());

// --- Database Setup ---
const usersDB = new Datastore({ filename: path.join(__dirname, 'data/users.db'), autoload: true });
const accountsDB = new Datastore({ filename: path.join(__dirname, 'data/accounts.db'), autoload: true });

// --- Database Seeding ---
const seedAdminUser = async () => {
  try {
    // Using a callback with findOne to ensure we wait for the DB to be loaded.
    usersDB.findOne({ username: 'Admin' }, async (err, adminUser) => {
      if (err) {
        console.error('Error finding admin user:', err);
        return;
      }
      if (!adminUser) {
        console.log('Admin user not found, creating one...');
        const admin = {
          username: 'Admin',
          password: 'Lucaluc0',
          role: 'teacher',
          status: 'active'
        };
        await usersDB.insertAsync(admin);
        console.log('Admin user created successfully.');
      } else {
        console.log('Admin user already exists.');
      }
    });
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
};

// Seed the database when the server starts
seedAdminUser();


// --- API Routes ---

// User Registration
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (role === 'teacher') {
      return res.status(400).json({ message: "Teacher accounts cannot be created through this endpoint." });
    }

    const existingUser = await usersDB.findOneAsync({ username });
    if (existingUser) {
        return res.status(400).json({ message: "Username already exists." });
    }

    const newUser = {
      username,
      password, // In a real app, hash this!
      role: 'student',
      status: 'pending'
    };
    const createdUser = await usersDB.insertAsync(newUser);

    const newAccount = {
      userId: createdUser._id,
      balance: 0
    };
    await accountsDB.insertAsync(newAccount);

    res.status(201).json({ message: "Registration successful, pending teacher approval.", user: createdUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// User Login
app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await usersDB.findOneAsync({ username, password });
  if (user) {
    if (user.role === 'student' && user.status !== 'active') {
      return res.status(401).json({ message: `Your account is ${user.status}.` });
    }
    res.status(200).json({ message: "Logged in successfully", user });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

// --- Admin Routes for Teacher ---

// Get all pending students
app.get('/api/admin/pending-students', async (req, res) => {
  const pendingStudents = await usersDB.findAsync({ role: 'student', status: 'pending' });
  res.json(pendingStudents);
});

// Approve a student
app.post('/api/admin/approve-student/:id', async (req, res) => {
  await usersDB.updateAsync({ _id: req.params.id, role: 'student' }, { $set: { status: 'active' } });
  res.json({ message: 'Student approved successfully.' });
});

// Reject a student
app.post('/api/admin/reject-student/:id', async (req, res) => {
  await usersDB.updateAsync({ _id: req.params.id, role: 'student' }, { $set: { status: 'rejected' } });
  res.json({ message: 'Student rejected successfully.' });
});

// --- Student and Account Routes ---

// Get all active students
app.get('/api/students', async (req, res) => {
  const students = await usersDB.findAsync({ role: 'student', status: 'active' });
  res.json(students);
});

// Get a student's balance
app.get('/api/students/:id/balance', async (req, res) => {
  const account = await accountsDB.findOneAsync({ userId: req.params.id });
  if (account) {
    res.json({ balance: account.balance });
  } else {
    res.status(404).json({ message: 'Account not found' });
  }
});

// Deposit money
app.post('/api/students/:id/deposit', async (req, res) => {
  const { amount } = req.body;
  await accountsDB.updateAsync({ userId: req.params.id }, { $inc: { balance: amount } });
  const updatedAccount = await accountsDB.findOneAsync({ userId: req.params.id });
  res.json({ message: 'Deposit successful', balance: updatedAccount.balance });
});

// Withdraw money
app.post('/api/students/:id/withdraw', async (req, res) => {
  const { amount } = req.body;
  const account = await accountsDB.findOneAsync({ userId: req.params.id });
  if (account && account.balance >= amount) {
    await accountsDB.updateAsync({ userId: req.params.id }, { $inc: { balance: -amount } });
    const updatedAccount = await accountsDB.findOneAsync({ userId: req.params.id });
    res.json({ message: 'Withdrawal successful', balance: updatedAccount.balance });
  } else {
    res.status(400).json({ message: 'Insufficient funds or account not found.' });
  }
});

// --- Server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
