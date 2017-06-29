const kue = require('kue');
const express = require('express');

const queue = kue.createQueue();

const { preProcessNotification } = require('./controllers/notificationProcess');

queue.process('preProcessNotification', (job, done) => {
  preProcessNotification(job.data, queue, done);
});

const app = express();

app.use('/api', kue.app);