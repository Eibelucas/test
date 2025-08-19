const express = require('express');
const bodyParser = require('body-parser');
const Datastore = require('@seald-io/nedb');
const path = require('path');
const Excel = require('exceljs');
const multer = require('multer');

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
const transactionsDB = new Datastore({ filename: path.join(__dirname, 'data/transactions.db'), autoload: true });
const eventsDB = new Datastore({ filename: path.join(__dirname, 'data/events.db'), autoload: true });

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

// Load Demo Data
app.post('/api/admin/load-demo-data', async (req, res) => {
    try {
        // Clear existing data - careful not to delete the admin user
        await usersDB.removeAsync({ role: { $ne: 'teacher' } }, { multi: true });
        await accountsDB.removeAsync({}, { multi: true });
        await groupsDB.removeAsync({}, { multi: true });
        await recipesDB.removeAsync({}, { multi: true });
        await votesDB.removeAsync({}, { multi: true });
        await pollsDB.removeAsync({}, { multi: true });

        // Get admin user to associate with created items
        const adminUser = await usersDB.findOneAsync({ role: 'teacher' });
        if (!adminUser) {
            return res.status(500).json({ message: 'Admin user not found. Cannot load demo data.' });
        }

        // --- Create Demo Students ---
        const student1 = await usersDB.insertAsync({ username: 'Alice', password: 'password', role: 'student', status: 'active' });
        const student2 = await usersDB.insertAsync({ username: 'Bob', password: 'password', role: 'student', status: 'active' });
        const student3 = await usersDB.insertAsync({ username: 'Charlie', password: 'password', role: 'student', status: 'pending' });
        await accountsDB.insertAsync({ userId: student1._id, balance: 100 });
        await accountsDB.insertAsync({ userId: student2._id, balance: 50 });
        await accountsDB.insertAsync({ userId: student3._id, balance: 0 });

        // --- Create Demo Groups ---
        const group1 = await groupsDB.insertAsync({ name: 'Pasta Lovers', studentIds: [student1._id, student2._id] });
        const group2 = await groupsDB.insertAsync({ name: 'Baking Club', studentIds: [student2._id] });

        // --- Create Demo Recipes for Groups ---
        const recipe1 = await recipesDB.insertAsync({ name: 'Spaghetti Carbonara', ingredients: ['Pasta', 'Eggs', 'Pancetta', 'Parmesan Cheese'], instructions: 'A classic Roman pasta dish.', groupId: group1._id });
        await recipesDB.insertAsync({ name: 'Chocolate Chip Cookies', ingredients: ['Flour', 'Sugar', 'Butter', 'Chocolate Chips'], instructions: 'A classic cookie.', groupId: group2._id });

        // --- Create Demo Polls ---
        const poll1 = await pollsDB.insertAsync({ title: 'Next Week\'s Class Theme', classDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), createdBy: adminUser._id, status: 'open', createdAt: new Date() });

        // --- Create Demo Recipes for Polls ---
        const recipe3 = await recipesDB.insertAsync({ name: 'Tacos al Pastor', ingredients: ['Pork', 'Pineapple', 'Onion', 'Cilantro'], instructions: 'A popular taco style from Central Mexico.', pollId: poll1._id });
        await recipesDB.insertAsync({ name: 'Margherita Pizza', ingredients: ['Dough', 'San Marzano Tomatoes', 'Mozzarella', 'Basil'], instructions: 'A classic Neapolitan pizza.', pollId: poll1._id });

        // --- Create Demo Votes ---
        await votesDB.insertAsync({ recipeId: recipe1._id, studentId: student1._id });
        await votesDB.insertAsync({ recipeId: recipe1._id, studentId: student2._id });
        await votesDB.insertAsync({ recipeId: recipe3._id, studentId: student1._id });

        res.json({ message: 'Demo data loaded successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to load demo data.', error: error.message });
    }
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
    const studentId = req.params.id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'A positive amount is required.' });
    }

    await accountsDB.updateAsync({ userId: studentId }, { $inc: { balance: amount } });

    // Create a transaction record
    const transaction = {
        studentId,
        type: 'deposit',
        amount,
        timestamp: new Date()
    };
    await transactionsDB.insertAsync(transaction);

    const updatedAccount = await accountsDB.findOneAsync({ userId: studentId });
    res.json({ message: 'Deposit successful', balance: updatedAccount.balance });
});

