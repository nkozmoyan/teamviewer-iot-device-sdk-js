'use strict'
var mqtt = require('mqtt')
var fs = require('fs')
var path = require('path')

var myArgs = process.argv.slice(2);

var connectorId = myArgs[0];

if (!connectorId){
    console.error(`connector Id is missing.`);
    process.exit(0);

}

var certFile = './cert/'+connectorId+'.pem';

var KEY = fs.readFileSync(path.join( './cert/privkey.pem'))
var CERT = fs.readFileSync(path.join(certFile));
var TRUSTED_CA_LIST = fs.readFileSync(path.join('/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt'))

var PORT = 8883
var HOST = 'localhost'

var options = {
  port: PORT,
  host: HOST,
  key: KEY,
  cert: CERT,
  rejectUnauthorized: true,
  // The CA list will be used to determine if server is authorized
  ca: TRUSTED_CA_LIST,
  protocol: 'mqtt'
}

var reqBase = '/v1.0/'+connectorId;

var req = reqBase + '/delete';
var err = req + '/error/inbox'; 

var reqMsg = '{}';

var reqPing = reqBase + '/ping';
var resPing = reqPing + '/info/inbox';

var client = mqtt.connect(options);

client.subscribe(resPing);
client.publish(reqPing,'{"request":"This is a ping!"}');

console.log(req);
console.log(err);

client.subscribe(err);
client.publish(req, reqMsg)

fs.unlink(certFile, (err)=>console.log(err));

client.on('connect', function () {
  console.log('Connected');
})


client.on('message', function (topic, message) {
  console.log(message.toString())
})

client.on('error', (msg) => console.log('error: ' + msg));

client.on('offline', (msg) => console.log('offline: ' + msg));

client.on('close', (msg) => console.log('close: ' + msg));









