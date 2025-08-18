import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TeacherDashboard = () => {
    const [students, setStudents] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [amount, setAmount] = useState(0);

    const fetchStudents = async () => {
        const { data } = await axios.get('/api/students');
        setStudents(data);
    };

    const fetchPendingStudents = async () => {
        const { data } = await axios.get('/api/admin/pending-students');
        setPendingStudents(data);
    };

    useEffect(() => {
        fetchStudents();
        fetchPendingStudents();
    }, []);

    const handleDeposit = async () => {
        if (!selectedStudent || amount <= 0) return;
        await axios.post(`/api/students/${selectedStudent._id}/deposit`, { amount });
        alert('Deposit successful');
        // In a real app, you would update the student's balance in the UI
    };

    const handleWithdraw = async () => {
        if (!selectedStudent || amount <= 0) return;
        await axios.post(`/api/students/${selectedStudent._id}/withdraw`, { amount });
        alert('Withdrawal successful');
        // In a real app, you would update the student's balance in the UI
    };

    const handleApprove = async (studentId) => {
        await axios.post(`/api/admin/approve-student/${studentId}`);
        alert('Student approved');
        fetchPendingStudents();
        fetchStudents(); // refresh the list of active students
    };

    const handleReject = async (studentId) => {
        await axios.post(`/api/admin/reject-student/${studentId}`);
        alert('Student rejected');
        fetchPendingStudents();
    };

    return (
        <div>
            <h2>Teacher Dashboard</h2>

            <div>
                <h3>Pending Approvals</h3>
                <ul>
                    {pendingStudents.map(student => (
                        <li key={student._id}>
                            {student.username}
                            <button onClick={() => handleApprove(student._id)}>Approve</button>
                            <button onClick={() => handleReject(student._id)}>Reject</button>
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                <h3>Active Students</h3>
                <ul>
                    {students.map(student => (
                        <li key={student._id} onClick={() => setSelectedStudent(student)}>
                            {student.username}
                        </li>
                    ))}
                </ul>
                {selectedStudent && (
                    <div>
                        <h3>Manage Balance for {selectedStudent.username}</h3>
                        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} />
                        <button onClick={handleDeposit}>Deposit</button>
                        <button onClick={handleWithdraw}>Withdraw</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherDashboard;
