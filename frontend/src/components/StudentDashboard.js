import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Card, CardContent, Typography, Alert, List, ListItem, ListItemText, Divider, Button, Box, Accordion, AccordionSummary, AccordionDetails,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import dayjs from 'dayjs';
import EventCalendar from './EventCalendar';

const StudentDashboard = ({ user }) => {
    const [balance, setBalance] = useState(0);
    const [groups, setGroups] = useState([]);
    const [polls, setPolls] = useState([]);
    const [votedRecipeIds, setVotedRecipeIds] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [events, setEvents] = useState([]);

    const fetchData = async () => {
        try {
            // Fetch initial data
            const [balanceRes, groupsRes, votesRes, pollsRes, transactionsRes, eventsRes] = await Promise.all([
                axios.get(`/api/students/${user._id}/balance`),
                axios.get(`/api/students/${user._id}/groups`),
                axios.get(`/api/students/${user._id}/votes`),
                axios.get('/api/polls'), // Get all polls
                axios.get(`/api/students/${user._id}/transactions`),
                axios.get('/api/events')
            ]);

            setBalance(balanceRes.data.balance);
            setGroups(groupsRes.data);
            setVotedRecipeIds(votesRes.data);
            setTransactions(transactionsRes.data);
            const formattedEvents = eventsRes.data.map(event => ({
                ...event,
                start: new Date(event.start),
                end: new Date(event.end),
            }));
            setEvents(formattedEvents);

            // For each poll, fetch its recipes
            const pollsWithRecipes = await Promise.all(
                pollsRes.data.map(async (poll) => {
                    const recipesRes = await axios.get(`/api/polls/${poll._id}/recipes`);
                    return { ...poll, recipes: recipesRes.data };
                })
            );
            setPolls(pollsWithRecipes);

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handleVote = async (recipeId) => {
        try {
            await axios.post(`/api/recipes/${recipeId}/vote`, { studentId: user._id });
            alert('Your vote has been cast!');
            // Refresh data to update vote counts and voted status
            fetchData();
        } catch (error) {
            alert(`Error: ${error.response?.data?.message || 'Could not cast vote.'}`);
        }
    };

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
                Upcoming Events
            </Typography>
            <Card sx={{ mb: 2 }}>
                <CardContent>
                    <EventCalendar events={events} isTeacher={false} />
                </CardContent>
            </Card>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h5" gutterBottom>
                Transaction History
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size="small" aria-label="transaction history">
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
                                <TableCell>{tx.groupName ? `From: ${tx.groupName}` : 'N/A'}</TableCell>
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

            <Divider sx={{ my: 2 }} />

            <Typography variant="h5" gutterBottom>
                Cooking Class Polls
            </Typography>
            {polls.length > 0 ? polls.map(poll => (
                <Accordion key={poll._id} sx={{ my: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography sx={{ flexShrink: 0, mr: 2 }}>{poll.title}</Typography>
                        <Typography sx={{ color: 'text.secondary' }}>
                            Class on: {dayjs(poll.classDateTime).format('MMMM D, YYYY h:mm A')}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List>
                            {poll.recipes.map(recipe => (
                                <ListItem
                                    key={recipe._id}
                                    secondaryAction={
                                        <Button
                                            size="small"
                                            onClick={() => handleVote(recipe._id)}
                                            disabled={votedRecipeIds.includes(recipe._id)}
                                        >
                                            Vote ({recipe.voteCount})
                                        </Button>
                                    }
                                >
                                    <ListItemText primary={recipe.name} />
                                </ListItem>
                            ))}
                        </List>
                    </AccordionDetails>
                </Accordion>
            )) : (
                <Typography>There are no active polls right now.</Typography>
            )}

            <Divider sx={{ my: 2 }} />

            <Typography variant="h5" gutterBottom>
                Your Groups & Recipes
            </Typography>
            {groups.length > 0 ? groups.map(group => (
                <Accordion key={group._id} sx={{ my: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography>{group.name}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <List>
                            {group.recipes.map(recipe => (
                                <ListItem
                                    key={recipe._id}
                                    secondaryAction={
                                        <Button
                                            size="small"
                                            onClick={() => handleVote(recipe._id)}
                                            disabled={votedRecipeIds.includes(recipe._id)}
                                        >
                                            Vote ({recipe.voteCount})
                                        </Button>
                                    }
                                >
                                    <ListItemText primary={recipe.name} />
                                </ListItem>
                            ))}
                        </List>
                    </AccordionDetails>
                </Accordion>
            )) : (
                <Typography>You are not in any groups yet.</Typography>
            )}
        </div>
    );
};

export default StudentDashboard;
