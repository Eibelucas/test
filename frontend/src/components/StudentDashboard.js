import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Alert } from '@mui/material';

const StudentDashboard = ({ user }) => {
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const fetchBalance = async () => {
            try {
                const { data } = await axios.get(`/api/students/${user._id}/balance`);
                setBalance(data.balance);
            } catch (error) {
                console.error("Failed to fetch balance", error);
            }
        };
        fetchBalance();
    }, [user]);

    return (
        <div>
            <Typography variant="h4" gutterBottom>
                Student Dashboard
            </Typography>
            <Typography variant="h6">
                Welcome, {user.username}
            </Typography>

            {balance < 0 && (
                <Alert severity="error" sx={{ mt: 2 }}>
                    INSUFFICIENT FUNDS: Your account is overdrawn. Please give money to your teacher to add to your balance.
                </Alert>
            )}

            <Card sx={{ minWidth: 275, mt: 2 }}>
                <CardContent>
                    <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                        Current Balance
                    </Typography>
                    <Typography variant="h5" component="div" sx={{ color: balance < 0 ? 'red' : 'green' }}>
                        ${balance}
                    </Typography>
                </CardContent>
            </Card>
        </div>
    );
};

export default StudentDashboard;