// Withdraw money
app.post('/api/students/:id/withdraw', async (req, res) => {
    const { amount } = req.body;
    const studentId = req.params.id;

    if (!amount || amount <= 0) {
        return res.status(400).json({ message: 'A positive amount is required.' });
    }

    const account = await accountsDB.findOneAsync({ userId: studentId });
    if (account) {
        await accountsDB.updateAsync({ userId: studentId }, { $inc: { balance: -amount } });

        // Create a transaction record
        const transaction = {
            studentId,
            type: 'withdrawal',
            amount,
            timestamp: new Date()
        };
        await transactionsDB.insertAsync(transaction);

        const updatedAccount = await accountsDB.findOneAsync({ userId: studentId });
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

// Get all transactions for a specific student
app.get('/api/students/:id/transactions', async (req, res) => {
    const studentId = req.params.id;
    // Sort by timestamp descending to show the most recent first
    const transactions = await transactionsDB.findAsync({ studentId }).sort({ timestamp: -1 });
    res.json(transactions);
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

    // Update balances
    await accountsDB.updateAsync(
        { userId: { $in: group.studentIds } },
        { $inc: { balance: -amount } },
        { multi: true }
    );

    // Create a transaction record for each student
    const transactions = group.studentIds.map(studentId => ({
        studentId,
        type: 'charge',
        amount,
        groupName: group.name,
        groupId: group._id,
        timestamp: new Date()
    }));
    await transactionsDB.insertAsync(transactions);

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


// --- Event Management Routes ---

// Get all events
app.get('/api/events', async (req, res) => {
    const events = await eventsDB.findAsync({});
    res.json(events);
});

// Create a new event
app.post('/api/events', async (req, res) => {
    const { title, start, end, description, createdBy } = req.body;
    if (!title || !start || !end || !createdBy) {
        return res.status(400).json({ message: 'Title, start time, end time, and creator are required.' });
    }
    const newEvent = {
        title,
        start,
        end,
        description,
        createdBy,
        createdAt: new Date()
    };
    const createdEvent = await eventsDB.insertAsync(newEvent);
    res.status(201).json(createdEvent);
});

// Update an event
app.put('/api/events/:id', async (req, res) => {
    const { title, start, end, description } = req.body;
    await eventsDB.updateAsync({ _id: req.params.id }, { $set: { title, start, end, description } });
    res.json({ message: 'Event updated successfully.' });
});

// Delete an event
app.delete('/api/events/:id', async (req, res) => {
    await eventsDB.removeAsync({ _id: req.params.id });
    res.json({ message: 'Event deleted successfully.' });
});


// --- Import/Export Routes ---

// Configure multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Export all data to Excel
app.get('/api/export', async (req, res) => {
    try {
        const workbook = new Excel.Workbook();
        workbook.creator = 'TeacherApp';
        workbook.created = new Date();

        // --- Fetch Data ---
        const users = await usersDB.findAsync({});
        const accounts = await accountsDB.findAsync({});
        const groups = await groupsDB.findAsync({});
        const polls = await pollsDB.findAsync({});
        const recipes = await recipesDB.findAsync({});
        const votes = await votesDB.findAsync({});

        // Create a map for quick lookups
        const userMap = new Map(users.map(u => [u._id, u]));
        const accountMap = new Map(accounts.map(a => [a.userId, a]));
        const groupMap = new Map(groups.map(g => [g._id, g]));
        const pollMap = new Map(polls.map(p => [p._id, p]));
        const recipeMap = new Map(recipes.map(r => [r._id, r]));


        // --- Schüler Sheet ---
        const schuelerSheet = workbook.addWorksheet('Schüler');
        schuelerSheet.columns = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'Benutzername', key: 'username', width: 20 },
            { header: 'Rolle', key: 'role', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Kontostand', key: 'balance', width: 15, style: { numFmt: '"€"#,##0.00' } },
        ];
        users.filter(u => u.role === 'student').forEach(user => {
            const account = accountMap.get(user._id);
            schuelerSheet.addRow({
                ...user,
                balance: account ? account.balance : 0
            });
        });

        // --- Gruppen Sheet ---
        const gruppenSheet = workbook.addWorksheet('Gruppen');
        gruppenSheet.columns = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'Gruppenname', key: 'name', width: 30 },
            { header: 'Mitglieder (Benutzernamen)', key: 'members', width: 50 },
        ];
        groups.forEach(group => {
            const memberNames = group.studentIds.map(id => userMap.get(id)?.username || 'Unbekannt').join(', ');
            gruppenSheet.addRow({
                _id: group._id,
                name: group.name,
                members: memberNames
            });
        });

        // --- Abstimmungen Sheet ---
        const abstimmungenSheet = workbook.addWorksheet('Abstimmungen');
        abstimmungenSheet.columns = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'Titel', key: 'title', width: 40 },
            { header: 'Datum/Uhrzeit', key: 'classDateTime', width: 25 },
            { header: 'Status', key: 'status', width: 15 },
        ];
        abstimmungenSheet.addRows(polls);


        // --- Rezepte Sheet ---
        const rezepteSheet = workbook.addWorksheet('Rezepte');
        rezepteSheet.columns = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'Rezeptname', key: 'name', width: 30 },
            { header: 'Zutaten', key: 'ingredients', width: 50 },
            { header: 'Anleitung', key: 'instructions', width: 70 },
            { header: 'Zugehörig zu (Typ)', key: 'contextType', width: 20 },
            { header: 'Zugehörig zu (Name)', key: 'contextName', width: 30 },
        ];
        recipes.forEach(recipe => {
            let contextType = 'Unbekannt';
            let contextName = 'N/A';
            if (recipe.groupId) {
                contextType = 'Gruppe';
                contextName = groupMap.get(recipe.groupId)?.name || 'Unbekannte Gruppe';
            } else if (recipe.pollId) {
                contextType = 'Abstimmung';
                contextName = pollMap.get(recipe.pollId)?.title || 'Unbekannte Abstimmung';
            }
            rezepteSheet.addRow({
                _id: recipe._id,
                name: recipe.name,
                ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients.join(', ') : recipe.ingredients,
                instructions: recipe.instructions,
                contextType: contextType,
                contextName: contextName,
            });
        });


        // --- Stimmen Sheet ---
        const stimmenSheet = workbook.addWorksheet('Stimmen');
        stimmenSheet.columns = [
            { header: 'ID', key: '_id', width: 25 },
            { header: 'Rezeptname', key: 'recipeName', width: 30 },
            { header: 'Schüler-Benutzername', key: 'studentName', width: 30 },
        ];
        votes.forEach(vote => {
            const recipe = recipeMap.get(vote.recipeId);
            const student = userMap.get(vote.studentId);
            if (recipe && student) {
                stimmenSheet.addRow({
                    _id: vote._id,
                    recipeName: recipe.name,
                    studentName: student.username,
                });
            }
        });


        // --- Send File ---
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="teacher-data-export.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Export failed:', error);
        res.status(500).json({ message: 'Failed to export data.', error: error.message });
    }
});

