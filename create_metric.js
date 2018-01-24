'use strict'
var mqtt = require('mqtt')
var fs = require('fs')
var path = require('path')

var myArgs = process.argv.slice(2);

var connectorId = myArgs[0];
var sensorId = myArgs[1];

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

var reqBase = '/v1.0/'+ connectorId + '/sensor/' + sensorId + '/metric';

var req = reqBase + '';
var res = reqBase + '/inbox';
var err = reqBase + '/error/inbox'; 

var reqMsg = `	 { "metrics" : [
                    //{"matchingId" : "1", "valueUnit": "SI.Temperature.CELSIUS",  "name" : "Temperature" },
                    {"matchingId" : "1", "valueType" : "integer" , "valueAnnotation": "Randomness rate (RR)", "name" : "Random Generator"}
                 ]
}`;

var reqPing = '/v1.0/' + connectorId + '/ping';
var resPing = reqPing + '/info/inbox';

var client = mqtt.connect(options);

client.subscribe(resPing);
client.publish(reqPing,'{"request":"This is a ping!"}');

console.log(req);
console.log(res);
console.log(err);

client.subscribe(res);
client.subscribe(err);
client.publish(req, reqMsg)

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









