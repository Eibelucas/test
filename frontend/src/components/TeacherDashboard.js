import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Typography, Grid, Card, CardHeader, CardContent, List, ListItem, ListItemText,
    Button, Box, TextField, Divider, IconButton
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';

const TeacherDashboard = () => {
    const [students, setStudents] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [amount, setAmount] = useState(0);

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

    useEffect(() => {
        fetchStudents();
        fetchPendingStudents();
    }, []);

    const handleTransaction = async (type) => {
        if (!selectedStudent || amount <= 0) return;
        try {
            await axios.post(`/api/students/${selectedStudent._id}/${type}`, { amount });
            alert(`${type.charAt(0).toUpperCase() + type.slice(1)} successful`);
            // You might want to refresh the student's balance here,
            // but that would require fetching all accounts or the specific one.
            // For now, we'll leave it as is.
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

    return (
        <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" gutterBottom>
                Teacher Dashboard
            </Typography>
            <Grid container spacing={4}>
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
        </Box>
    );
};

export default TeacherDashboard;
