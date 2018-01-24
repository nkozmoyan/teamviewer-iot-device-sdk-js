'use strict'

var connectorId = '90bcf22edc294aefa8e4bdf2662f4ee6';
var sensorId = '17ea4a25cce64041b5dd4dde5f3a4482';

//var rpiDhtSensor = require('rpi-dht-sensor');
var mqtt = require('mqtt')
var fs = require('fs')
var path = require('path')

var KEY = fs.readFileSync(path.join( './../cert/privkey.pem'));
var CERT = fs.readFileSync(path.join(`./../cert/${ connectorId }.pem`));
var TRUSTED_CA_LIST = fs.readFileSync(path.join('/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt'));

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

var client = mqtt.connect(options)

client.on('message', function (topic, message) {
  console.log(message);
})

client.on('connect', function () {
  console.log('Connected');
})


//var dht = new rpiDhtSensor.DHT11(2);


var temperature = 1;
var humidity;



function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

var reqBase = '/v1.0/' + connectorId + '/sensor/' + sensorId;
var reqTopic = reqBase;
var message = '';

publish();

function publish() {
        
    //var readout = dht.read();    
    var rnd = getRandomInt(0,100);
    //temperature =  readout.temperature.toFixed(2);
    //humidity    =  readout.humidity.toFixed(2);
    
    if(temperature != 0.00){
    
    message =`{ "metrics": [ 
                    	//{ "value" : ${ temperature }, 	"metricId" : "7b546a08029d47f581fd5374bf706aec"	},
                    	{ "value" : ${ rnd }, 	"metricId" : "54d833cf9eda4ac1888d74081860c230"	}
                    	] 
	    }`;	

    //console.log(`Publishing values: Temperature: ${ temperature }, Humidity: ${ humidity } to: ${ reqTopic }`);
    console.log(`Publishing values: Rnd: ${ rnd } to: ${ reqTopic }`);
    client.publish(reqTopic,message);
    
    }
    
    setTimeout(publish, 30000);

}





