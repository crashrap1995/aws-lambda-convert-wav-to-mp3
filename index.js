const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const s3Client = new S3Client({ region: 'us-east-1' });

exports.handler = async (event, context) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;
  const tmpFilePath = `/tmp/${path.basename(key)}`;

  try {
    // Download the WAV file from S3
    const getObjectCommand = new GetObjectCommand({ Bucket: bucket, Key: key });
    const { Body } = await s3Client.send(getObjectCommand);
    fs.writeFileSync(tmpFilePath, Body);

    // Convert WAV to MP3 using ffmpeg
    const args = ['-i', tmpFilePath, '-acodec', 'libmp3lame', '-aq', '4', `${tmpFilePath}.mp3`];
    await new Promise((resolve, reject) => {
      const ffmpegProcess = spawn('/opt/bin/ffmpeg', args);
      ffmpegProcess.on('error', reject);
      ffmpegProcess.on('close', resolve);
    });

    // Upload the converted MP3 file back to S3
    const mp3Key = `${path.parse(key).name}.mp3`;
    const putObjectCommand = new PutObjectCommand({ Bucket: bucket, Key: mp3Key, Body: fs.readFileSync(`${tmpFilePath}.mp3`) });
    await s3Client.send(putObjectCommand);

    // Delete temporary files
    fs.unlinkSync(tmpFilePath);
    fs.unlinkSync(`${tmpFilePath}.mp3`);

    return { statusCode: 200, body: 'Conversion successful' };
  } catch (error) {
    console.error(error);
    return { statusCode: 500, body: 'Conversion failed' };
  }
};