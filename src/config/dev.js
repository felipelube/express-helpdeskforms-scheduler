const secrets = require('./secrets/');

module.exports = {
  PORT: 5001,
  HELPDESK_API_URL: 'http://localhost:5000/',
  HELPDESK_API_SERVICES_URL: 'http://localhost:5000/api/v1/services',
  HELPDESK_API_REQUESTS_URL: 'http://localhost:5000/api/v1/requests',
  secrets,
};
