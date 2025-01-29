const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const mongoose = require('mongoose');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const app = express();
app.use(bodyParser.json());

mongoose.connect('mongodb://mongo:27017/receiverDB', { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const sqsClient = new SQSClient({ region: 'us-east-1' });
const QUEUE_URL = process.env.SQS_QUEUE_URL;

const receiverSchema = new mongoose.Schema({
    id: String,
    user: String,
    class: String,
    age: Number,
    email: String,
    inserted_at: Date
});
const Receiver = mongoose.model('Receiver', receiverSchema);

app.post('/receiver', async (req, res) => {
    const { user, class: cls, age, email } = req.body;

    if (!user || !cls || !age || !email) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = uuidv4();
    const inserted_at = new Date();

    const newRecord = new Receiver({ id, user, class: cls, age, email, inserted_at });
    await newRecord.save();

    const params = {
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify({ id, user, class: cls, age, email, inserted_at })
    };

    try {
        await sqsClient.send(new SendMessageCommand(params));
        console.log('Message sent to SQS');
    } catch (error) {
        console.error('Error sending message to SQS:', error);
        return res.status(500).json({ error: 'Failed to publish event' });
    }

    res.status(201).json({ message: 'Record saved and event published' });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Receiver service running on port ${PORT}`);
});