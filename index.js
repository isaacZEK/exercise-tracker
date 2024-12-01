const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // Unique ID generator

const app = express();
require('dotenv').config();

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));

// In-memory database
const users = []; // To store user data
const exercises = {}; // To store exercises by user ID

// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Route 1: POST /api/users - Create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  const _id = uuidv4(); // Generate unique ID
  const newUser = { username, _id };
  users.push(newUser);

  res.json(newUser); // Response with username and _id
});

// Route 2: GET /api/users - Get a list of all users
app.get('/api/users', (req, res) => {
  res.json(users); // Return all users
});

// Route 3: POST /api/users/:_id/exercises - Add exercise
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  if (!description || !duration) {
    return res.status(400).json({ error: 'Description and duration are required' });
  }

  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const formattedDate = date ? new Date(date).toDateString() : new Date().toDateString();

  const exercise = {
    description,
    duration: parseInt(duration, 10),
    date: formattedDate,
  };

  if (!exercises[_id]) {
    exercises[_id] = [];
  }
  exercises[_id].push(exercise);

  res.json({
    username: user.username,
    _id: user._id,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date,
  });
});

// Route 4: GET /api/users/:_id/logs - Get user exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = users.find(u => u._id === _id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let userExercises = exercises[_id] || [];

  // Filter by date range
  if (from) {
    const fromDate = new Date(from);
    userExercises = userExercises.filter(ex => new Date(ex.date) >= fromDate);
  }
  if (to) {
    const toDate = new Date(to);
    userExercises = userExercises.filter(ex => new Date(ex.date) <= toDate);
  }

  // Apply limit
  if (limit) {
    userExercises = userExercises.slice(0, parseInt(limit, 10));
  }

  res.json({
    username: user.username,
    count: userExercises.length,
    _id: user._id,
    log: userExercises,
  });
});

// Start the server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
