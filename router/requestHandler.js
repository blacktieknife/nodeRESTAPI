//node requires
const url = require('url');

//custom requires
const {decodePayload} = require('../utils/parsePayload');
const mainRouter = require('../router/');
const JSONtoObject = require("../utils/jsonStrToObj");

//request handler
const handleRequests = async (req, res) => {
    //get url and parse (true gives us back the query params as an object)
    const parsedURL = url.parse(req.url, true);

    //get path of url
    const path = parsedURL.pathname;

    //trim the leading and trailing slashes from url path
    const trimmedPath = path.replace(/^\/|\/$/g, "");

    //get parse query string (if one exists)
    const queryStringObject = parsedURL.query;

    //get request method
    const method = req.method.toLowerCase();

    //get the headers as an object
    const headers = req.headers;

    //get payload (if it exists)
    try {
        const payload = await decodePayload(req);
        console.log("function is instance of ? ",mainRouter[trimmedPath] instanceof Function);
            //select correct handler
            const selectedHandler = mainRouter[trimmedPath] instanceof Function ? mainRouter[trimmedPath] : mainRouter['notfound'];

            //construct data object to send to the handler
            let data = {
                trimmedPath:trimmedPath,
                queryStringObject:queryStringObject,
                method:method,
                headers:headers,
                payload:JSONtoObject(payload)
            }
            //call the handler
            selectedHandler(data, (status, returnPayload)=>{
                //set status code or default to 200
                
                status = typeof(status) === 'number' ? status : 200;
                returnPayload = typeof(returnPayload) === 'object' ? returnPayload : {};
                const payloadString = JSON.stringify(returnPayload);
                res.setHeader("Content-Type", "application/json")
                res.writeHead(status);
                res.end(payloadString);
                console.log("returning this response : ", status, payloadString);
            });
            
       
    
       
        console.log(parsedURL)
        console.log("request on path: "+trimmedPath+" with "+method+" method");
        console.log("query string object: ",queryStringObject);
        console.log("req headers: ",headers);


    } catch(err) {
        console.log(err);
        res.writeHead(500);
        res.end({"error":err});
    }
};

module.exports = {
    handleRequests:handleRequests
}