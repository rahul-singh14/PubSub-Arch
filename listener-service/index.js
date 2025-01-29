const mongoose = require('mongoose');
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');

mongoose.connect('mongodb://mongo:27017/listenerDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const listenerSchema = new mongoose.Schema({
    id: String,
    user: String,
    class: String,
    age: Number,
    email: String,
    inserted_at: Date,
    modified_at: Date
});
const Listener = mongoose.model('Listener', listenerSchema);

const sqsClient = new SQSClient({ region: 'us-east-1' });
const QUEUE_URL = process.env.SQS_QUEUE_URL;

// ALso we can use trigger based SQS along with AWS lambda so that we don't have to delete the message from the queue as it will be deleted automatically
// This is more effective as we don't have to worry about deleting the message from the queue and also it is more Scalable
const processMessages = async () => {
    const params = {
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20
    };

    try {
        const data = await sqsClient.send(new ReceiveMessageCommand(params));
        if (data.Messages) {
            for (const message of data.Messages) {
                const record = JSON.parse(message.Body);
                const modified_at = new Date();

                const newRecord = new Listener({ ...record, modified_at });
                await newRecord.save();

                const deleteParams = {
                    QueueUrl: QUEUE_URL,
                    ReceiptHandle: message.ReceiptHandle
                };
                await sqsClient.send(new DeleteMessageCommand(deleteParams));
                console.log('Message deleted from SQS');
            }
        }
    } catch (error) {
        console.error('Error processing SQS messages:', error);
    }

    setTimeout(processMessages, 1000);
};

processMessages();