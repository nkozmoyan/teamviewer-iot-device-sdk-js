connector = require("./tv-iot.js");

connector.connectAPI('./cert/cert-cf907f0faf0f4e978bb5398d32d27c13.pem','./cert/key-cf907f0faf0f4e978bb5398d32d27c13.pem');
/*
connector.createConnector();

*/

connector.on('connected',function(){

    console.log(`Connected securely to the API.`);

 
    connector.checkConnection(function(msg){
        console.log(msg);
    });
/*
    
    connector.createSensor('test name', function(msg){
        console.log(msg);
    });

    connector.updateSensor("ff7603e6ffbe40b1b8b77477db1dc2dc", 'New name', function(msg){
        console.log(msg);
    });
    
    connector.deleteSensor("bd41e49cb03f454db5a5571b3bd8f783", function(msg){
        console.log(msg);
    });

    metric = `	 { "metrics" : [
                                        {"matchingId" : "1", "valueUnit": "SI.Temperature.CELSIUS",  "name" : "SDK Test Metric" },
                                        {"matchingId" : "2", "valueType" : "integer" , "valueAnnotation": "Test Annotation", "name" : "Test name"}
                                        ]
                        }`;

    connector.registerMetric("ff7603e6ffbe40b1b8b77477db1dc2dc",metric, function(msg){
        console.log(msg);
    });


    var metricData = `{ "metrics": [ 
                                     { "value" : 100, 	"metricId" : "078d5ff310eb4219afcf1e9b9006672e"	},
                                     { "value" : 222, 	"metricId" : "b60ed9b6230047f3a3a6db13c2cb9d38"	}
                                    ] 
                    }`;
                    
    connector.updateSensor("ff7603e6ffbe40b1b8b77477db1dc2dc",metricData,function(msg){
        console.log(msg);
    });

 

    connector.updateSensorMetadata("ff7603e6ffbe40b1b8b77477db1dc2dc", 'New name', function(msg){
        console.log(msg);
    });
    
    
    connector.getMetricInfo("ff7603e6ffbe40b1b8b77477db1dc2dc","078d5ff310eb4219afcf1e9b9006672e",function(msg){
        console.log(msg);
    })
   
    var metrics = `{ "metrics": [ 
                                    { "metricId" : "0a44b7f4eefd48e18ea8ce208108d233" }
                                ] }"`;

    connector.deleteMetrics("ff7603e6ffbe40b1b8b77477db1dc2dc", metrics,function(msg){
        console.log(msg)
    });
    

     var error = `{ "errocode" : 2, "errorMessage" : "your Error Message here" }`;
   

    connector.errorAnnounce(error,function(msg){
        console.log(msg);
    });
 
    connector.deprovisionConnector(function(msg){
        console.log(msg);
    });
    */

    connector.getAllRegisteredSensors( function(msg){

        msg = obj = JSON.parse(msg);

        msg.forEach(function(element) {
            
           connector.deleteSensor(element['sensorId'], function(msg){
                console.log(msg);
            });
        });
        
    });

})
