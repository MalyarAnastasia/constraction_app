const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'constraction_app',
  password: 'nastya2005',
  port: 5432,
});

app.get('/api/defects', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM defects');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching defects:', err.message);
    res.status(500).send('Server Error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});