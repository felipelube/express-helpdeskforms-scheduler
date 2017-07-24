const Boom = require('boom');
const webRequest = require('requestretry');
const template = require('es6-template-strings');
const config = require('config');
const _ = require('lodash');
const { logger } = require('../util/apiUtil');

/**
 * Estratégia usada pelo pacote requestretry que considera erros http do cliente e do servidor
 * (HTTP 4xx e 5xx)
 *
 * @param {any} err não usado
 * @param {any} response objeto response
 */
const clientOrServerError = (err, response) => response && response.statusCode >= 400 &&
  response.statusCode < 600;

const ClientServerOrNetworkError = webRequest.RetryStrategies.HTTPOrNetworkError(
  clientOrServerError, webRequest.RetryStrategies.NetworkError);

/**
 * Retorna um objeto com as propriedades retryDelay e maxAttempts, usadas na criação de uma
 * requisição com o pacote requestretry, levando em consideração o ambiente em que o app está sendo
 * rodado.
 * Função memoizada para melhor desempenho.
 *
 * @returns objeto com as propriedades retryDelay e maxAttempts, usadas na criação de uma
 * requisição com o pacote requestretry
 */
const getTimeoutsForEnv = _.memoize(() => {
  const nodeEnv = process.env.NODE_ENV;
  return {
    retryDelay: nodeEnv === 'test' ? 500 : 5000,
    maxAttempts: nodeEnv === 'test' ? 2 : 5,
  };
});

/**
 * Faz uma requisição à API para pegar informações do Serviço associado a determinada Requisição
 * @todo transformar isso num job separado
 *
 * @param String serviceName o nome de máquina do serviço
 * @returns o objeto do serviço tal como representado pela API
 */
const getServiceInfoForRequest = async (serviceName) => {
  try {
    if (!serviceName) {
      throw new Boom.badRequest('é necessário um nome de Serviço');
    }
    const timeouts = getTimeoutsForEnv();

    const response = await webRequest({
      method: 'GET',
      uri: `${config.HELPDESK_API_SERVICES_URL}/${serviceName}`,
      json: true,
      retryDelay: timeouts.retryDelay,
      maxAttempts: timeouts.maxAttempts,
      retryStrategy: ClientServerOrNetworkError,
    });
    if ((response && response.statusCode >= 400 && response.statusCode < 600) ||
      !response.body.data) {
      throw new Error(`Falha ao obter informações sobre o serviço ${serviceName}. 
      A resposta da API foi: ${JSON.stringify(response.body)}`);
    }
    return response.body.data;
  } catch (e) {
    throw new Error(`falha ao obter informações sobre o serviço ${serviceName} na API: ${e.message}`);
  }
};

/**
 * Dada uma notificação de Serviço, traduz (substitui) os string templates presentes em sua
 * propriedade data_format considerando as informações contextuais passadas
 *
 * @param {any} serviceNotification uma notificação de Serviço
 * @param [Object] contextualData informações contextuais usadas na tradução
 * @returns uma notificação de Serviço com dados traduzidos
 */
const translateNotificationData = (serviceNotification, contextualData) => {
  console.log('iniciando translateNotificationData');
  const notification = {};
  if (!contextualData) {
    throw new Error('são necessários informações contextuais para traduzir os dados de uma notificação');
  }
  try {
    _.forEach(serviceNotification.data_format, (value, key) => {
      if (typeof (value) !== 'string') {
        return; /** @todo lidar com outros tipos, em especial objetos */
      }
      notification[key] = template(value, contextualData);
    });
  } catch (e) {
    logger.debug('falha em translateNotificationData');
    throw e;
  }
  logger.debug('terminado translateNotificationData');
  return notification;
};

/**
 * Dada uma Requisição, traduz o texto das notificações definidas em seu Serviço e salva os dados
 * na propriedade 'data' para serem enviados posteriormente
 *
 * @param {any} job o job para ser processado com a Requisição em 'data'
 * @param {any} queues as filas definidas na aplicação, com as quais é possível fazer operações
 */
const translateNotificationsData = async (job, queues, done) => {
  try {
    logger.debug('iniciado translateNotificationsData');
    const request = job.data;
    // pegue as informações sobre o serviço dessa Requisição
    const service = await getServiceInfoForRequest(request.service_name);
    // processa todas as notificações dessa Requisição com translateNotificationData
    request.notifications = service.notifications.map((serviceNotification, index) => {
      const requestNotification = serviceNotification;
      requestNotification.data = translateNotificationData(serviceNotification, {
        request, /** @todo filtrar campos da Requisição também */
        service: _.pick(service, ['data', 'category', 'ca_info', 'name', 'description']),
      });
      delete requestNotification.data_format;

      const progress = ((index + 1) / service.notifications.length) * 100;
      job.progress(progress); // a cada tradução, informa o progresso desse job

      return requestNotification;
    });

    request.status = 'notificationsTranslated';
    await queues.requestUpdate.add(request); // crie job para atualizar essa Requisição na API

    await queues.sendNotifications.add(request); // crie job p/ enviar as notificações processadas
    logger.debug('terminado translateNotificationsData');
    done(); //passar como resultado?
  } catch (e) {
    logger.debug('falha em translateNotificationsData');
    done(new Error(e.message));
  }
};

/**
 * Envia uma Requisição para ser atualizada na API
 *
 * @todo não usar a biblioteca node-request-retry: deixar a fila cuidar de jobs que falharam
 * @param {any} job o job para ser processado com a Requisição em 'data'
 */
const requestUpdate = async (job, done) => {
  try {
    logger.debug('iniciado requestUpdate');
    const request = job.data;

    if (!request.id) {
      throw new Error('id da requisição ausente, não é possível atualizar');
    }

    /** Reduza o tempo e número de tentativas em ambiente de teste */
    const timeouts = getTimeoutsForEnv();

    const response = await webRequest({
      method: 'PUT',
      uri: `${config.HELPDESK_API_REQUESTS_URL}/${request.id}`,
      json: request,
      retryDelay: timeouts.retryDelay,
      maxAttempts: timeouts.maxAttempts,
      retryStrategy: ClientServerOrNetworkError,
    });
    if (response && response.statusCode >= 400 && response.statusCode < 600) {
      throw new Error(`Falha ao tentar enviar atualizações sobre a Requisição ${request.id} à API.
      Resposta da API: ${JSON.stringify(response.body)}`);
    }
    done();
    logger.debug('terminado requestUpdate');
  } catch (e) {
    logger.debug('falha em requestUpdate');
    done(new Error(e.message));
  }
};

module.exports = {
  translateNotificationsData,
  requestUpdate,
};
