const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

// --- Middleware ---
app.use(bodyParser.json());

// --- Database Connection ---
// IMPORTANT: Replace with your actual MongoDB connection string.
const mongoURI = 'mongodb://localhost:27017/classroom-money';

mongoose.connect(mongoURI)
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.log(err));

// --- Mongoose Schemas and Models ---
const User = require('./models/User');
const Account = require('./models/Account');

// --- API Routes ---

// User Registration
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (role === 'teacher') {
        return res.status(400).json({ message: "Teacher accounts cannot be created through this endpoint." });
    }

    const newUser = new User({
        username,
        password,
        role: 'student',
        status: 'pending'
    });
    await newUser.save();

    // Create an account for the student, but it will be inactive until approved.
    const newAccount = new Account({ user: newUser._id, balance: 0 });
    await newAccount.save();

    res.status(201).json({ message: "Registration successful, pending teacher approval.", user: newUser });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// User Login (dummy implementation)
app.post('/api/users/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password }); // In a real app, verify hashed password
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
    // In a real app, protect this route to ensure only teachers can access it.
    try {
        const pendingStudents = await User.find({ role: 'student', status: 'pending' });
        res.json(pendingStudents);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Approve a student
app.post('/api/admin/approve-student/:id', async (req, res) => {
    // In a real app, protect this route.
    try {
        const student = await User.findById(req.params.id);
        if (student && student.role === 'student') {
            student.status = 'active';
            await student.save();
            res.json({ message: 'Student approved successfully.' });
        } else {
            res.status(404).json({ message: 'Student not found.' });
        }
    } catch (error) => {
        res.status(500).json({ message: error.message });
    }
});

// Reject a student
app.post('/api/admin/reject-student/:id', async (req, res) => {
    // In a real app, protect this route.
    try {
        const student = await User.findById(req.params.id);
        if (student && student.role === 'student') {
            // Option 1: Set status to 'rejected'
            student.status = 'rejected';
            await student.save();
            // Option 2: Delete the user and their account
            // await Account.deleteOne({ user: student._id });
            // await User.deleteOne({ _id: student._id });
            res.json({ message: 'Student rejected successfully.' });
        } else {
            res.status(404).json({ message: 'Student not found.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


// Get all students (for teachers)
app.get('/api/students', async (req, res) => {
    // In a real app, you'd protect this route so only teachers can access it.
    try {
        const students = await User.find({ role: 'student', status: 'active' });
        res.json(students);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get a student's balance
app.get('/api/students/:id/balance', async (req, res) => {
    // In a real app, you'd protect this so only the student or a teacher can see it.
    try {
        const account = await Account.findOne({ user: req.params.id });
        if (account) {
            res.json({ balance: account.balance });
        } else {
            res.status(404).json({ message: 'Account not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Deposit money into a student's account (for teachers)
app.post('/api/students/:id/deposit', async (req, res) => {
    // In a real app, you'd protect this route so only teachers can access it.
    try {
        const { amount } = req.body;
        const account = await Account.findOne({ user: req.params.id });
        if (account) {
            account.balance += amount;
            await account.save();
            res.json({ message: 'Deposit successful', balance: account.balance });
        } else {
            res.status(404).json({ message: 'Account not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Withdraw money from a student's account (for teachers)
app.post('/api/students/:id/withdraw', async (req, res) => {
    // In a real app, you'd protect this route so only teachers can access it.
    try {
        const { amount } = req.body;
        const account = await Account.findOne({ user: req.params.id });
        if (account) {
            if (account.balance >= amount) {
                account.balance -= amount;
                await account.save();
                res.json({ message: 'Withdrawal successful', balance: account.balance });
            } else {
                res.status(400).json({ message: 'Insufficient funds' });
            }
        } else {
            res.status(404).json({ message: 'Account not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// --- Server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
