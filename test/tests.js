const { describe, it, beforeEach } = require('mocha');
const chai = require('chai');
const chaiHttp = require('chai-http');

const app = require('../src/server');

global.Promise = require('bluebird');

chai.should();
chai.use(chaiHttp);

const API_JOBS_URL = '/api/v1/jobs';

describe('Criação de trabalhos', () => {
  it('Deve aceitar a criação de um job corretamente', (done) => {
    chai.request(app)
      .post(API_JOBS_URL)
      .send({
        job: {
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
              },
              ] },
          },
          ],
          status: 'new',
        },
      })
      .end((err, res) => {
        res.should.have.status(201);
        const job = res.body.data;
        job.should.be.an('object');
        app.locals.queues.preProcessNotifications.getJob(job.id)
          .then((jobInQueue) => {
            jobInQueue.should.have.property('id', job.id);            
            done();            
          });
      });
  });
});
