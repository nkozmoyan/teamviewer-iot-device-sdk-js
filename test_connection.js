'use strict'
var mqtt = require('mqtt')
var fs = require('fs')
var path = require('path');
var connectorId = 'cf907f0faf0f4e978bb5398d32d27c13';
var certFile = './cert/cert-cf907f0faf0f4e978bb5398d32d27c13.pem';

var KEY = fs.readFileSync(path.join( './cert/key-cf907f0faf0f4e978bb5398d32d27c13.pem'))
var CERT = fs.readFileSync(path.join(certFile));
//var TRUSTED_CA_LIST = fs.readFileSync(path.join('./cert/TeamViewerAuthority.crt'))

var PORT = 8883
var HOST = '10.70.14.245'

var options = {
  port: PORT,
  host: HOST,
  key: KEY,
  cert: CERT,
  rejectUnauthorized: false,
  // The CA list will be used to determine if server is authorized
  //ca: TRUSTED_CA_LIST,
  protocol: 'mqtt'
}

var reqBase = '/v1.0/'+ connectorId;

var reqPing = reqBase + '/ping';
var resPing = reqPing + '/info/inbox';

var client = mqtt.connect(options);
console.log(reqPing);
client.subscribe(resPing);
client.publish(reqPing,'{"request":"This is a ping!"}');


//-----------------------------------------------------------------------------------------------

client.on('connect', function () {
  console.log('Connected');
})

client.on('message', function (topic, message) {
  console.log(message.toString())
})

client.on('error', (msg) => console.log('error: ' + msg));

client.on('offline', (msg) => console.log('offline: ' + msg));

client.on('close', (msg) => console.log('close: ' + msg));









