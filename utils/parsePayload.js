//node lib modules
const {StringDecoder} = require('string_decoder');

//set up variables
const decoder = new StringDecoder('utf-8');

const decodePayload = (req) => {
  return new Promise((resolve, reject) => {
        let buffer = "";
        req.on("data", (chunk)=>{
            buffer += decoder.write(chunk);
        });

        req.on("error", ()=>{
            reject(err);
        });
        //resolve the promise if everything went ok with either the 
        //now complete incoming stream or null for checking if the req exists.
        req.on("end", ()=>{
        buffer += decoder.end();
        if(buffer.length > 0){
            resolve(buffer); 
        } else {
            resolve(null);
        }
        });

   });
    
}

module.exports = {
    decodePayload:decodePayload
}