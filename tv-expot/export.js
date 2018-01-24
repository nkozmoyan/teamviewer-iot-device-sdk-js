'use strict'

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

publish();

function publish() {
        
    var rnd = getRandomInt(0,100);
   
    console.log(`Publishing values: Rnd: ${ rnd } to: ${ reqTopic }`);
    
    setTimeout(publish, 30000);

}