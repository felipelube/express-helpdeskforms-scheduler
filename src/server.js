const kue = require('kue');
const express = require('express');

const queue = kue.createQueue();

const { preProcessNotifications } = require('./controllers/notificationProcess');

queue.process('preProcessNotifications', (job, done) => {
  preProcessNotifications(job, queue, done);
});

const app = express();
app.use('/api', kue.app);
app.listen(3005);

/** @todo descobrir uma forma de customzar as rotas do app kue ou simplesmente ignorar o app
 * embutido no kue e fazer o nosso próprio com as nossas rotas (recomendável) */

