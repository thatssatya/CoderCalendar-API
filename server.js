const http = require('http');
const cache = require('memory-cache');
const url = require('url');
const aggregate = require('./aggregate');
const filter = require('./filter');

const cacheTTL = 15 * 60 * 1000;

const server = http.createServer((req, res) => {
  const urlParts = url.parse(req.url, true);

  if (urlParts.pathname !== '/') {
    res.writeHead(404);
    res.end();
    return;
  }

  const options = {
    platform: urlParts.query.platform || null,
    status: urlParts.query.status || null,
  };

  const cachedResults = cache.get('results');
  if (cachedResults) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(
      { results: filter(cachedResults, options) },
    ));
    res.end();
  } else {
    aggregate().then((contests) => {
      cache.put('results', contests, cacheTTL);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.write(JSON.stringify(
        { results: filter(contests, options) },
      ));
      res.end();
    })
      .catch((error) => {
        console.log(error.toString());
        res.writeHead(500);
        res.end();
      });
  }
});

server.listen(8000);

module.exports = server;
