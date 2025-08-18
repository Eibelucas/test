import React, { useState, useEffect } from 'react';
import axios from 'axios';

const StudentDashboard = ({ user }) => {
    const [balance, setBalance] = useState(0);

    useEffect(() => {
        const fetchBalance = async () => {
            const { data } = await axios.get(`/api/students/${user._id}/balance`);
            setBalance(data.balance);
        };
        fetchBalance();
    }, [user]);

    return (
        <div>
            <h2>Student Dashboard</h2>
            <h3>Welcome, {user.username}</h3>
            <h4>Your balance is: ${balance}</h4>
        </div>
    );
};

export default StudentDashboard;
