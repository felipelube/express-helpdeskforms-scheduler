const Boom = require('boom');
const webRequest = require('requestretry');
const template = require('es6-template-strings');
const config = require('config');
const _ = require('lodash');

/**
 * Faz uma requisição à API para pegar informações do Serviço associado a determinada Requisição
 * @todo transformar isso num job separado
 */
const getServiceInfoForRequest = async (serviceName) => {
  try {
    if (!serviceName) {
      throw new Boom.badRequest('É necessário um nome de Serviço para requisitar');
    }
    const response = await webRequest({
      method: 'GET',
      uri: `${config.HELPDESK_API_SERVICES_URL}/${serviceName}`,
      json: true,
    });
    if (!response.body.data) {
      throw new Error();
    }
    return response.body.data;
  } catch (e) {
    throw new Error(`falha ao obter informações sobre o serviço ${serviceName} na API: ${e.message}`);
  }
};

const preProcessNotification = (serviceNotification, contextualData) => {
  console.log('iniciando o processamento de uma notificação');
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
const preProcessNotifications = async (job, queues) => {  
  try {
    const request = job.data;
    const service = await getServiceInfoForRequest(request.service_name);
    const notifications = [];

    const notificationsToProcess = service.notifications.map(async (serviceNotification, index) => {
      const processedNotification = preProcessNotification(serviceNotification, {
        request,
        service: _.pick(service, ['data', 'category', 'sa_category', 'name', 'description']),
      });
      notifications.push(processedNotification);

      const progress = ((index + 1) / service.notifications.length) * 100;

      job.progress(progress);
    });

    request.notifications = notifications;
    request.status = 'notificationsProcessed';
    
    // queue.create('requestUpdate', request).priority('low').save();
    // queue.create('sendNotifications', request).priority('high');
    /** @todo atualize o status da requisição na API */    
  } catch (e) {
    throw e;
  }
};

const clientOrServerError = (err, response) => {
  return response && response.statusCode >= 400 && response.statusCode < 600;
};

const ClientServerOrNetworkError = webRequest.RetryStrategies.HTTPOrNetworkError(
  clientOrServerError, webRequest.RetryStrategies.NetworkError);

const requestUpdate = async (job, queue, done) => {    
  try {
    const request = job.data;
    const response = await webRequest({
      method: 'PUT',
      uri: `${config.HELPDESK_API_REQUESTS_URL}/${request.id}`,
      json: request,
      retryDelay: 500, /** @todo alterar*/
      maxAttempts: 2,
      retryStrategy: ClientServerOrNetworkError,      
    });
    if (response && response.statusCode >= 400 && response.statusCode < 600) {
      throw new Error(`Falha ao tentar enviar atualizações sobre a Requisição ${request.id} à API.
      Resposta da API: ${JSON.stringify(response.body)}`);
    }
    done();
  } catch (e) {
    done(e);
  }
};

module.exports = {
  preProcessNotifications,
  requestUpdate,
};
