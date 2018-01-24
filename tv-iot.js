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
        this.APIversion = '/v1.0/'; 

        this.connectionOptions = {
            host: this.host,
            rejectUnauthorized: false,
            //ca: this.TrustedCA,
        };
        //this.TrustedCA = '/var/lib/teamviewer-iot-agent/certs/TeamViewerAuthority.crt';

    }


    connectAPI(certFile,keyFile){

        if (!certFile || !keyFile){

            this.connectionOptions.port =  1883;
            this.connectionOptions.protocol = 'tls';

            this.clientConnect(this.connectionOptions);
              
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
        this.clientConnect();

    }

    clientConnect(){

        this.client  = mqtt.connect( this.connectionOptions );

        this.client.on('connect', this.setConnection.bind(this));
        this.client.on('message', this.handleResponse.bind(this));

        this.client.on('error', (msg) => console.log('error: ' + msg));
        this.client.on('offline', (msg) => console.log('offline: ' + msg));
        this.client.on('close', (msg) => console.log('close: ' + msg));
    }

    setConnection(){
        
        this.emit('connected'); 
    
    }
    
    handleResponse(topic, message){

        message = message.toString();
        this.emit(topic,message);

    }

    publishAPI(subscribeTopic, publishTopic, message,callback){

        console.log(`Sub: ${ subscribeTopic }\nPub: ${ publishTopic }\nMsg: ${ message }`);
        
        this.client.subscribe(subscribeTopic);
        this.client.publish(publishTopic, message);

        this.on(subscribeTopic,callback);
    }
    
    createConnector() { // Creates a certifcate for a new connector
        
        this.connectAPI();

        this.on('connected',function(){
            pem.createCSR( { hash:'sha256' }, this.csrRequest.bind(this));
        }.bind(this));
        

    }

    csrRequest(err,obj){

        var csrReq = obj.csr + '\n';
        
        this.clientKey = obj.clientKey;

        var csrHash = crypto.createHash('sha256').update(csrReq,'ascii').digest('hex');

        var subscribeTopic = '/certBack/' + csrHash;
        var publishTopic = '/createConnector';

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

    getAllRegisteredSensors(callback){ 
        
        var publishTopic = this.APIversion + this.connectorId +'/inventory';
        var subscribeTopic = publishTopic + '/inbox';
        var message = '{}';

        this.publishAPI(subscribeTopic,publishTopic,message, callback);
    }

    deprovisionConnector(callback){
        
        var publishTopic = this.APIversion + this.connectorId +'/delete';
        var errorTopic = publishTopic + '/error/inbox';
        var message = '{}';

        this.publishAPI(errorTopic,publishTopic,message, callback);
    }

    // --- Connect

    checkConnection(callback){

        var publishTopic = this.APIversion + this.connectorId +'/ping';
        var subscribeTopic = publishTopic + '/info/inbox';
        var message = '{"request":"This is a ping!"}';

        this.publishAPI(subscribeTopic,publishTopic,message, callback);
    }

    // ---  Sensor

    createSensor(sensorName, callback){

        var publishTopic = this.APIversion + this.connectorId +'/sensor/create';
        var subscribeTopic = this.APIversion + this.connectorId +'/sensor/inbox';
        var errorTopic = this.APIversion + this.connectorId +'/sensor/error/inbox';

        var message = `{ "name" : "${ sensorName }" }`;

        this.publishAPI(subscribeTopic,publishTopic,message, callback);

    }

    updateSensor(){
        return;
    }

    updateSensorMetadata(){
        return;
    }

    getMetricInfo(){
        return;
    }

    deleteSensor(){
        return;
    }

    updateMetrics(){
        return;
    }
    
    // --- Metric

    registerMetric(){
        return;
    }
    
    deleteMetrics(){
        return;
    }
    // --- Error reporting
    
    errorAnnounceConnector(){
        return;
    }

    errorAnnounceSensor(){
        return;
    }

    errorAnnounceMetric(){
        return;
    }
}

module.exports = new TVIoT;