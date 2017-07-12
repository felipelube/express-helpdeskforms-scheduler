const { preProcessNotificationsQueue } = require('../server.js');

const validate = (req, res, next) => next(); /** @todo implementar */

const insert = async (req, res, next) => {
  try {
    const queues = req.app.locals.queues;
    const job = await queues.preProcessNotifications.add(req.body.job);
    res.status(201).jsend.success(job);
  } catch (e) {
    next(e);
  }
};

module.exports = {
  validate,
  insert,
};
