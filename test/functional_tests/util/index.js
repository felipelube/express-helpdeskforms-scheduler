const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../../src/server');

global.Promise = require('bluebird');

chai.should();
chai.use(chaiHttp);

/** Constantes */
const API_JOBS_URL = '/api/v1/jobs';

const postJob = job => chai.request(server).post(API_JOBS_URL).send(job);
const requestDataTranslationJob = {
  type: 'translateNotificationsData',
  data: {
    service_name: 'bd_maintenance',
    data: {
      summary: 'Este script é apenas um teste para o nosso sistema',
      sgdb: 'Oracle',
      db_name: 'BD_TESTE',
      environment: 'Produção',
      scripts_create_objects: false,
      backup_needed: false,
      execution_date_time: '2017-06-30T19:52:34.350Z',
      parent_sa: 288987,
    },
    notifications: [{
      type: 'email',
      data: {},
      priority: 0,
      status: {
        status: 'awaitingSending',
        changed: [{
          status_name: 'awaitingSending',
          timestamp: '2017-06-30T19:52:34.350Z',
        }],
      },
    }],
    status: 'new',
  },
};

const invalidRequestDataTranslationJobWithoutType = {
  data: requestDataTranslationJob.data,
};

const invalidRequestDataTranslationJobWithoutData = {
  type: requestDataTranslationJob.type,
};

module.exports = {
  server,
  postJob,
  requestDataTranslationJob,
  API_JOBS_URL,
  invalidRequestDataTranslationJobWithoutType,
  invalidRequestDataTranslationJobWithoutData,
};
