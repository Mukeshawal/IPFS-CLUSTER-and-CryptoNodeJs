const ipfsFunction = require('./ipfsFunction');
const cryptography = require('./cryptography');

const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(fileUpload());

/****************routes*************** */
app.get('/', (req, res) => {
    res.render('home');
});

app.get('/removeFile', (req, res) => {
    res.render('separateRemove');
});

app.get('/downloadFile', (req, res) => {
    res.render('download');
});

app.post('/downloadFile',async(req, res) => {
    const email = req.body.email;
    const cid = req.body.hash;
    try{
        const downloadedFileInfo = await ipfsFunction.downloadFileFromCluster(cid);
        const encryptedFileName = downloadedFileInfo[0];
        const encryptedFilePath = downloadedFileInfo[1];

        const decryptedFileInfo = await cryptography.decryptFile(encryptedFileName,encryptedFilePath,email);
        const decryptedFileName = decryptedFileInfo[0];
        const decryptedFilePath = decryptedFileInfo[1];

        const absoluteResponsePath = path.join(__dirname,decryptedFilePath);
        
        console.log(`sending ${decryptedFileName} of ${absoluteResponsePath} as response`);
        res.setHeader('Content-Disposition', 'attachment; filename=' + decryptedFileName);
        res.setHeader('Content-Transfer-Encoding', 'binary');
        res.setHeader('Content-Type', 'application/octet-stream');
        res.sendFile(absoluteResponsePath, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log(res.headersSent);
                fs.unlinkSync(encryptedFilePath, err => {
                    if (err) {
                        console.log(err);
                    }
                });
                fs.unlinkSync(decryptedFilePath, err => {
                    if (err) {
                        console.log(err);
                    }
                });
            }
        });
    }catch(err){
        console.log(err);
    }
});

app.post('/removeFile', async (req, res) => {
    const cid = req.body.hash;
    const unpinStatus = await ipfsFunction.removeFileFromCluster(cid);
    console.log(unpinStatus);
    res.render('removeSuccess', { cid, unpinStatus });
    /***************use below code to send json response with removed cid and unpinStatus*****
     * **************************************************************************************
     */
    // res.json({ cid: cid,
    //         unpinstatus : unpinStatus
    // });
});

app.post('/upload', (req, res) => {
    const file = req.files.file;
    const fileName = req.files.file.name;
    const filePath = 'uploads/' + fileName;
    const email = req.body.email;
    file.mv(filePath, async (err) => {
        if (err) {
            console.log('error');
            return res.status(500).send(err);
        }
        const encryptedFileInfo = await cryptography.encryptFile(fileName,filePath,email);
        const encryptedFileName = encryptedFileInfo[0];
        const encryptedFilePath = encryptedFileInfo[1];

        const fileAdded = await ipfsFunction.addFileToCluster(encryptedFileName, encryptedFilePath);
        fs.unlink(filePath, (err) => {
            if (err) console.log(err);
        });
        fs.unlink(encryptedFilePath, (err) => {
            if (err) console.log(err);
        })
        const fileHash = fileAdded[0].hash;
        const pathHash = fileAdded[1].hash;
        res.render('upload', { fileName, fileHash, pathHash});
        /*********use the code below to send json response with file name, file hash and path link ********
         * **********************************************************************************************/
        // res.json({
        //     filename : fileName,
        //     filehash : fileHash,
        //     pathlink : pathHash
        // });
    });
});


/**************express server**************/
app.listen(3000, () => {
    console.log('server listening on 3000');
})
