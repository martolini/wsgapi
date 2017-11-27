'use strict';
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').load();
}
const server = require('./server');

server.listen(server.get('port'), () => {
  console.log(`Listening on ${server.get('port')}`);
});
