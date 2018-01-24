const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const x509 = require('x509');

var CERT_REQUEST = fs.readFileSync(path.join('./cert/cert_request.pem'));
//var TRUSTED_CA_LIST = fs.readFileSync(path.join('/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt'));

var PORT = 1883
var HOST = '10.70.14.245'

var options = {
  port: PORT,
  host: HOST,
  rejectUnauthorized: false, // The CA list will be used to determine if server is authorized
  //ca: TRUSTED_CA_LIST,
  protocol: 'tls'
}

var client = mqtt.connect(options)

var certHash = crypto.createHash('sha256').update(CERT_REQUEST).digest('hex');

var subscribeTopic = '/certBack/' + certHash;
var publishTopic = '/createConnector';

var requestMsg = CERT_REQUEST.toString("ascii");

client.on('connect', function () {

    console.log(`>>> Connected!`);
    console.log(`Sub: ${ subscribeTopic }\nPub: ${ publishTopic }\nRequest has been sent.`);
    
    client.subscribe(subscribeTopic);
    client.publish(publishTopic, requestMsg);

});


client.on('message', function (topic, message) {
    
    message = message.toString();

    console.log(`Response:OK`);
    
    var connectorId  = x509.parseCert(message).subject.commonName;
    
    var certFileName = './cert/' + connectorId + '.pem'; 

    fs.writeFileSync(certFileName, message);

    console.log(`Certificate for connector(${ connectorId }) has been saved -> ${certFileName}`);

});


client.on('error', (msg) => console.log('error: ' + msg));

client.on('offline', (msg) => console.log('offline: ' + msg));

client.on('close', (msg) => console.log('close: ' + msg));










