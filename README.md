# aws-lambda-convert-wav-to-mp3

{
    "Version": "2012-10-17",
    "Id": "Lambda access bucket policy",
    "Statement": [
        {
            "Sid": "All on objects in bucket lambda",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::AWSACCOUNTID:root"
            },
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::BUCKET-NAME/*"
        },
        {
            "Sid": "All on bucket by lambda",
            "Effect": "Allow",
            "Principal": {
                "AWS": "arn:aws:iam::AWSACCOUNTID:root"
            },
            "Action": "s3:*",
            "Resource": "arn:aws:s3:::BUCKET-NAME"
        }
    ]
}