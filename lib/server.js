//server related tasks
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const _data = require("./data");
const config = require("../config");

const {handleRequests} = require('../router/requestHandler');

//setup variables

const server = {};

//starting an http server
server.httpServer = http.createServer(( req, res ) =>{
    handleRequests(req, res);
});


server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname,"/../https/key.pem")),
    'cert': fs.readFileSync(path.join(__dirname,"/../https/cert.pem")),
};

server.httpsServer = https.createServer(server.httpsServerOptions,( req, res ) =>{
    handleRequests(req, res);
});



server.init = async () => {
    //start http server
    server.httpServer.listen(config.httpPort, ()=>{
        console.log(`http server is lisenting on port ${config.httpPort}`);
    });

    //start https server
    server.httpsServer.listen(config.httpsPort, ()=>{
        console.log(`https server is lisenting on port ${config.httpsPort}`);
    });

    try {
        const bb = await _data.list("test");
        console.log(bb);
    } catch(err) {
        console.log(err);
    }
}

module.exports = server;
//a request router
// const router = {
//     "sample":routeHandlers.sample,
//     "notfound":routeHandlers.notFound

// };
