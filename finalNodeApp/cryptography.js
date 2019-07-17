const crypto = require('crypto');
const algorithm = 'aes-256-cbc';
const iv = Buffer.alloc(16,'fsdfaldkfh');
const salt = Buffer.alloc(16,'saltysalt');
console.log(iv,salt);

const fs = require('fs');

const encryptfile = (fileName,filePath,email)=>{
    return new Promise((resolve,reject)=>{
        const key = crypto.scryptSync(email, salt, 32);
        const cipher = crypto.createCipheriv(algorithm, key, iv);

        const myReadStream = fs.createReadStream(filePath);

        const encryptedFilePath = `encrypted/${fileName}`;
        const myWriteStream = fs.createWriteStream(encryptedFilePath);

        myReadStream.pipe(cipher).pipe(myWriteStream);
        myWriteStream.on('finish',()=>{
            resolve([fileName,encryptedFilePath]);
        });
        myWriteStream.on('error',()=>{
            reject('error encrypting file');
        });
    });
};

const decryptfile = (fileName,filePath,email)=>{
    return new Promise((resolve,reject)=>{
        const key = crypto.scryptSync(email, salt, 32);
        const decipher = crypto.createDecipheriv(algorithm, key, iv);

        const myReadStream = fs.createReadStream(filePath);

        const decryptedFilePath = `decrypted/${fileName}`;
        const myWriteStream = fs.createWriteStream(decryptedFilePath);

        myReadStream.pipe(decipher).pipe(myWriteStream);
        myWriteStream.on('finish',()=>{
            resolve([fileName,decryptedFilePath]);
        });
        myWriteStream.on('error',()=>{
            reject('error decrypting file');
        });
    });
};

module.exports={
    encryptFile : encryptfile,
    decryptFile : decryptfile
}