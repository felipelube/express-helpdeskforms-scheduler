const config = require('config');
/**
 * Instância do mailgun usando as configurações sensíveis ao ambiente
 */
const mailgun = require('mailgun-js')({
  apiKey: config.secrets.mailgun.apiKey,
  domain: config.secrets.mailgun.domain,
});

/**
 * Envia as notificações de uma Requisição usando a API do Mailgun
 * Em ambientes de testes e desenvolvimento, simplesmente envia o e-mail para o console
 *
 * @todo lidar com anexos, em especial se os arquivos não estão serializados na Requisição ou se
 * são links (talvez um job filho para processar anexos)
 * @param {any} job o job para ser processado com a Requisição em 'data'
 * @param {any} queues as filas definidas na aplicação, com as quais é possível fazer operações
 */
const sendNotifications = async (job, queues) => {
  try {
    const request = job.data;
    const notifications = request.notifications;

    const notificationsToSent = notifications.map(async (notification, index) => {
      const email = {
        to: notification.data.to,
        from: notification.data.from,
        subject: notification.data.subject,
        text: notification.data.body,
      };
      // simplesmente logue os e-mails no ambiente de teste para não sobrecarregar a cota do Mailgun
      if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'dev') {
        console.log(email);
      } else {
        await mailgun.messages().send(email);
      }
      const progress = ((index + 1) / request.notifications.length) * 100;
      job.progress(progress);
    });
    await Promise.all(notificationsToSent);

    request.status = 'notificationsSent';
    await queues.updateRequest.add(request);
  } catch (e) {
    throw e;
  }
};

module.exports = {
  sendNotifications,
};
