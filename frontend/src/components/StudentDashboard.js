import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, Alert, List, ListItem, ListItemText, Divider, Button, Box, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

const StudentDashboard = ({ user }) => {
    const [balance, setBalance] = useState(0);
    const [groups, setGroups] = useState([]);
    const [votedRecipeIds, setVotedRecipeIds] = useState([]);

    const fetchData = async () => {
        try {
            // Fetch balance, groups (with recipes), and votes in parallel
            const [balanceRes, groupsRes, votesRes] = await Promise.all([
                axios.get(`/api/students/${user._id}/balance`),
                axios.get(`/api/students/${user._id}/groups`),
                axios.get(`/api/students/${user._id}/votes`)
            ]);
            setBalance(balanceRes.data.balance);
            setGroups(groupsRes.data);
            setVotedRecipeIds(votesRes.data);
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
