const { validate } = require('express-jsonschema');
const jobSchemas = require('../models/job');
const boom = require('boom');

const validateJob = (req, res, next) => validate({ body: jobSchemas.basic })(req, res, next);

const insert = async (req, res, next) => {
  try {
    const queues = req.app.locals.queues;
    const jobType = req.body.type;
    let job = req.body.data;
    switch (jobType) {
      case 'requestUpdate':
      case 'sendNotifications':
        throw new boom.notImplemented('tipo de job ainda não disponível pela API');
      case 'translateNotificationsData': {
        /** @todo notificar o recebimento da Requisição, status 'notificationsTranslated' */
        job = await queues.translateNotificationsData.add(job);
        break;
      }
      default:
        throw new boom.badRequest('tipo de job inválido');
    }
    res.status(201).jsend.success(job);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  validate: validateJob,
  insert,
};
