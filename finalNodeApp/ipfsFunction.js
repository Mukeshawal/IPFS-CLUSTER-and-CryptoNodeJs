const ipfsClient = require('ipfs-http-client');
const ipfsCluster = require('ipfs-cluster-api');

const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

const ipfs = new ipfsClient({ host: 'localhost', port: '5001', protocol: 'http' });
const cluster = ipfsCluster('localhost', '9094', { protocol: 'http' });

const addFile = async (fileName, filePath) => {
    const file = fs.readFileSync(filePath);
    const fileAdded = await ipfs.add({ path: fileName, content: file });
    const fileHash = fileAdded[0].hash;
    return fileHash;
};

const addFileInCLuster = (fileName, filePath) => {
    return new Promise((resolve,reject)=>{
        const file = fs.createReadStream(filePath);

        const data = [{
            path: filePath,
            content: file
        }];
        const options = {
            "wrap-with-directory": false,
        };
        cluster.add(data, options,(err,result)=>{
            if(err){
                reject(err);
            }
            else{
                resolve(result);
            }
        });
    })
};

const removeFileFromCluster = async (CID) => {
    try {
        const fileStatus = await cluster.pin.rm(CID)
    } catch (err) {
        console.log(err);
        return 'unsuccessful'
    }
    return 'successful';
};

const downloadFile = (CID) =>{
    return new Promise((resolve,reject)=>{
        const stream = ipfs.getReadableStream(CID);

        stream.on('data',(file)=>{
            if (JSON.stringify(file.path).includes("/")) {
                const str = JSON.stringify(file.path).split("/")[1];
                const realFileName = str.split(`"`)[0];
                const downloadedFilePath = `downloads/${realFileName}`;
                const writeStream = fs.createWriteStream(downloadedFilePath);
                file.content.on('data', (data) => {
                    writeStream.write(data);
                });
    
                file.content.resume();
    
                file.content.on('end', () => {
                    writeStream.end();
                });
                writeStream.on('finish', () => {
                    resolve([realFileName,downloadedFilePath]);
                });
            }
        });
    
        stream.on('error',(err)=>{
            reject(err);
        });
    })
}
module.exports = {
    addFileToNode : addFile,
    addFileToCluster : addFileInCLuster,
    removeFileFromCluster : removeFileFromCluster,
    downloadFileFromCluster : downloadFile
}
