const Boom = require('boom');
const webRequest = require('request-promise-native');
const template = require('es6-template-strings');
const config = require('config');
const _ = require('lodash');

/**
 * Faz uma requisição à API para pegar informações do Serviço associado a determinada Requisição
 * @todo transformar isso num job separado
 */
const getServiceInfoForRequest = async (serviceName) => {
  if (!serviceName) {
    throw new Boom.badRequest('É necessário um nome de Serviço para requisitar');
  }
  return webRequest({
    method: 'GET',
    uri: `${config.HELPDESK_API_SERVICES_URL}/${serviceName}`,
    json: true,
  })
  .then(apiRes => apiRes.data)
  .catch((e) => {
    throw new Error(`Falha ao pegar informações sobre o Serviço ${serviceName}: ${e.message}`);
  });
};

const preProcessNotification = (serviceNotification, contextualData) => {
  const notification = {};
  if (!contextualData) {
    throw new Error('Contextual data is needed for processing Request notification');
  }
  try {
    _.forEach(serviceNotification.data_format, (value, key) => {
      if (typeof (value) !== 'string') {
        return; /** @todo lidar com outros tipos, em especial objetos */
      }
      notification[key] = template(value, contextualData);
    });
  } catch (e) {
    throw e;
  }
  return notification;
};

/**
 * @func preProcessNotifications
 * substitui os tokens de cada notificação dessa requisição pelos valores presentes na própria
 * notificação e/ou serviço ao qual ela está associada. Depois, cria um job filho para enviar
 * a notificação desta Requisição para o destinatário.
 */
const preProcessNotifications = async (job, queue, done) => {
  try {
    const request = job.data;
    const service = await getServiceInfoForRequest(request.service_name);
    const notifications = [];

    _.forEach(service.notifications, (serviceNotification, index, servicesNotifications) => {
      const notification = preProcessNotification(serviceNotification, {
        request,
        service: _.pick(service, ['data', 'category', 'sa_category', 'name', 'description']),
      });
      const pending = servicesNotifications.length - (index + 1);
      job.progress(pending, servicesNotifications.length); // informe o progresso desse job
      notifications.push(notification);
    });

    queue.create('sendNotifications', notifications).save((err) => {
      if (err) {
        throw new Error(`Falha na criação do job para envio de e-mails para as notficiações da 
        Requisição ${request._id}: ${err.message}`);
      }
    });

    done(); // termine com esse job
  } catch (e) {
    done(e);
  }
};

module.exports = {
  preProcessNotifications,
};
