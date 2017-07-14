const express = require('express');
const config = require('config');
const Queue = require('bull');
const bodyParser = require('body-parser');
const jsend = require('jsend');
const apiRouter = require('./routes/apiRouter');

const { exceptionToJsendResponse, default404Response } = require('./util/apiResponses');
const { logger } = require('./util/apiUtil');
const { translateNotificationsData, requestUpdate } = require('./controllers/process');
const { sendNotifications } = require('./controllers/send');

const app = express();

/** Definição das filas */
const queues = { /** @todo Object.freeze() em queues? */
  translateNotificationsData: new Queue('tradução de notificações'),
  requestUpdate: new Queue('atualização de requisições'),
  sendNotifications: new Queue('envio de e-mails com notificações'),
};

/** Associação das filas com os workers */
queues.translateNotificationsData.process(job => translateNotificationsData(job, queues));
queues.sendNotifications.process(job => sendNotifications(job, queues));
queues.requestUpdate.process(job => requestUpdate(job));

/** DEBUG */
queues.translateNotificationsData.on('completed', () => {
  console.log('jobs completed');
});

app.locals.queues = queues; // filas disponíveis para acesso durante o lifecycle da aplicação

/** Middlewares */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(jsend.middleware);

app.use('/api/v1', apiRouter); // Roteador principal

app.use(exceptionToJsendResponse); // nosso tratador de erros
app.use('*', default404Response); // faz-tudo para 404s*/

app.listen(config.PORT, () => {
  logger.info(`Agendador escutando na porta ${config.PORT}`);
});

module.exports = app; // exporte a aplicação para uso em testes
