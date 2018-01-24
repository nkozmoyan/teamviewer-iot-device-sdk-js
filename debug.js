connector = require("./tv-iot.js");
/*
connector.createConnector();
*/
connector.connectAPI('./cert/cert-cf907f0faf0f4e978bb5398d32d27c13.pem','./cert/key-cf907f0faf0f4e978bb5398d32d27c13.pem');

connector.on('connected',function(){

    console.log(`Connected securely to the API.`);

 
    connector.checkConnection(function(msg){
        console.log(msg);
    });

    connector.createSensor('test name', function(msg){
        console.log(msg);
    });

    
    connector.getAllRegisteredSensors(function(msg){
        console.log(msg);
    });
    
    /*
    connector.deprovisionConnector(function(msg){
        console.log(msg);
    });
    */
    
})
