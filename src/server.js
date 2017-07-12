const express = require('express');
const config = require('config');
const Queue = require('bull');
const bodyParser = require('body-parser');
const jsend = require('jsend');
const apiRouter = require('./routes/apiRouter');
const { exceptionToJsendResponse, default404Response } = require('./util/apiResponses');

const { preProcessNotifications } = require('./controllers/process');

const queues = {
  preProcessNotifications: new Queue('processamento de notificações', 'redis://127.0.0.1'),
};

queues.preProcessNotifications.process(job => preProcessNotifications(job, queues));

queues.preProcessNotifications.on('completed', () => {
  console.log('jobs completed');
});

const app = express();

app.locals.queues = queues;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(jsend.middleware);

app.use('/api/v1', apiRouter);

app.use(exceptionToJsendResponse); // nosso tratador de erros
app.use('*', default404Response); // faz-tudo para 404s


app.listen(config.PORT, () => {
  console.log(`Agendador escutando na porta ${config.PORT}`);
});

module.exports = app;
