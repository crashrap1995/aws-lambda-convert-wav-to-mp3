/* eslint-disable no-undef */
const AWSMock = require('aws-sdk-mock');
const AWS = require('aws-sdk');
const lambda = require('./index');

describe('Lambda function', () => {
  let s3Client;
  let s3Bucket;

  beforeAll(async () => {
    AWSMock.setSDKInstance(AWS);
    s3Client = new AWS.S3({ region: 'us-east-1' });
    s3Bucket = 'test-bucket';
    await s3Client.createBucket({ Bucket: s3Bucket }).promise();
  });

  afterAll(async () => {
    await s3Client.deleteBucket({ Bucket: s3Bucket }).promise();
    AWSMock.restore('S3');
  });

  test('should convert WAV file to MP3', async () => {
    const objectKey = 'test.wav';
    await s3Client.upload({ Bucket: s3Bucket, Key: objectKey, Body: 'test' }).promise();
    const event = {
      Records: [
        { s3: { bucket: { name: s3Bucket }, object: { key: objectKey } } },
      ],
    };

    const result = await lambda.handler(event);

    expect(result.statusCode).toBe(200);
    expect(result.body).toBe('WAV to MP3 conversion successful');

    const outputObject = await s3Client.getObject({ Bucket: s3Bucket, Key: 'test.mp3' }).promise();
    expect(outputObject.Body.toString()).toBe('test');
  });

  test('should return error for unsupported file format', async () => {
    const objectKey = 'test.txt';
    await s3Client.upload({ Bucket: s3Bucket, Key: objectKey, Body: 'test' }).promise();
    const event = {
      Records: [
        { s3: { bucket: { name: s3Bucket }, object: { key: objectKey } } },
      ],
    };

    const result = await lambda.handler(event);

    expect(result.statusCode).toBe(400);
    expect(result.body).toBe('Unsupported file format');
  });
});
