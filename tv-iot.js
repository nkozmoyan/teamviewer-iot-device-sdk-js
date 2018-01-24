const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const pem = require('pem');
const Emmiter = require('events');

class TVIoT extends Emmiter {
    // --- Connector
   
    constructor() {
        
        super();
        
        this.host = '10.70.14.245';
        //this.TrustedCA = '/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt';
        this.APIversion = '/v1.0/'; 

        this.connectionOptions = {
            host: this.host,
            rejectUnauthorized: false,
            //ca: this.TrustedCA,
        };
        

    }

    connectAPI(certFile,keyFile){

        if (!certFile || !keyFile){

            this.connectionOptions.port =  1883;
            this.connectionOptions.protocol = 'tls';

            this.connectClient(this.connectionOptions);
              
        } else {
            this.connectionOptions.port =  8883;
            this.connectionOptions.protocol = 'mqtt';

            this.connectionOptions.key  = fs.readFileSync(path.join( keyFile));
            this.connectionOptions.cert = fs.readFileSync(path.join( certFile));

            pem.readCertificateInfo(this.connectionOptions.cert, this.getConnectorId.bind(this)); 
        }
        

    }

    getConnectorId(err,obj){

        this.connectorId  = obj.commonName;
        this.connectClient();

    }

    connectClient(){

        this.client  = mqtt.connect( this.connectionOptions );

        this.client.on('connect', this.onConnect.bind(this));
        this.client.on('message', this.onMessage.bind(this));

        this.client.on('error',  (msg) => console.log('error: ' + msg));
        this.client.on('offline',(msg) => console.log('offline: ' + msg));
        this.client.on('close',  (msg) => console.log('close: ' + msg));
    }

    onConnect(){
        
        this.emit('connected'); 
    
    }
    
    onMessage(topic, message){

        message = message.toString();
        
        this.emit(topic,message);

    }

    publishAPI(subscribeTopic, publishTopic, message,callback){

        console.log(`\n\nSub: ${ subscribeTopic }\nPub: ${ publishTopic }\nMsg: ${ message }\n\n`);
        
        this.client.subscribe(subscribeTopic);
        this.client.publish(publishTopic, message);

        this.on(subscribeTopic,callback);
    }
    
    csrRequest(err,obj){

        var csrReq = obj.csr + '\n';
        
        this.clientKey = obj.clientKey;

        var csrHash = crypto.createHash('sha256').update(csrReq,'ascii').digest('hex');

        var subscribeTopic = '/certBack/' + csrHash;
        var publishTopic   = '/createConnector';

        var message = csrReq.toString("ascii");

        this.publishAPI(subscribeTopic,publishTopic,message, this.saveCert.bind(this));

    }

    saveCert(crt){

        this.crt = crt;

        pem.readCertificateInfo(crt, this.writeFiles.bind(this)); 

    }

    writeFiles(err, obj){
        
        var connectorId  = obj.commonName;
        
        var certFile= './cert/cert-' + connectorId + '.pem'; 
        var keyFile = './cert/key-' + connectorId + '.pem'; 

        fs.writeFileSync(certFile, this.crt);
        fs.writeFileSync(keyFile, this.clientKey);
        
        console.log(`Key / Certificate for connector( ${ connectorId } ) has been saved as ${keyFile} / ${certFile}`);
    }

    // --- 2.Connector

    createConnector() { // Creates a certifcate for a new connector
        
        /*
        2.1
        */

        this.connectAPI(); // with no arguments, connects using 1883 port

        this.on('connected',function(){
            pem.createCSR( { hash:'sha256' }, this.csrRequest.bind(this));
        }.bind(this));
        

    }

    getAllRegisteredSensors(callback){ 
        
        /*
        2.2
        */

        var publishTopic = this.APIversion + this.connectorId +'/inventory';
        var subscribeTopic = publishTopic + '/inbox';
        var message = '{}';

        this.publishAPI(subscribeTopic,publishTopic,message, callback);
    }

    deprovisionConnector(callback){
        
        /*
        2.3
        */
        
        var publishTopic = this.APIversion + this.connectorId +'/delete';
        var errorTopic = publishTopic + '/error/inbox';
        var message = '{}';

        this.publishAPI(errorTopic,publishTopic,message, callback);
    }

    checkConnection(callback){

        /*
        2.4
        */

        var publishTopic = this.APIversion + this.connectorId +'/ping';
        var subscribeTopic = publishTopic + '/info/inbox';
        var message = '{"request":"This is a ping!"}';

        this.publishAPI(subscribeTopic,publishTopic,message, callback);
    }

    // ---  3.Sensor

    createSensor(sensorName, callback){

        /*
        3.1
        /:version/:connectorId/sensor/create
        */

        var publishTopic = this.APIversion + this.connectorId +'/sensor/create';
        var subscribeTopic = this.APIversion + this.connectorId +'/sensor/inbox';
        var errorTopic = this.APIversion + this.connectorId +'/sensor/error/inbox';

        var message = `{ "name" : "${ sensorName }" }`;

        this.publishAPI(subscribeTopic,publishTopic,message, callback);

    }

    updateSensor(sensorId,metricData,callback){ 
        
        /*
        3.2
        This method should be renamed to putMetrics (plural) 
        return topic is not documented

        /:version/:connectorId/sensor/:sensorId 
        /:version/:connectorId/sensor/:sensorId/info/inbox
        */

        var reqBase = this.APIversion + this.connectorId +'/sensor/'+ sensorId;

        var publishTopic    = reqBase + '';
        var subscribeTopic  = reqBase + '/info/inbox';
        var errorTopic      = reqBase + '/error/inbox'; 

        var message = metricData;

        this.publishAPI(subscribeTopic,publishTopic,message, callback);
    }

