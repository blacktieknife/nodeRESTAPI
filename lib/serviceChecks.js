const _data = require("../lib/data");
const verifyToken = require("../utils/verifyToken");
const isEmpty = require("../utils/isEmpty");
const createRandomString = require("../utils/createRandomString");
const config = require('../config');

_checks = {};

//protocol, url, method, successCodes, timeoutSeconds
_checks.post = async (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    const acceptableProtocols = ['http', 'https'];
    let inputsValid = false;
    const missingRequired = [];
    checkPayload = {};
    checkPayload.protocol = data.payload && typeof(data.payload.protocol) === "string" && acceptableProtocols.includes(data.payload.protocol) ? data.payload.protocol : false;
    checkPayload.url = data.payload && typeof(data.payload.url) === "string" && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
    checkPayload.method = data.payload && typeof(data.payload.method) === "string" && data.payload.method.length > 0 && acceptableMethods.includes(data.payload.method) ? data.payload.method : false;
    checkPayload.successCodes = data.payload && data.payload.successCodes instanceof Array && data.payload.successCodes.length > 0 ? data.payload.successCodes : false;
    checkPayload.timeoutSeconds = data.payload && typeof(data.payload.timeoutSeconds) === "number" && data.payload.timeoutSeconds > 0 ? data.payload.timeoutSeconds :false;

    for(key in checkPayload){
        if(!checkPayload[key]){
            missingRequired.push(key)
        }
    }

    if(missingRequired.length > 0) {
        callback(422, {"error":"missing or invalid required fields", "fields":missingRequired});
    } else {
        inputsValid = true; 
    }

    if (inputsValid) {
        const userToken = typeof(data.headers.token) === "string" ? data.headers.token : false;
        try {
            const tokenData = await _data.read('tokens', userToken);
            if(tokenData){
                const user = await _data.read('users', tokenData.phone);
                const userValid = await verifyToken(userToken, user.phone);
                if(userValid){
                    const userChecks = user.checks instanceof Array && user.checks.length > 0 ? user.checks : [];
                    if(userChecks.length < config.maxChecks) {
                        const checkId = createRandomString(20);
                        const checkObj = {};
                        checkObj.id = checkId;
                        checkObj.userPhone = user.phone;
                        checkObj.protocol = checkPayload.protocol;
                        checkObj.url = checkPayload.url;
                        checkObj.method = checkPayload.method;
                        checkObj.successCodes = checkPayload.successCodes;
                        checkObj.timeoutSeconds = checkPayload.timeoutSeconds;
                        try{
                            await _data.create('checks', checkId, checkObj);
                            user.checks = userChecks;
                            user.checks.push(checkId);
                            await _data.update('users', user.phone, user);
                            callback(200, checkPayload);
                        } catch(err) {
                            callback(500,{"error":"Could not create new check "+err});
                        }
                    } else {
                        callback(400, {"error":"maximum number of checks. "+config.maxChecks});
                    }
                    
                } else {
                    callback(403, {"error":"Token invalid"});
                }
            } else {
                callback(500,{"error":"ERROR TOKEN DATA NOT FOUND"});
            }
        } catch(err) {
            console.log(err);
            callback(500,{"error":"ERROR IN PROMISE ",err});
        }
    }

};
//required phone
//autenticate user to return only users checks
_checks.get = async (data, callback) => {
    //check the phone
    const phone = data.queryStringObject && typeof(data.queryStringObject.phone) === "string" &&  data.queryStringObject.phone.length === 10 ? data.queryStringObject.phone : false;
    const checkId = data.queryStringObject && typeof(data.queryStringObject.id) === "string" &&  data.queryStringObject.id.length > 0 ? data.queryStringObject.id : false;
    if(phone && !checkId) {
        const userToken = typeof(data.headers.token) === 'string' && data.headers.token.length > 0 ? data.headers.token : false;
        try {
            const tokenData = await _data.read("tokens", userToken);
            if(tokenData) {
                const user = await _data.read("users", tokenData.phone);
                const userValid = await verifyToken(userToken, user.phone);
                if(userValid) {
                    const userChecks = user.checks instanceof Array && user.checks.length > 0 ? user.checks : [];
                    //create an array of pending promises reading data from checks based on users check list
                    const checkPromises = userChecks.map(async(check)=>{
                        return await _data.read("checks", check);  
                    });
                    //on resolution of all promises in array send result
                    Promise.all(checkPromises).then((results)=>{
                        callback(200,results);
                    }).catch((err)=>{
                        console.log("ERR FROM PROMISE ALL in CHECKS GET",err);
                        callback(500,{"error":"error in promise all function in checks get"});
                    });
                
                } else {
                    callback(403,{"error":"could not authenticate users token"});
                }
            } else {
                callback(403,{"error":"could not get tokens with user token provided"});
            }
        } catch(err) {
            callback(500,{"error":"Err caught in promise - checks get - "+err})
        }
    } else if(phone && checkId) {
        const userToken = typeof(data.headers.token) === 'string' && data.headers.token.length > 0 ? data.headers.token : false;
        try {
            const tokenData = await _data.read("tokens", userToken);
            if(tokenData) {
                const user = await _data.read("users", tokenData.phone);
                const userValid = await verifyToken(userToken, user.phone);
                if(userValid) {
                    const userChecks = user.checks instanceof Array && user.checks.length > 0 ? user.checks : [];
                    //create an array of pending promises reading data from checks based on users check list
                    if(userChecks.includes(checkId)) {
                        const returnCheck = await _data.read('checks', checkId);
                        callback(200, returnCheck);
                    } else {
                        callback(400, {"error":"Check not found in users checks"});  
                    }
                
                } else {
                    callback(403,{"error":"could not authenticate users token"});
                }
            } else {
                callback(403,{"error":"could not get tokens with user token provided"});
            }
        } catch(err) {
            callback(500,{"error":"Err caught in promise - checks get - "+err})
        }
    } else {
        callback(404,{"error":"missing required input"});
    }
};
//we want to update the previous check
//checkID, checkUpdatePayload {protocol, url, method, successCodes, timeoutSeconds}
_checks.put = async (data, callback) => {
    const acceptableMethods = ['post', 'get', 'put', 'delete'];
    const acceptableProperites = ["protocol", "url", "method", "successCodes", "timeoutSeconds"];
    const acceptableProtocols = ['http', 'https'];
    let inputsValid = false;
    const updatedChecks = {};
    const invalidUpdates = [];
    const checkId = data.payload && typeof(data.payload.id) === 'string' ? data.payload.id : false;
    const checkUpdatePayload = data.payload && typeof(data.payload.checkUpdate) === 'object' && !isEmpty(data.payload.checkUpdate) ? data.payload.checkUpdate : false;
    if(checkUpdatePayload){
        for(key in checkUpdatePayload) {
            if(!acceptableProperites.includes(key)) 
                invalidUpdates.push(key);
        }
        if(isEmpty(invalidUpdates)) {
            if(checkId) {
                const userToken = data.headers.token && typeof(data.headers.token) === 'string' && data.headers.token.length > 0 ? data.headers.token : false;
                if(userToken){
                    try {
                        const tokenData = await _data.read("tokens", userToken);
                        const user = await _data.read("users", tokenData.phone);
                        const validUser = await verifyToken(userToken, user.phone);
                        if(validUser) {
                            const check = await _data.read("checks", checkId);
                            updatedChecks.protocol = checkUpdatePayload.protocol && typeof(checkUpdatePayload.protocol) === 'string' && acceptableProtocols.includes(checkUpdatePayload.protocol) ? checkUpdatePayload.protocol : false;
                            updatedChecks.url = checkUpdatePayload.url && typeof(checkUpdatePayload.url) === 'string' && checkUpdatePayload.url.length > 0 ? checkUpdatePayload.url : false;
                            updatedChecks.method = checkUpdatePayload.method && typeof(checkUpdatePayload.method) === 'string' && acceptableMethods.includes(checkUpdatePayload.method) ? checkUpdatePayload.method : false;
                            updatedChecks.successCodes = checkUpdatePayload.successCodes && checkUpdatePayload.successCodes instanceof Array && checkUpdatePayload.successCodes ? checkUpdatePayload.successCodes : false;
                            updatedChecks.timeoutSeconds = checkUpdatePayload.timeoutSeconds && typeof(checkUpdatePayload.timeoutSeconds) === 'number' && checkUpdatePayload.timeoutSeconds > 0 ? checkUpdatePayload.timeoutSeconds : false;
                            for (key in updatedChecks){
                                if(updatedChecks[key]){
                                    check[key] = updatedChecks[key];
                                }
                            }
                            await _data.update("checks", checkId, check);
                            callback(200, {"updatedCheck":check});
                        } else {
                            callback(401, {"error":"Could not authenticate user with provieded token"});         
                        }
                    } catch(err) {
                        callback(500,{"error":"Caught error in checks put promise "+err})
                    }
                } else {
                    callback(401,{"error":"Authentication is required for this request-- missing auth token"});
                }
            } else {
                callback(400, {"error":"missing required input - checks put check id"})
            }
            
        } else {
            callback(400, {"error":"passing invalid properties to check put", "names":invalidUpdates});
        }
    } else {
        callback(400, {"error":"missing required input - checks put checkUpdatePayload"})
    }
};

