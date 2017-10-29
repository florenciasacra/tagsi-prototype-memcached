/**
 * 
 * main
 * 
 */

'use strict';

const config = require('./config');
const cluster = require('cluster');

console.log('Prototype Memcached');

if (cluster.isMaster) {
  console.log(`Forking...`);
  for (let i = 0; i < config.clients_number; i++) {
    cluster.fork();
  }
} else {
	require('./clientConnection.js');
}
