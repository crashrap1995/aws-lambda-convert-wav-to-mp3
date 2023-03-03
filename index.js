const AWS = require('aws-sdk');

const s3 = new AWS.S3();
// const ffmpeg = require('fluent-ffmpeg');
// const path = require('path');
const { exec } = require('child_process');

exports.handler = async (event, context) => {
  const bucketName = event.Records[0].s3.bucket.name;
  const objectKey = event.Records[0].s3.object.key;
  const fileExtension = objectKey.split('.').pop();

  if (fileExtension === 'wav') {
    const params = { Bucket: bucketName, Key: objectKey };
    const inputFile = `/tmp/${objectKey}`;
    const outputFile = `/tmp/${objectKey.replace('.wav', '.mp3')}`;

    await s3.getObject(params).promise().then((data) => {
      require('fs').writeFileSync(inputFile, data.Body);
    });

    await new Promise((resolve, reject) => {
      exec(`ffmpeg -i ${inputFile} ${outputFile}`, (error, stdout, stderr) => {
        if (error) {
          console.log(`exec error: ${error}`);
          reject(error);
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
        resolve();
      });
    });

    await s3.putObject({
      Bucket: bucketName,
      Key: objectKey.replace('.wav', '.mp3'),
      Body: require('fs').readFileSync(outputFile),
    }).promise();

    return {
      statusCode: 200,
      body: 'WAV to MP3 conversion successful',
    };
  }
  return {
    statusCode: 400,
    body: 'Unsupported file format',
  };
};
// exports.handler = async (event, context) => {
//   const bucket = event.Records[0].s3.bucket.name;
//   const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
//   const extension = path.extname(key).toLowerCase(); // Only process wav files
//   if (extension !== '.wav') {
//     console.log(`File ${key} is not a wav file. Skipping...`);
//     return;
//   } try {
//     // Download the file from S3
//     const params = {
//       Bucket: bucket,
//       Key: key,
//     };
//     const { Body } = await s3.getObject(params).promise(); // Convert the file to mp3
//     const mp3Key = `${path.basename(key, extension)}.mp3`;
//     const mp3Stream = ffmpeg(Body)
//       .toFormat('mp3')
//       .stream(); // Upload the mp3 file to S3
//     const uploadParams = {
//       Bucket: bucket,
//       Key: mp3Key,
//       Body: mp3Stream,
//     };
//     await s3.upload(uploadParams).promise();
//     console.log(`Successfully converted ${key} to ${mp3Key}`);
//   } catch (error) {
//     console.error(`Error converting ${key}: ${error}`);
//   }
// };
