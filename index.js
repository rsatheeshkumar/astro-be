// Entry Point of the API Server
const express = require('express');

const app = express();
const Pool = require('pg').Pool;

const pool = new Pool({
	user: 'satheesh',
	host: 'dpg-cehdn46n6mpg3l6dej4g-a.singapore-postgres.render.com',
	database: 'astro_av06',
	password: 'UGSrVLMIjNvxdYgLxxqWS2HoZ5aAd8AT',
	dialect: 'postgres',
	port: 5432,
  ssl: true
});


/* To handle the HTTP Methods Body Parser
is used, Generally used to extract the
entire body portion of an incoming
request stream and exposes it on req.body
*/
const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));


pool.connect((err, client, release) => {
	if (err) {
		return console.error(
			'Error acquiring client', err.stack)
	}
	client.query('SELECT NOW()', (err, result) => {
		release()
		if (err) {
			return console.error(
				'Error executing query', err.stack)
		}
		console.log("Connected to Database !")
	})
})

app.get('/users', (req, res) => {
  pool.query('SELECT * FROM users', (err, result) => {
    if (err) throw err;
    res.send(result.rows);
  });
});

// List all tables
app.get('/api/tables', (req, res) => {
  pool.query(`select table_schema||'.'||table_name as table_fullname
  from information_schema."tables"
  where table_type = 'BASE TABLE'
  and table_schema not in ('pg_catalog', 'information_schema')`, (err, result) => {
    if (err) throw err;
    res.send(result.rows);
  });
});


// Get table schema
app.get('/api/:tableName', (req, res) => {
  const tableName = req.params.tableName;
  pool.query(`SELECT column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = $1;`, [tableName], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result.rows);
    }
  });
});


// Get selected table data
app.post('/api/tableData', async (req, res) => {  
  const query = req.body.query; //'SELECT * FROM users'
  try {
    const result = await pool.query(query)
    return res.send({ result: result.rows });
  } catch (error) {
    console.error(error);
    return res.status(400).send({errors: error})
  }
})

// CRUD table in databae via http request
app.post('/api/query', async (req, res) => {  
  const query = req.body.query; //'CREATE TABLE anotherusers ( id serial PRIMARY KEY, name varchar(255) NOT NULL, email varchar(255) UNIQUE NOT NULL, password varchar(255) NOT NULL)'
  try {
    await pool.query(query)
    return res.send();
  } catch (error) {
    console.error(error);
    return res.status(400).send({errors: error})
  }
})


const server = app.listen(3000)