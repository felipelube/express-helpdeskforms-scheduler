const Boom = require('boom');
const webRequest = require('request-promise-native');
const template = require('es6-template-strings');
const _ = require('lodash');

const HELPDESK_API_SERVICES_URL = 'http://localhost:8000/api/v1/services';
/**
 * Faz uma requisição à API para pegar informações do Serviço associado a determinada Requisição
 * @todo transformar isso num job separado
 */
const getServiceInfoForRequest = (request) => {
  if (!request) {
    throw new Boom.badImplementation();
  }
  return webRequest({    
    method: 'GET',
    uri: `${HELPDESK_API_SERVICES_URL}/${request.service_name}`,
    json: true,
  })
  .then(apiRes => apiRes.data);
};

const preProcessNotification = (serviceNotification, contextualData) => {
  let notification = {};
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
 * @desc preenche os dados das notificações de uma Requisição de acordo com o template do Serviço
 * de uma Requisição
 */
const preProcessNotifications = (job, queue, done) => {
  const request = job.data;
  getServiceInfoForRequest(request)
    .then((service) => {
      const notifications = [];
      try {
        _.forEach(service.notifications, (serviceNotification, index, servicesNotifications) => {
          const notification = preProcessNotification(serviceNotification, {
            request,
            service: _.pick(service, ['data', 'category', 'sa_category', 'name', 'description']),
          });
          const pending = servicesNotifications.length - (index + 1);
          job.progress(pending, servicesNotifications.length); // informe o progresso desse job
          notifications.push(notification);
        });
      } catch (e) {
        throw e;
      }
      /**
       * crie novos jobs para cada uma das notificações processadas
       */
      job.data.notifications = notifications;
      done();
    })
    .catch((err) => {
      /** @todo trate melhor os possíveis erros aqui, crie erros da classe Error com mensagens
       * amigáveis
       */
      return done(err);
    });
};

module.exports = {
  preProcessNotifications,
};
