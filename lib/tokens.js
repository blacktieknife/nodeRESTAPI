const _data = require("./data");
const hashPassword = require("../utils/hashPassword");
const createRandomString = require("../utils/createRandomString");
const verifyToken = require("../utils/verifyToken");
const _tokens = {};

_tokens.post = async (data, callback) => {
    const phone = data.payload && typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
    const password = data.payload && typeof(data.payload.password) === 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
    if(phone && password){
        try{
           const user = await _data.read('users', phone);
           if(user){
                const hashedPassword = hashPassword(password);
                console.log(hashedPassword+"!!! Vs. !!!"+user.password)
                if(hashedPassword === user.password){
                    const tokenId = createRandomString(20);
                    const expires = Date.now() + 1000 * 60 * 60;
                    console.log("TOKEN ID = ",tokenId)
                    console.log("Expires = ",expires)
                    const tokenObj = {
                        "phone":phone,
                        "id":tokenId,
                        "expires":expires
                    }
                    await _data.create('tokens', tokenId, tokenObj);
                    callback(200, tokenObj);
                } else {
                    callback(400, {"error":"password did not match"});
                }
           } else {
               callback(400,{"error":"Could not find user"});
           }
        } catch(err){
            console.log("ERR with PROMISE = ", err)
            callback(500,{"error":"Caught error with promise in token ppost function"})
        }
    } else {
        callback(400,{"error":"Missing required information"})
    }
}

_tokens.get = async (data, callback) => {
    const id = typeof(data.queryStringObject.id) === 'string' && data.queryStringObject.id.length > 0 ? data.queryStringObject.id : false;
    if(id){
        try {
           const tokenData = await _data.read('tokens', id);
           if(tokenData){
                callback(200, tokenData);
           } else {
               callback(404)
           }
        } catch(err){

        }
    } else {
        callback(400,{"error":"missing required fields"});
    }
}

_tokens.put = async (data, callback) => {
    const id = typeof(data.payload.id) === 'string' && data.payload.id.length > 0 ? data.payload.id : false;
    const extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend === true ? data.payload.extend : false;
    if(id && extend){
        try {
           const tokenData = await _data.read('tokens', id);
           if(tokenData){
                 if(tokenData.expires > Date.now()){
                    tokenData.expires = Date.now() + 1000 * 60 * 60;
                    await _data.update('tokens', id, tokenData);
                    callback(200)
                 } else {
                     callback(400, {"error":"the token is already expired"});
                 }
           } else {
               callback(400, {"error":"token doesn't exist"});
           }
        } catch(err){
            console.log("ERROR IN PROMISE RETURN TOKENS PUT", err);
            callback(500, {"error":"error in promise for tokens put function"})
        }
    } else {
        callback(400,{"error":"missing required fields"});
    }
}

_tokens.delete = async (data, callback) => {
    const id = typeof(data.payload.id) === 'string' && data.payload.id.length > 0 ? data.payload.id : false;
    if(id){
        try{
            const token = await _data.read('tokens', id);
            if(token){
                await _data.delete('tokens', id);
                callback(200);
            } else {
                callback(400,{"error":"The Token is not found to delete"});
            }
        } catch(err){
            console.log("ERROR IN PROMISE RETURN TOKENS DELETE", err);
            callback(500, {"error":"error in promise for tokens delete function"})
        }
    } else {
        callback(400,{"error":"missing required fields"});
    }
}

module.exports = _tokens;