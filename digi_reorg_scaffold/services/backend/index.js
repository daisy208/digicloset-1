const express = require('express');
const app = express();
const port = process.env.PORT || 4000;

app.get('/health', (req,res) => res.json({status: 'ok'}));
app.get('/api/ping', (req,res) => res.json({pong: true}));

app.listen(port, ()=> console.log('Backend listening on', port));
