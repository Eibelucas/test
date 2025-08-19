import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Typography, Grid, Card, CardHeader, CardContent, List, ListItem, ListItemText,
    Button, Box, TextField, Divider, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Select, MenuItem, FormControl, InputLabel, OutlinedInput, Chip,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import dayjs from 'dayjs';

const TeacherDashboard = ({ user }) => {
    // Existing states
    const [students, setStudents] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [amount, setAmount] = useState(0);

    // New states for groups
    const [groups, setGroups] = useState([]);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [newGroupName, setNewGroupName] = useState('');
    const [openNewGroupDialog, setOpenNewGroupDialog] = useState(false);
    const [selectedGroupStudentIds, setSelectedGroupStudentIds] = useState([]);
    const [groupChargeAmount, setGroupChargeAmount] = useState(0);

    // States for polls
    const [polls, setPolls] = useState([]);
    const [selectedPoll, setSelectedPoll] = useState(null);
    const [openNewPollDialog, setOpenNewPollDialog] = useState(false);
    const [newPollTitle, setNewPollTitle] = useState('');
    const [newPollDateTime, setNewPollDateTime] = useState(dayjs());
    const [openDemoDataDialog, setOpenDemoDataDialog] = useState(false);


    const [transactions, setTransactions] = useState([]);


    // --- Data Fetching ---
    const fetchStudents = async () => {
        try {
            const { data } = await axios.get('/api/students');
            setStudents(data);
        } catch (error) {
            console.error("Failed to fetch students", error);
        }
    };

    const fetchPendingStudents = async () => {
        try {
            const { data } = await axios.get('/api/admin/pending-students');
            setPendingStudents(data);
        } catch (error) {
            console.error("Failed to fetch pending students", error);
        }
    };

    const fetchGroups = async () => {
        try {
            const { data } = await axios.get('/api/groups');
            setGroups(data);
        } catch (error) {
            console.error("Failed to fetch groups", error);
        }
    };

    const fetchPolls = async () => {
        try {
            const { data } = await axios.get('/api/polls');
            setPolls(data);
        } catch (error) {
            console.error("Failed to fetch polls", error);
        }
    };

    useEffect(() => {
        fetchStudents();
        fetchPendingStudents();
        fetchGroups();
        fetchPolls();
    }, []);

    const fetchTransactions = async (studentId) => {
        if (!studentId) {
            setTransactions([]);
            return;
        }
        try {
            const { data } = await axios.get(`/api/students/${studentId}/transactions`);
            setTransactions(data);
        } catch (error) {
            console.error("Failed to fetch transactions", error);
            setTransactions([]); // Clear on error
        }
    };

    useEffect(() => {
        if (selectedStudent) {
            fetchTransactions(selectedStudent._id);
        } else {
            setTransactions([]);
        }
    }, [selectedStudent]);

    useEffect(() => {
        if (selectedGroup) {
            setSelectedGroupStudentIds(selectedGroup.studentIds || []);
        }
    }, [selectedGroup]);


    // --- Handlers ---
    const handleTransaction = async (type) => {
        if (!selectedStudent || amount <= 0) return;
        try {
            await axios.post(`/api/students/${selectedStudent._id}/${type}`, { amount });
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} successful`);
            setAmount(0);
            fetchTransactions(selectedStudent._id); // Refresh transactions
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || `Could not process ${type}.`}`);
        }
    };

    const handleApproval = async (studentId, action) => {
        try {
            await axios.post(`/api/admin/${action}-student/${studentId}`);
            alert(`Student ${action}d`);
            fetchPendingStudents();
            if (action === 'approve') {
                fetchStudents();
            }
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || `Could not ${action} student.`}`);
        }
    };

    const handleCreateGroup = async () => {
        if (!newGroupName) return;
        try {
            await axios.post('/api/groups', { name: newGroupName });
            setNewGroupName('');
            setOpenNewGroupDialog(false);
            fetchGroups();
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || 'Could not create group.'}`);
        }
    };

    const handleUpdateGroupStudents = async () => {
        if (!selectedGroup) return;
        try {
            await axios.put(`/api/groups/${selectedGroup._id}/students`, { studentIds: selectedGroupStudentIds });
            alert('Group members updated successfully.');
            fetchGroups();
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || 'Could not update group members.'}`);
        }
    };

    const handleGroupCharge = async () => {
        if (!selectedGroup || groupChargeAmount <= 0) return;
        try {
            await axios.post(`/api/groups/${selectedGroup._id}/charge`, { amount: groupChargeAmount });
            alert(`Successfully charged the group $${groupChargeAmount}.`);
            setGroupChargeAmount(0);
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || 'Could not process group charge.'}`);
        }
    };

    const handleCreatePoll = async () => {
        if (!newPollTitle || !newPollDateTime) return;
        try {
            await axios.post('/api/polls', {
                title: newPollTitle,
                classDateTime: newPollDateTime.toISOString(),
                createdBy: user._id,
            });
            setNewPollTitle('');
            setNewPollDateTime(dayjs());
            setOpenNewPollDialog(false);
            fetchPolls();
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || 'Could not create poll.'}`);
        }
    };

    const handleLoadDemoData = async () => {
        setOpenDemoDataDialog(false);
        try {
            await axios.post('/api/admin/load-demo-data');
            alert('Demo data loaded successfully!');
            // Refresh all data on the dashboard
            fetchStudents();
            fetchPendingStudents();
            fetchGroups();
            fetchPolls();
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || 'Could not load demo data.'}`);
        }
    };


    // New states for recipes
    const [recipes, setRecipes] = useState([]); // For groups
    const [pollRecipes, setPollRecipes] = useState([]); // For polls
    const [openNewRecipeDialog, setOpenNewRecipeDialog] = useState(false);
    const [newRecipe, setNewRecipe] = useState({ name: '', ingredients: '', instructions: '' });
    const [viewRecipe, setViewRecipe] = useState(null); // The recipe to view

    const fetchRecipes = async (groupId) => {
        if (!groupId) {
            setRecipes([]);
            return;
        }
        try {
            const { data } = await axios.get(`/api/groups/${groupId}/recipes`);
            setRecipes(data);
        } catch (error) {
            console.error("Failed to fetch group recipes", error);
        }
    };

    const fetchPollRecipes = async (pollId) => {
        if (!pollId) {
            setPollRecipes([]);
            return;
        }
        try {
            const { data } = await axios.get(`/api/polls/${pollId}/recipes`);
            setPollRecipes(data);
        } catch (error) {
            console.error("Failed to fetch poll recipes", error);
        }
    };

    useEffect(() => {
        if (selectedGroup) {
            setSelectedPoll(null); // Deselect poll when group is selected
            setSelectedGroupStudentIds(selectedGroup.studentIds || []);
            fetchRecipes(selectedGroup._id);
        } else {
            fetchRecipes(null);
        }
    }, [selectedGroup]);

    useEffect(() => {
        if (selectedPoll) {
            setSelectedGroup(null); // Deselect group when poll is selected
            fetchPollRecipes(selectedPoll._id);
        } else {
            fetchPollRecipes(null);
        }
    }, [selectedPoll]);


    const handleCreateRecipe = async () => {
        const { name, ingredients } = newRecipe;
        if (!name || !ingredients) return;

        const ingredientsArray = ingredients.split(',').map(item => item.trim());
        const recipeData = { ...newRecipe, ingredients: ingredientsArray };

        let url = '';
        if (selectedPoll) {
            url = `/api/polls/${selectedPoll._id}/recipes`;
        } else if (selectedGroup) {
            url = `/api/groups/${selectedGroup._id}/recipes`;
        } else {
            alert("Please select a group or a poll first.");
            return;
        }

        try {
            await axios.post(url, recipeData);
            setOpenNewRecipeDialog(false);
            setNewRecipe({ name: '', ingredients: '', instructions: '' });
            // Refetch recipes for the current context
            if (selectedPoll) {
                fetchPollRecipes(selectedPoll._id);
            } else if (selectedGroup) {
                fetchRecipes(selectedGroup._id);
            }
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || 'Could not create recipe.'}`);
        }
    };


    // --- Render ---
    return (
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
                Teacher Dashboard
            </Typography>
            <Grid container spacing={4}>

                {/* Admin Actions Section */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader title="Admin Actions" />
                        <CardContent>
                            <Button
                                variant="contained"
                                color="warning"
                                onClick={() => setOpenDemoDataDialog(true)}
                            >
                                Load Demo Data
                            </Button>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Poll Management Section */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader
                            title="Cooking Class Polls"
                            action={
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => setOpenNewPollDialog(true)}
                                >
                                    New Poll
                                </Button>
                            }
                        />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Typography variant="h6">Polls</Typography>
                                    <List component="nav">
                                        {polls.map(poll => (
                                            <ListItem
                                                button
                                                key={poll._id}
                                                selected={selectedPoll?._id === poll._id}
                                                onClick={() => setSelectedPoll(poll)}
                                            >
                                                <ListItemText
                                                    primary={poll.title}
                                                    secondary={`Class on: ${dayjs(poll.classDateTime).format('MMMM D, YYYY h:mm A')}`}
                                                />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>
                                <Grid item xs={8}>
                                    {selectedPoll && (
                                        <Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="h6">Recipes for {selectedPoll.title}</Typography>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => setOpenNewRecipeDialog(true)}
                                                >
                                                    New Recipe
                                                </Button>
                                            </Box>
                                            <List>
                                                {pollRecipes.map(recipe => (
                                                    <ListItem
                                                        key={recipe._id}
                                                        secondaryAction={
                                                            <Button size="small" onClick={() => setViewRecipe(recipe)}>
                                                                View
                                                            </Button>
                                                        }
                                                    >
                                                        <ListItemText primary={recipe.name} secondary={`Votes: ${recipe.voteCount}`} />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Group Management Section */}
                <Grid item xs={12}>
                    <Card>
                        <CardHeader
                            title="Group Management"
                            action={
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => setOpenNewGroupDialog(true)}
                                >
                                    New Group
                                </Button>
                            }
                        />
                        <CardContent>
                            <Grid container spacing={2}>
                                <Grid item xs={4}>
                                    <Typography variant="h6">Groups</Typography>
                                    <List component="nav">
                                        {groups.map(group => (
                                            <ListItem
                                                button
                                                key={group._id}
                                                selected={selectedGroup?._id === group._id}
                                                onClick={() => setSelectedGroup(group)}
                                            >
                                                <ListItemText primary={group.name} />
                                            </ListItem>
                                        ))}
                                    </List>
                                </Grid>
                                <Grid item xs={8}>
                                    {selectedGroup && (
                                        <Box>
                                            <Typography variant="h6">Edit Members for {selectedGroup.name}</Typography>
                                            <FormControl fullWidth sx={{mt: 2}}>
                                                <InputLabel id="multiple-student-select-label">Students</InputLabel>
                                                <Select
                                                    labelId="multiple-student-select-label"
                                                    multiple
                                                    value={selectedGroupStudentIds}
                                                    onChange={(e) => setSelectedGroupStudentIds(e.target.value)}
                                                    input={<OutlinedInput label="Students" />}
                                                    renderValue={(selected) => (
                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                            {selected.map((value) => {
                                                                const student = students.find(s => s._id === value);
                                                                return <Chip key={value} label={student?.username || '...'} />;
                                                            })}
                                                        </Box>
                                                    )}
                                                >
                                                    {students.map((student) => (
                                                        <MenuItem key={student._id} value={student._id}>
                                                            {student.username}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                            <Button sx={{mt: 2}} variant="contained" onClick={handleUpdateGroupStudents}>Save Members</Button>

                                            <Divider sx={{ my: 2 }} />
                                            <Typography variant="subtitle1">Charge All Members</Typography>
                                            <TextField
                                                label="Amount to Charge"
                                                type="number"
                                                value={groupChargeAmount}
                                                onChange={e => setGroupChargeAmount(Number(e.target.value))}
                                                fullWidth
                                                margin="normal"
                                                size="small"
                                            />
                                            <Button variant="contained" color="error" onClick={handleGroupCharge}>
                                                Charge Group
                                            </Button>

                                            <Divider sx={{ my: 2 }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Typography variant="subtitle1">Recipes</Typography>
                                                <Button
                                                    variant="outlined"
                                                    size="small"
                                                    startIcon={<AddIcon />}
                                                    onClick={() => setOpenNewRecipeDialog(true)}
                                                    disabled={!selectedGroup} // Disable if no group is selected
                                                >
                                                    New Recipe
                                                </Button>
                                            </Box>
                                            <List>
                                                {recipes.map(recipe => (
                                                    <ListItem
                                                        key={recipe._id}
                                                        secondaryAction={
                                                            <Button size="small" onClick={() => setViewRecipe(recipe)}>
                                                                View
                                                            </Button>
                                                        }
                                                    >
                                                        <ListItemText primary={recipe.name} secondary={`Votes: ${recipe.voteCount}`} />
                                                    </ListItem>
                                                ))}
                                            </List>
                                        </Box>
                                    )}
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Pending Approvals Section */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader title="Pending Approvals" />
                        <CardContent>
                            <List>
                                {pendingStudents.length > 0 ? pendingStudents.map(student => (
                                    <ListItem
                                        key={student._id}
                                        secondaryAction={
                                            <>
                                                <IconButton edge="end" aria-label="approve" onClick={() => handleApproval(student._id, 'approve')}>
                                                    <CheckCircleIcon color="success" />
                                                </IconButton>
                                                <IconButton edge="end" aria-label="reject" onClick={() => handleApproval(student._id, 'reject')}>
                                                    <CancelIcon color="error" />
                                                </IconButton>
                                            </>
                                        }
                                    >
                                        <ListItemText primary={student.username} />
                                    </ListItem>
                                )) : <Typography>No pending approvals.</Typography>}
                            </List>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Active Students & Transactions Section */}
                <Grid item xs={12} md={6}>
                    <Card>
                        <CardHeader title="Active Students" />
                        <CardContent>
                            <List component="nav" aria-label="main mailbox folders">
                                {students.map(student => (
                                    <ListItem
                                        button
                                        key={student._id}
                                        selected={selectedStudent?._id === student._id}
                                        onClick={() => setSelectedStudent(student)}
                                    >
                                        <ListItemText primary={student.username} />
                                    </ListItem>
                                ))}
                            </List>
                            {selectedStudent && (
                                <Box sx={{ p: 2, borderTop: '1px solid #ddd' }}>
                                    <Typography variant="h6">
                                        Manage Balance for {selectedStudent.username}
                                    </Typography>
                                    <TextField
                                        label="Amount"
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(Number(e.target.value))}
                                        fullWidth
                                        margin="normal"
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 2 }}>
                                        <Button variant="contained" color="success" onClick={() => handleTransaction('deposit')}>
                                            Deposit
                                        </Button>
                                        <Button variant="contained" color="warning" onClick={() => handleTransaction('withdraw')}>
                                            Withdraw
                                        </Button>
                                    </Box>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography variant="h6">Transaction History</Typography>
                                    <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                                        <Table stickyHeader size="small" aria-label="transaction history">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell>Date</TableCell>
                                                    <TableCell>Type</TableCell>
                                                    <TableCell align="right">Amount</TableCell>
                                                    <TableCell>Details</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {transactions.length > 0 ? transactions.map((tx) => (
                                                    <TableRow key={tx._id}>
                                                        <TableCell component="th" scope="row">
                                                            {dayjs(tx.timestamp).format('YYYY-MM-DD HH:mm')}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={tx.type}
                                                                size="small"
                                                                color={
                                                                    tx.type === 'deposit' ? 'success' :
                                                                    tx.type === 'withdrawal' ? 'warning' :
                                                                    'error'
                                                                }
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">${tx.amount}</TableCell>
                                                        <TableCell>{tx.groupName ? `For: ${tx.groupName}` : 'N/A'}</TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={4} align="center">
                                                            No transactions found.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* New Poll Dialog */}
            <Dialog open={openNewPollDialog} onClose={() => setOpenNewPollDialog(false)}>
                <DialogTitle>Create New Cooking Class Poll</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Poll Title"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newPollTitle}
                        onChange={(e) => setNewPollTitle(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <DateTimePicker
                        label="Class Date & Time"
                        value={newPollDateTime}
                        onChange={(newValue) => setNewPollDateTime(newValue)}
                        renderInput={(params) => <TextField {...params} fullWidth />}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewPollDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreatePoll}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* New Group Dialog */}
            <Dialog open={openNewGroupDialog} onClose={() => setOpenNewGroupDialog(false)}>
                <DialogTitle>Create New Group</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter the name for the new group.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="name"
                        label="Group Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewGroupDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateGroup}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* New Recipe Dialog */}
            <Dialog open={openNewRecipeDialog} onClose={() => setOpenNewRecipeDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Create New Recipe</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Recipe Name"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newRecipe.name}
                        onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Ingredients (comma-separated)"
                        type="text"
                        fullWidth
                        variant="standard"
                        value={newRecipe.ingredients}
                        onChange={(e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value })}
                    />
                    <TextField
                        margin="dense"
                        label="Instructions"
                        type="text"
                        fullWidth
                        multiline
                        rows={4}
                        variant="standard"
                        value={newRecipe.instructions}
                        onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNewRecipeDialog(false)}>Cancel</Button>
                    <Button onClick={handleCreateRecipe}>Create</Button>
                </DialogActions>
            </Dialog>

            {/* View Recipe Dialog */}
            <Dialog open={!!viewRecipe} onClose={() => setViewRecipe(null)} fullWidth maxWidth="sm">
                {viewRecipe && (
                    <>
                        <DialogTitle>{viewRecipe.name}</DialogTitle>
                        <DialogContent>
                            <DialogContentText component="div">
                                <Typography variant="h6">Instructions</Typography>
                                <Typography style={{ whiteSpace: 'pre-wrap' }}>{viewRecipe.instructions}</Typography>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="h6">Shopping List</Typography>
                                <ul>
                                    {viewRecipe.ingredients.map((item, index) => (
                                        <li key={index}>{item}</li>
                                    ))}
                                </ul>
                            </DialogContentText>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setViewRecipe(null)}>Close</Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>

            {/* Load Demo Data Confirmation Dialog */}
            <Dialog
                open={openDemoDataDialog}
                onClose={() => setOpenDemoDataDialog(false)}
            >
                <DialogTitle>{"Load Demo Data?"}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to load demo data? This will delete all existing student and group data. This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDemoDataDialog(false)}>Cancel</Button>
                    <Button onClick={handleLoadDemoData} color="warning" autoFocus>
                        Load Data
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default TeacherDashboard;
