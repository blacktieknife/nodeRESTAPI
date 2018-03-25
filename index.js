//entry file for node REST API
const server = require("./lib/server");
const workers = require("./lib/workers");

var app = {};

app.init = () => {
//start server
    server.init();
//start workers
   // workers.init();
};

app.init();

module.exports = app ;
