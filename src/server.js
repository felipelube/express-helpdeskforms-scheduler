const kue = require('kue');
const express = require('express');
const config = require('config');

const queue = kue.createQueue();

const { preProcessNotifications } = require('./controllers/process');
const { sendNotifications } = require('./controllers/send');

queue.process('preProcessNotifications', (job, done) => {
  preProcessNotifications(job, queue, done);
});

queue.process('sendNotifications', (job, done) => {
  sendNotifications(job, queue, done);
});

const app = express();
app.use('/api', kue.app);
app.listen(config.PORT);

/** @todo descobrir uma forma de customzar as rotas do app kue ou simplesmente ignorar o app
 * embutido no kue e fazer o nosso próprio com as nossas rotas (recomendável) */

