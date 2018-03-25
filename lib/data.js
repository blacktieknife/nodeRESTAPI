//librar used for storing or eidting data
const fs = require('fs');
const path = require('path');
const {promisify} = require('util');

const JSONtoObject = require("../utils/jsonStrToObj");
//setting up promisify on functions that are async or used to require callback
const fsOpen = promisify(fs.open);
const fsWriteFile = promisify(fs.writeFile);
const fsClose = promisify(fs.close);
const fsReadFile = promisify(fs.readFile);
const fsTruncate = promisify(fs.ftruncate);
const fsUnlink = promisify(fs.unlink);
const fsReadDir = promisify(fs.readdir);

let _data = {}

//Base Directory
_data.dataDir = path.join(__dirname, '/../.data/');

//trying same as below with promisify

_data.create = async (dir, file, data) => {
    try {
        const fileDescriptor = await fsOpen(`${_data.dataDir}${dir}/${file}.json`,'wx');
        if(fileDescriptor && data){
            const stringData = JSON.stringify(data);
            await fsWriteFile(fileDescriptor, stringData);
            await fsClose(fileDescriptor);    
        } else {
            throw new Error("missing data or error on opening file");
        }
    } catch(err) {
        console.log(err)
    }
}

_data.read = async (dir, file) => {
    try {
        const res = await fsReadFile(`${_data.dataDir}${dir}/${file}.json`, 'utf8');
        if(res){
            return JSONtoObject(res);
        } else {
            throw new Error("error reading file "+file);
        }
    } catch(err) {
        console.log(err);
    }
    

}

_data.list = async (dir) => {
    try {
        const dirresp = await fsReadDir(`${_data.dataDir}${dir}/`);
        if(dirresp.length > 0) {
            const trimmedFileNames = dirresp.map((file)=>{
                return file.replace('.json','');
            });
            return trimmedFileNames;
        } else {
            throw new Error("The is no length to dir "+dir+" array");
        }
    } catch(err) {
        console.log(err);
    }
};

_data.update = async (dir, file, data) => {
    try {
        const fileDescriptor = await fsOpen(`${_data.dataDir}${dir}/${file}.json`,'r+');
        if(fileDescriptor && data){
            const stringData = JSON.stringify(data);
            await fsTruncate(fileDescriptor);
            await fsWriteFile(fileDescriptor,stringData);
            await fsClose(fileDescriptor);
        } else {
            throw new Error("missing data to update or error on fsopen update function")
        }
    } catch(err){
        console.log(err);
    }
}

_data.delete = async (dir,file) => {
    try {
       await fsUnlink(`${_data.dataDir}${dir}/${file}.json`);
    } catch(err) {
        console.log(err)
    }
    
}

//data to file & example of a nice callback depth chart
// _data.create = (dir, file, data) => {
//     return new Promise((resolve, reject) => {
//        fs.open(`${_data.dataDir}${dir}/${file}.json`,'wx', (err,fd)=>{
//             if(!err && fd){
//                 //convert data to string
//                 const stringData = JSON.stringify(data);

//                 fs.writeFile(fd, stringData, (err) => {
//                     if(!err){
//                         fs.close(fd, (err)=>{
//                             if(!err){
//                                 resolve("ok");
//                             } else {
//                                 reject("Error closing new file");
//                             }
//                         })
//                     } else {
//                         reject("Error writing to new file");
//                     }
//                 })
//             } else {
//                 reject("cound not create new file, it may already exist");  
//             }
//        }) 
//     })
// }


module.exports = _data;