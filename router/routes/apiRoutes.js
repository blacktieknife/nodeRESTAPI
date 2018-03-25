const lib = require("../../lib");

const sample = function(data, callback) {
    callback(406, {'name':'sample route handler!'})

};

const notFound = function(data, callback) {
    callback(404, {"error":`path not found: ${data.trimmedPath}`});
};

const ping = function(data, callback) {
    callback(200, {'name':'Ping router!'})
}

const users = function(data, callback) {
    const acceptableMethods = ['post','get','put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
        lib._users[data.method](data,callback)
    } else {
        callback(405);  
    }
}

const tokens = function(data, callback) {
    const acceptableMethods = ['post','get','put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
       lib._tokens[data.method](data,callback)
    } else {
        callback(405);  
    }
}

const checks = function(data, callback) {
    const acceptableMethods = ['post','get','put', 'delete'];
    if(acceptableMethods.indexOf(data.method) > -1) {
       lib._checks[data.method](data,callback)
    } else {
        callback(405);  
    }
}


module.exports = {
    sample,
    notFound,
    ping,
    users,
    tokens,
    checks
};