const { describe, it, beforeEach } = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const server = require('../src/server');

global.Promise = require('bluebird');

chai.should();
chai.use(chaiHttp);

const API_SERVICES_BASE_URL = '/api/v1/services';
const API_REQUESTS_BASE_URL = '/api/v1/requests';