const express = require('express');
const bodyParser = require('body-parser');
const db = require('./Database/db');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

