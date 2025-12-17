// Example: upload image to AI service from Node (server-side)
const fs = require('fs');
const fetch = require('node-fetch');
const FormData = require('form-data');

async function analyzeImage(filePath){
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  const res = await fetch('http://localhost:8000/analyze', { method: 'POST', body: form });
  const data = await res.json();
  console.log(data);
}

analyzeImage('./examples/sample.jpg').catch(console.error);
