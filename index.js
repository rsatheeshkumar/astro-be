// Entry Point of the API Server
const express = require('express');
const  cors = require('cors');
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

// const pools = {
//   'ljflajdfa': new Pool()
// }

// pools["flsjsldjl"] = new Pool()


/* To handle the HTTP Methods Body Parser
is used, Generally used to extract the
entire body portion of an incoming
request stream and exposes it on req.body
*/
const bodyParser = require('body-parser');
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors())
// pools[cookie_ID].query


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
  pool.query(`SELECT ordinal_position, column_name, data_type, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_name = $1;`, [tableName], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result.rows);
    }
  });
});

// Get table columns name
app.get('/api/columns/:tableName', (req, res) => {
  const tableName = req.params.tableName;
  pool.query(`      SELECT COLUMN_NAME
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_NAME = $1`, [tableName], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(result.rows);
    }
  });
});


// Get indexes
app.get('/api/indexes/:tableName', (req, res) => {
  const tableName = req.params.tableName;
  pool.query(`SELECT
  t.relname AS table_name,
  i.relname AS index_name,
  i.relam AS index_algorithm,
  a.attname AS column_name,
  ix.indisunique AS in_unique,
  pg_get_expr(ix.indpred, t.oid) AS conditions
FROM
  pg_class t,
  pg_class i,
  pg_index ix,
  pg_attribute a
WHERE
  t.oid = ix.indrelid
  AND i.oid = ix.indexrelid
  AND a.attrelid = t.oid
  AND a.attnum = ANY(ix.indkey)
  AND t.relname = $1
ORDER BY
  t.relname,
  i.relname;`, [tableName], (err, result) => {
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
    return res.status(400).send({ errors: error })
  }
});

// Update table row data
app.put('/update/:tableName', (req, res) => {
  try {
    const tableName = req.params.tableName;
    const data = req.body;
    let query = `UPDATE ${tableName} SET `;
    let id;

    // create query based on dynamic data
    for (const key in data) {
      if (key === 'id') {
        id = data[key];
        continue;
      }
      query += `${key} = '${data[key]}',`;
    }
    
    // remove trailing comma
    query = query.slice(0, -1);
    query += ` WHERE id = ${id}`;

    // execute query
    pool.query(query, (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).send({ error: 'Error executing query' });
      }
      // return success status
      res.status(200).send({ message: `${results.rowCount} row(s) updated` });
    });
  } catch (err) {
    res.status(500).send({ message: 'Failed to update data' });
    console.error(err.stack);
  }
});

// CRUD table in databae via http request
app.post('/api/query', async (req, res) => {
  const query = req.body.query; //'CREATE TABLE anotherusers ( id serial PRIMARY KEY, name varchar(255) NOT NULL, email varchar(255) UNIQUE NOT NULL, password varchar(255) NOT NULL)'
  try {
    await pool.query(query)
    return res.send();
  } catch (error) {
    console.error(error);
    return res.status(400).send({ errors: error })
  }
})


const server = app.listen(3000)