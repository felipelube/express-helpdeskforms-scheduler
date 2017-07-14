const jwt = require('jsonwebtoken');
const winston = require('winston');
const config = require('config');

const apiUtil = () => {
  const jwtCreateToken = account => new Promise((resolve, reject) => {
    jwt.sign({
      sub: account.username,
      id: account._id,
      name: account.realName,
    }, config.secrets.jwt.secret, {
      expiresIn: '1h',
    }, (err, token) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(token);
    });
  });

  const logger = new winston.Logger({
    level: config.log_level,
    transports: [
      /** @todo create a custom formater that play nice with stack traces */
      new (winston.transports.Console)(),
    ],
  });
  logger.cli();

  return {
    logger,
    jwtCreateToken,
  };
};

module.exports = apiUtil();
