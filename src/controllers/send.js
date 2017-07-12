const config = require('config');
const _ = require('lodash');
const template = require('es6-template-strings');

const mailgun = require('mailgun-js')({
  apiKey: config.secrets.mailgun.apiKey,
  domain: config.secrets.mailgun.domain,
});

/**
 * @desc envia e-mails usando os dados da notificação através da API do Mailgun
 * @todo lidar com anexos: se um link para eles veio no e-mail, abra-os e depois serialize para
 * serem enviados corretamente (talvez um job filho para processar anexos)
 */
const sendNotifications = async (job, queue, done) => {
  try {
    const request = job.data;
    const notifications = request.notifications;

    const notificationsToSent = notifications.map(async (notification, index) => {
      const email = {
        to: notification.to,
        from: notification.from,
        subject: notification.subject,
        text: template(notification.body, { notification }),
      };
      /** @todo atualize o status da notificação */
      await mailgun.messages().send(email);
      const pending = notifications.length - (index + 1);
      job.progress(pending, notifications.length); // informe o progresso desse job
    });

    await Promise.all(notificationsToSent);
    request.status = 'notificationsSent';
    queue.create('requestUpdate', request).priority('low').save();
    done();
  } catch (e) {
    done(e);
  }
};

module.exports = {
  sendNotifications,
};
