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

    const debtWarningStyles = {
        backgroundColor: '#ffdddd',
        border: '1px solid #f44336',
        color: '#f44336',
        padding: '15px',
        margin: '20px 0',
        borderRadius: '5px'
    };

    return (
        <div>
            <h2>Student Dashboard</h2>
            <h3>Welcome, {user.username}</h3>

            {balance < 0 && (
                <div style={debtWarningStyles}>
                    <h3>INSUFFICIENT FUNDS</h3>
                    <p>Your account is overdrawn. Please give money to your teacher to add to your balance.</p>
                </div>
            )}

            <h4>Your balance is: ${balance}</h4>
        </div>
    );
};

export default StudentDashboard;
