# PubSub-Arch
PubSub Arch using mongoDb and AWS sqs
ALso we can use trigger based SQS along with AWS lambda so that we don't have to delete the message from the queue as it will be deleted automatically
This is more effective as we don't have to worry about deleting the message from the queue and also it is more Scalable

Payload is attached in recevier-payload json file

All environment variable are in .env file

for running the recevier servicer -> we can use the command docker-compose up --build