//required phone
//autenticate user to return only users checks
_checks.delete = async (data, callback) => {
    //check the phone
    const checkId = data.payload && typeof(data.payload.id) === "string" &&  data.payload.id.length > 0 ? data.payload.id : false;
    if(checkId) {
        const userToken = typeof(data.headers.token) === 'string' && data.headers.token.length > 0 ? data.headers.token : false;
        try {
            const tokenData = await _data.read("tokens", userToken);
            if(tokenData) {
                const user = await _data.read("users", tokenData.phone);
                const userValid = await verifyToken(userToken, user.phone);
                if(userValid) {
                    const userChecks = user.checks instanceof Array && user.checks.length > 0 ? user.checks : [];
                    //create an array of pending promises reading data from checks based on users check list
                    if(userChecks.includes(checkId)) {
                        const checkIndex =  user.checks.indexOf(checkId);
                        user.checks.splice(checkIndex, 1);
                        await _data.delete("checks", checkId);
                        await _data.update("users", user.phone, user);
                        callback(200);
                    } else {
                        callback(403,{"error":"Check is not part of current users check list"});
                    }
                
                } else {
                    callback(403,{"error":"could not authenticate users token"});
                }
            } else {
                callback(403,{"error":"could not get tokens with user token provided"});
            }
        } catch(err) {
            callback(500,{"error":"Err caught in promise - checks get - "+err})
        }
    } else {
        callback(403,{"error":"missing required input"});
    }
};

module.exports = _checks;