// Import data from Excel
app.post('/api/import', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded.' });
    }

    try {
        // --- Clear Existing Data ---
        await usersDB.removeAsync({ role: { $ne: 'teacher' } }, { multi: true });
        await accountsDB.removeAsync({}, { multi: true });
        await groupsDB.removeAsync({}, { multi: true });
        await recipesDB.removeAsync({}, { multi: true });
        await votesDB.removeAsync({}, { multi: true });
        await pollsDB.removeAsync({}, { multi: true });
        console.log('Cleared existing data.');

        const workbook = new Excel.Workbook();
        await workbook.xlsx.load(req.file.buffer);

        // --- Data Maps for Relationship Building ---
        const usernameToIdMap = new Map();
        const recipeNameToIdMap = new Map();
        const groupNameToIdMap = new Map();
        const pollNameToIdMap = new Map();
        const adminUser = await usersDB.findOneAsync({ role: 'teacher' });


        // --- 1. Import Schüler ---
        const schuelerSheet = workbook.getWorksheet('Schüler');
        if (schuelerSheet) {
            console.log('Importing Schüler...');
            for (const row of schuelerSheet.getRows(2, schuelerSheet.rowCount - 1)) {
                const username = row.getCell('B').value;
                const role = row.getCell('C').value;
                const status = row.getCell('D').value;
                const balance = row.getCell('E').value;

                if (username) {
                    const newUser = await usersDB.insertAsync({
                        username,
                        password: 'password', // Default password
                        role,
                        status
                    });
                    await accountsDB.insertAsync({
                        userId: newUser._id,
                        balance: balance || 0
                    });
                    usernameToIdMap.set(username, newUser._id);
                }
            }
            console.log(`Imported ${usernameToIdMap.size} students.`);
        }


        // --- 2. Import Gruppen ---
        const gruppenSheet = workbook.getWorksheet('Gruppen');
        if (gruppenSheet) {
            console.log('Importing Gruppen...');
            for (const row of gruppenSheet.getRows(2, gruppenSheet.rowCount - 1)) {
                const groupName = row.getCell('B').value;
                const memberUsernamesRaw = row.getCell('C').value;
                const memberUsernames = (typeof memberUsernamesRaw === 'string' && memberUsernamesRaw)
                    ? memberUsernamesRaw.split(',').map(name => name.trim())
                    : [];

                if (groupName) {
                    const studentIds = memberUsernames.map(name => usernameToIdMap.get(name)).filter(id => id);
                    const newGroup = await groupsDB.insertAsync({
                        name: groupName,
                        studentIds
                    });
                    groupNameToIdMap.set(groupName, newGroup._id);
                }
            }
             console.log(`Imported ${groupNameToIdMap.size} groups.`);
        }

        // --- 3. Import Abstimmungen ---
        const abstimmungenSheet = workbook.getWorksheet('Abstimmungen');
        if (abstimmungenSheet) {
            console.log('Importing Abstimmungen...');
            for (const row of abstimmungenSheet.getRows(2, abstimmungenSheet.rowCount - 1)) {
                const title = row.getCell('B').value;
                const classDateTime = row.getCell('C').value;
                const status = row.getCell('D').value;

                if (title) {
                    const newPoll = await pollsDB.insertAsync({
                        title,
                        classDateTime,
                        status,
                        createdBy: adminUser._id,
                        createdAt: new Date()
                    });
                    pollNameToIdMap.set(title, newPoll._id);
                }
            }
            console.log(`Imported ${pollNameToIdMap.size} polls.`);
        }


        // --- 4. Import Rezepte ---
        const rezepteSheet = workbook.getWorksheet('Rezepte');
        if (rezepteSheet) {
            console.log('Importing Rezepte...');
            for (const row of rezepteSheet.getRows(2, rezepteSheet.rowCount - 1)) {
                const recipeName = row.getCell('B').value;
                const ingredientsRaw = row.getCell('C').value;
                const ingredients = (typeof ingredientsRaw === 'string' && ingredientsRaw)
                    ? ingredientsRaw.split(',').map(i => i.trim())
                    : [];
                const instructions = row.getCell('D').value;
                const contextType = row.getCell('E').value;
                const contextName = row.getCell('F').value;

                if (recipeName) {
                    const recipeData = { name: recipeName, ingredients, instructions };
                    if (contextType === 'Gruppe') {
                        recipeData.groupId = groupNameToIdMap.get(contextName);
                    } else if (contextType === 'Abstimmung') {
                        recipeData.pollId = pollNameToIdMap.get(contextName);
                    }
                    const newRecipe = await recipesDB.insertAsync(recipeData);
                    recipeNameToIdMap.set(recipeName, newRecipe._id);
                }
            }
            console.log(`Imported ${recipeNameToIdMap.size} recipes.`);
        }


        // --- 5. Import Stimmen ---
        const stimmenSheet = workbook.getWorksheet('Stimmen');
        let voteCount = 0;
        if (stimmenSheet) {
            console.log('Importing Stimmen...');
             for (const row of stimmenSheet.getRows(2, stimmenSheet.rowCount - 1)) {
                const recipeName = row.getCell('B').value;
                const studentName = row.getCell('C').value;

                if (recipeName && studentName) {
                    const recipeId = recipeNameToIdMap.get(recipeName);
                    const studentId = usernameToIdMap.get(studentName);
                    if (recipeId && studentId) {
                        await votesDB.insertAsync({ recipeId, studentId });
                        voteCount++;
                    }
                }
            }
            console.log(`Imported ${voteCount} votes.`);
        }


        res.json({ message: 'Data imported successfully!' });

    } catch (error) {
        console.error('Import failed:', error);
        res.status(500).json({ message: 'Failed to import data.', error: error.message });
    }
});


// --- Server ---
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
