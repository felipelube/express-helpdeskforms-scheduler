const secrets = require('./secrets/');

module.exports = {
  PORT: 3001,
  HELPDESK_API_SERVICES_URL: 'http://localhost:3000/api/v1/services',
  secrets,
};
