import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Typography, Grid, Card, CardHeader, CardContent, List, ListItem, ListItemText,
    Button, Box, TextField, Divider, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Select, MenuItem, FormControl, InputLabel, OutlinedInput, Chip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';

const TeacherDashboard = () => {
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

    useEffect(() => {
        fetchStudents();
        fetchPendingStudents();
        fetchGroups();
    }, []);

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


    // --- Render ---
    return (
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
                Teacher Dashboard
            </Typography>
            <Grid container spacing={4}>
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
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

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
        </Box>
    );
};

export default TeacherDashboard;
