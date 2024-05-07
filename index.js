const express = require('express');
const bodyParser = require('body-parser');
const db = require('./Database/db');
const {authenticateToken} = require('./Middleware/authMiddleware');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000; 
const secretKey = '12345678';

app.use(bodyParser.json());

// User Registration
app.post('/register', async (req, res) => {
    const { username, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, email, hashedPassword, role], (err, result) => {
        if (err) {
            console.error('Error registering user:', err);
            return res.status(500).json({ error: 'Error registering user.' });
        }
        res.status(200).json({ message: 'User registered successfully.' });
    });
});


// User Login
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const sql = 'SELECT * FROM users WHERE email = ?';
    db.query(sql, email, async (err, result) => {
        if (err) {
            console.error('Error authenticating user:', err);
            return res.status(500).json({ error: 'Error authenticating user.' });
        }
        if (result.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const user = result[0];
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }
        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, secretKey);
        res.status(200).json({ token });
    });
});


//get all the tasks based on the role
app.get('/tasks', authenticateToken, (req, res) => {
   
    if (req.user.role === 'admin') {
        const sql = 'SELECT * FROM tasks';
        db.query(sql, (err, results) => {
            if (err) {
                console.error('Error getting tasks:', err);
                return res.status(500).json({ error: 'Error getting tasks.' });
            }
            res.status(200).json(results);
        });
    } else {
       
        const user_id = req.user.id;
        const sql = 'SELECT * FROM tasks WHERE user_id = ?';
        db.query(sql, user_id, (err, results) => {
            if (err) {
                console.error('Error getting user tasks:', err);
                return res.status(500).json({ error: 'Error getting user tasks.' });
            }
            res.status(200).json(results);
        });
    }
});


// Create Task
app.post('/tasks/', authenticateToken, (req, res) => {
    const user_id = req.user.id;
    const { title, description, status } = req.body;
    if (!title || !status) {
        return res.status(400).json({ error: 'Title and status are required.' });
    }
    const sql = 'INSERT INTO tasks (title, description, status, user_id) VALUES (?, ?, ?, ?)';
    db.query(sql, [title, description, status, user_id], (err, result) => {
        if (err) {
            console.error('Error creating task:', err);
            return res.status(500).json({ error: 'Error creating task.' });
        }
        res.status(200).json({ id: result.insertId, title, description, status, user_id });
    });
});



// Update Task by ID
app.put('/tasks/:id', authenticateToken, (req, res) => {
    const taskId = req.params.id;
    const user_id = req.user.id;
    const { title, description, status } = req.body;

   
    if (req.user.role === 'admin') {
        // Admin can update any task
        const sql = 'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ?';
        db.query(sql, [title, description, status, taskId], (err, result) => {
            if (err) {
                console.error('Error updating task:', err);
                return res.status(500).json({ error: 'Error updating task.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Task not found.' });
            }
            res.status(200).json({ id: taskId, title, description, status });
        });
    } else {
      
        const sql = 'UPDATE tasks SET title = ?, description = ?, status = ? WHERE id = ? AND user_id = ?';
        db.query(sql, [title, description, status, taskId, user_id], (err, result) => {
            if (err) {
                console.error('Error updating task:', err);
                return res.status(500).json({ error: 'Error updating task.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Task not found or access denied.' });
            }
            res.status(200).json({ id: taskId, title, description, status });
        });
    }
});


// Delete Task by ID
app.delete('/tasks/:id', authenticateToken, (req, res) => {
    const taskId = req.params.id;
    const user_id = req.user.id;

    
    if (req.user.role === 'admin') {
        // Admin can delete any task
        const sql = 'DELETE FROM tasks WHERE id = ?';
        db.query(sql, taskId, (err, result) => {
            if (err) {
                console.error('Error deleting task:', err);
                return res.status(500).json({ error: 'Error deleting task.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Task not found.' });
            }
            res.sendStatus(204);
        });
    } else {

        // for users, only delete tasks associated with their user ID
        const sql = 'DELETE FROM tasks WHERE id = ? AND user_id = ?';
        db.query(sql, [taskId, user_id], (err, result) => {
            if (err) {
                console.error('Error deleting task:', err);
                return res.status(500).json({ error: 'Error deleting task.' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Task not found.' });
            }
            res.sendStatus(204);
        });
    }
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

