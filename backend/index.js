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
const groupsDB = new Datastore({ filename: path.join(__dirname, 'data/groups.db'), autoload: true });
const recipesDB = new Datastore({ filename: path.join(__dirname, 'data/recipes.db'), autoload: true });
const votesDB = new Datastore({ filename: path.join(__dirname, 'data/votes.db'), autoload: true });
const pollsDB = new Datastore({ filename: path.join(__dirname, 'data/polls.db'), autoload: true });

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
  if (account) {
    await accountsDB.updateAsync({ userId: req.params.id }, { $inc: { balance: -amount } });
    const updatedAccount = await accountsDB.findOneAsync({ userId: req.params.id });
    res.json({ message: 'Withdrawal successful', balance: updatedAccount.balance });
  } else {
    res.status(404).json({ message: 'Account not found.' });
  }
});

// Get all groups for a specific student, with recipes
app.get('/api/students/:id/groups', async (req, res) => {
    const studentId = req.params.id;
    const groups = await groupsDB.findAsync({ studentIds: studentId });

    const groupsWithRecipes = await Promise.all(
        groups.map(async (group) => {
            const recipes = await recipesDB.findAsync({ groupId: group._id });
            const recipesWithVotes = await Promise.all(
                recipes.map(async (recipe) => {
                    const votes = await votesDB.findAsync({ recipeId: recipe._id });
                    return { ...recipe, voteCount: votes.length };
                })
            );
            return { ...group, recipes: recipesWithVotes };
        })
    );

    res.json(groupsWithRecipes);
});


// --- Poll Management Routes ---

// Create a new poll
app.post('/api/polls', async (req, res) => {
    const { title, classDateTime, createdBy } = req.body;
    if (!title || !classDateTime || !createdBy) {
        return res.status(400).json({ message: 'Title, class date/time, and creator ID are required.' });
    }
    const newPoll = {
        title,
        classDateTime,
        createdBy, // userId of the teacher
        status: 'open',
        createdAt: new Date()
    };
    const createdPoll = await pollsDB.insertAsync(newPoll);
    res.status(201).json(createdPoll);
});

// Get all polls
app.get('/api/polls', async (req, res) => {
    // Sort by class date descending
    const polls = await pollsDB.findAsync({}).sort({ classDateTime: -1 });
    res.json(polls);
});

// Create a new recipe for a poll
app.post('/api/polls/:pollId/recipes', async (req, res) => {
    const { name, ingredients, instructions } = req.body;
    const { pollId } = req.params;

    if (!name || !ingredients || !instructions) {
        return res.status(400).json({ message: 'Name, ingredients, and instructions are required.' });
    }

    const newRecipe = {
        name,
        ingredients,
        instructions,
        pollId // Link recipe to the poll
    };

    const createdRecipe = await recipesDB.insertAsync(newRecipe);
    res.status(201).json(createdRecipe);
});

// Get all recipes for a poll, with vote counts
app.get('/api/polls/:pollId/recipes', async (req, res) => {
    const { pollId } = req.params;
    const recipes = await recipesDB.findAsync({ pollId });

    const recipesWithVotes = await Promise.all(
        recipes.map(async (recipe) => {
            const votes = await votesDB.findAsync({ recipeId: recipe._id });
            return { ...recipe, voteCount: votes.length };
        })
    );

    res.json(recipesWithVotes);
});

// --- Group Management Routes ---

// Create a new group
app.post('/api/groups', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Group name is required.' });
  }
  const newGroup = {
    name,
    studentIds: []
  };
  const createdGroup = await groupsDB.insertAsync(newGroup);
  res.status(201).json(createdGroup);
});

// Get all groups
app.get('/api/groups', async (req, res) => {
  const groups = await groupsDB.findAsync({});
  res.json(groups);
});

// Get a single group with student details
app.get('/api/groups/:id', async (req, res) => {
    const group = await groupsDB.findOneAsync({ _id: req.params.id });
    if (!group) {
        return res.status(404).json({ message: 'Group not found.' });
    }
    const students = await usersDB.findAsync({ _id: { $in: group.studentIds } });
    res.json({ ...group, students });
});


// Update students in a group
app.put('/api/groups/:id/students', async (req, res) => {
  const { studentIds } = req.body;
  await groupsDB.updateAsync({ _id: req.params.id }, { $set: { studentIds } });
  res.json({ message: 'Group updated successfully.' });
});

// Charge all students in a group
app.post('/api/groups/:id/charge', async (req, res) => {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'A positive amount is required.' });
    }

    const group = await groupsDB.findOneAsync({ _id: req.params.id });
    if (!group) {
        return res.status(404).json({ message: 'Group not found.' });
    }

    await accountsDB.updateAsync(
        { userId: { $in: group.studentIds } },
        { $inc: { balance: -amount } },
        { multi: true }
    );

    res.json({ message: `Successfully charged $${amount} to all students in ${group.name}.` });
});


// --- Recipe Management Routes ---

// Create a new recipe for a group
app.post('/api/groups/:groupId/recipes', async (req, res) => {
    const { name, ingredients, instructions } = req.body;
    const { groupId } = req.params;

    if (!name || !ingredients || !instructions) {
        return res.status(400).json({ message: 'Name, ingredients, and instructions are required.' });
    }

    const newRecipe = {
        name,
        ingredients, // Should be an array of strings
        instructions,
        groupId
    };

    const createdRecipe = await recipesDB.insertAsync(newRecipe);
    res.status(201).json(createdRecipe);
});

// Get all recipes for a group, with vote counts
app.get('/api/groups/:groupId/recipes', async (req, res) => {
    const { groupId } = req.params;
    const recipes = await recipesDB.findAsync({ groupId });

    // For each recipe, get its vote count
    const recipesWithVotes = await Promise.all(
        recipes.map(async (recipe) => {
            const votes = await votesDB.findAsync({ recipeId: recipe._id });
            return { ...recipe, voteCount: votes.length };
        })
    );

    res.json(recipesWithVotes);
});


// --- Voting Routes ---

// Cast a vote for a recipe
app.post('/api/recipes/:recipeId/vote', async (req, res) => {
    const { studentId } = req.body;
    const { recipeId } = req.params;

    if (!studentId) {
        return res.status(400).json({ message: 'Student ID is required.' });
    }

    // Check for duplicate vote
    const existingVote = await votesDB.findOneAsync({ recipeId, studentId });
    if (existingVote) {
        return res.status(400).json({ message: 'You have already voted for this recipe.' });
    }

    const newVote = {
        recipeId,
        studentId
    };

    const createdVote = await votesDB.insertAsync(newVote);
    res.status(201).json(createdVote);
});

// Get all votes for a recipe (to get the count)
app.get('/api/recipes/:recipeId/votes', async (req, res) => {
    const { recipeId } = req.params;
    const votes = await votesDB.findAsync({ recipeId });
    res.json({ count: votes.length });
});

// Get all votes by a student
app.get('/api/students/:studentId/votes', async (req, res) => {
    const { studentId } = req.params;
    const votes = await votesDB.findAsync({ studentId });
    // We only need to return the recipeIds the student has voted for
    const recipeIds = votes.map(vote => vote.recipeId);
    res.json(recipeIds);
});


// --- Server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
