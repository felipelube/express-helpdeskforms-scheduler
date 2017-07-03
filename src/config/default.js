const secrets = require('./secrets');

module.exports = {
  PORT: 8001,
  HELPDESK_API_SERVICES_URL: 'http://localhost:8000/api/v1/services',
  secrets,
};
