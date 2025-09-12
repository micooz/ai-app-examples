import express from 'express';

const app = express();

app.get('/sse', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  res.write('data: Hello World\n\n');
  res.end();
});

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});
