const express = require('express');
const bodyParser = require('body-parser');
const db = require('./Database/db');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Create Task
app.post('/tasks/', (req, res) => {
    const { title, description, status, user_id } = req.body;
    if (!title || !status || !user_id) {
        return res.status(400).json({ error: 'Title, status, and user_id are required.' });
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

// Get All Tasks
app.get('/tasks', (req, res) => {
    const sql = 'SELECT * FROM tasks';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error getting tasks:', err);
            return res.status(500).json({ error: 'Error getting tasks.' });
        }
        res.status(200).json(results);
    });
});

// Get Task by ID
app.get('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const sql = 'SELECT * FROM tasks WHERE id = ?';
    db.query(sql, taskId, (err, result) => {
        if (err) {
            console.error('Error getting task:', err);
            return res.status(500).json({ error: 'Error getting task.' });
        }
        if (result.length === 0) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        res.status(200).json(result[0]);
    });
});

// Update Task by ID
app.put('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
    const { title, description, status, user_id } = req.body;
    const sql = 'UPDATE tasks SET title = ?, description = ?, status = ?, user_id = ? WHERE id = ?';
    db.query(sql, [title, description, status, user_id, taskId], (err, result) => {
        if (err) {
            console.error('Error updating task:', err);
            return res.status(500).json({ error: 'Error updating task.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Task not found.' });
        }
        res.status(200).json({ id: taskId, title, description, status, user_id });
    });
});

// Delete Task by ID
app.delete('/tasks/:id', (req, res) => {
    const taskId = req.params.id;
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
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
