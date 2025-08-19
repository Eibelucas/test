import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Alert, List, ListItem, ListItemText, Divider } from '@mui/material';

const StudentDashboard = ({ user }) => {
    const [balance, setBalance] = useState(0);
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const { data } = await axios.get(`/api/students/${user._id}/balance`);
                setBalance(data.balance);
            } catch (error) {
                console.error("Failed to fetch balance", error);
            }
        };

        const fetchGroups = async () => {
            try {
                const { data } = await axios.get(`/api/students/${user._id}/groups`);
                setGroups(data);
            } catch (error) {
                console.error("Failed to fetch groups", error);
            }
        };

        fetchBalance();
        fetchGroups();
    }, [user]);

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Student Dashboard
            </Typography>
            <Typography variant="h6" gutterBottom>
                Welcome, {user.username}
            </Typography>

            {balance < 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                    INSUFFICIENT FUNDS: Your account is overdrawn. Please give money to your teacher to add to your balance.
                </Alert>
            )}

            <Card sx={{ minWidth: 275, mb: 2 }}>
                <CardContent>
                    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                        Current Balance
                    </Typography>
                    <Typography variant="h5" component="div" sx={{ color: balance < 0 ? 'red' : 'green' }}>
                        ${balance}
                    </Typography>
                </CardContent>
            </Card>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h5" gutterBottom>
                Your Groups
            </Typography>
            <List>
                {groups.length > 0 ? groups.map(group => (
                    <ListItem key={group._id}>
                        <ListItemText primary={group.name} />
                    </ListItem>
                )) : (
                    <Typography>You are not in any groups yet.</Typography>
                )}
            </List>
        </div>
    );
};

export default StudentDashboard;