    updateSensorMetadata(sensorId,sensorName, callback){
        /*
        3.3
        /:version/:connectorId/sensor/:sensorId/update
        /:version/:connectorId/sensor/:sensorId/error/inbox
        */

        var reqBase = this.APIversion + this.connectorId +'/sensor/'+ sensorId + '/update';

        var publishTopic    = reqBase + '';
        var errorTopic      = reqBase + '/error/inbox'; 

        var message = `{ "name" : "${ sensorName }" }`;
        console.log(message);
        this.publishAPI(errorTopic,publishTopic,message, callback);
    }

    getMetricInfo(sensorId,metricId,callback){

        /*
        3.4
        /:version/:connectorId/sensor/:sensorId/metric/:metricId/inventory
        /:version/:connectorId/sensor/:sensorId/metric/:metricId/inventory/inbox

        /:version/:connectorId/sensor/:sensorId/inventory/error/inbox
        -m {} No mention in documentation about empty JSON
        */

        var reqBase = this.APIversion + this.connectorId +'/sensor/'+ sensorId + '/metric/'+ metricId +'/inventory';

        var publishTopic    = reqBase + '';
        var subscribeTopic  = reqBase + '/inbox';
        var errorTopic      = this.APIversion + this.connectorId +'/sensor/'+ sensorId + '/inventory/error/inbox';

        var message = '{}';

        this.publishAPI(subscribeTopic,publishTopic,message, callback);

    }

    deleteSensor(sensorId,callback){
        /*
        3.5
        /:version/:connectorId/sensor/:sensorId/delete
        /:version/:connectorId/sensor/:sensorId/delete/info/inbox
        /:version/:connectorId/sensor/:sensorId/delete/error/inbox
        */

        var reqBase = this.APIversion + this.connectorId +'/sensor/'+ sensorId + '/delete';

        var publishTopic    = reqBase + '';
        var subscribeTopic  = reqBase + '/info/inbox';
        var errorTopic      = reqBase + '/error/inbox'; 

        var message = '{}';

        this.publishAPI(subscribeTopic,publishTopic,message, callback);

    }


    
    // --- 4.Metric

     
    registerMetric(sensorId,metricDefinition,callback){

        /*
        4.1

        */

        var reqBase = this.APIversion + this.connectorId +'/sensor/'+ sensorId + '/metric';

        var publishTopic    = reqBase + '';
        var subscribeTopic  = reqBase + '/inbox';
        var errorTopic      = reqBase + '/error/inbox'; 

        var message = `	 { "metrics" : [
                                        {"matchingId" : "1", "valueUnit": "SI.Temperature.CELSIUS",  "name" : "SDK Test Metric" },
                                        {"matchingId" : "2", "valueType" : "integer" , "valueAnnotation": "Test Annotation", "name" : "Test name"}
                                        ]
                        }`;

        this.publishAPI(subscribeTopic,publishTopic,message, callback);
    }
    
    deleteMetrics(sensorId,metrics,callback){
        /*
        4.2
        /:version/:connectorId/sensor/:sensorId/metric/delete
        /:version/:connectorId/sensor/:sensorId/delete/error/inbox
        /:version/:connectorId/sensor/:sensorId/delete/info/inbox
        */
        var reqBase = this.APIversion + this.connectorId +'/sensor/'+ sensorId ;
        
        var publishTopic    = reqBase + '/metric/delete';
        var subscribeTopic  = reqBase + '/delete/info/inbox';
        var errorTopic      = reqBase + '/delete/error/inbox';

        var message = metrics;

        this.publishAPI(subscribeTopic,publishTopic,message, callback);
    }


    // --- 5.Error - When there is an error in your connector application, you can announce this error to the api with this function.
    
    errorAnnounceConnector(error, callback){
        /*
        5.1
        /:version/:connectorId/error
        /:version/:connectorId/error/inbox
        */  

        var reqBase = this.APIversion + this.connectorId +'/error';
        
        var publishTopic    = reqBase + '';
        var errorTopic      = reqBase + '/inbox';

        var message = error;

        this.publishAPI(errorTopic,publishTopic,message, callback);
    }

    errorAnnounceSensor(sensorId,error, callback){
        /*
        5.2
        /:version/:connectorId/sensor/:sensorId/error
        /:version/:connectorId/sensor/:sensorId/error/inbox
        */

        var reqBase = this.APIversion + this.connectorId + 'sensor' + sensorId + '/error';
        
        var publishTopic    = reqBase + '';
        var errorTopic      = reqBase + '/inbox';

        var message = error;

        this.publishAPI(errorTopic,publishTopic,message, callback);
    }

    errorAnnounceMetric(sensorId,metricId,error, callback){
        /*
        5.3
        /:version/:connectorId/sensor/:sensorId/metric/:metricId/error
         /:version/:connectorId/sensor/:sensorId/metric/:metricId/error/inbox
        */

        var reqBase = this.APIversion + this.connectorId + 'sensor' + sensorId + 'metric' + metricId + '/error';
        
        var publishTopic    = reqBase + '';
        var errorTopic      = reqBase + '/inbox';

        var message = error;

        this.publishAPI(errorTopic,publishTopic,message, callback);
    }


}

module.exports = new TVIoT;