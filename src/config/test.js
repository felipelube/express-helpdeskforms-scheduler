const secrets = require('./secrets/');

module.exports = {
  PORT: 3001,
  HELPDESK_API_SERVICES_URL: 'http://localhost:3000/api/v1/services',
  HELPDESK_API_REQUESTS_URL: 'http://localhost:3000/api/v1/requests',
  REDIS_URL: 'redis://localhost',
  secrets,
};
