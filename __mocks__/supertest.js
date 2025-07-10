const http = require('http');

function makeRequest(app) {
  return {
    get: path => execute('GET', path),
    delete: path => execute('DELETE', path),
    post: path => withBody('POST', path),
    put: path => withBody('PUT', path)
  };

  function withBody(method, path) {
    return { send: body => execute(method, path, body) };
  }

  function execute(method, path, body) {
    return new Promise((resolve, reject) => {
      const server = app.listen();
      const opts = { method, path, port: server.address().port, headers: {} };
      let data = null;
      if (body) {
        data = JSON.stringify(body);
        opts.headers['Content-Type'] = 'application/json';
        opts.headers['Content-Length'] = Buffer.byteLength(data);
      }
      const req = http.request(opts, res => {
        let resData = '';
        res.on('data', c => (resData += c));
        res.on('end', () => {
          server.close();
          let parsed = resData;
          try { parsed = JSON.parse(resData); } catch (e) {}
          resolve({ status: res.statusCode, body: parsed });
        });
      });
      req.on('error', err => { server.close(); reject(err); });
      if (data) req.write(data);
      req.end();
    });
  }
}
module.exports = makeRequest;
