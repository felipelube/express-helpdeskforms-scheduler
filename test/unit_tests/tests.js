const { describe, it, before, beforeEach } = require('mocha');
const nock = require('nock');
const config = require('config');
const redis = require('ioredis');
const template = require('es6-template-strings');

const { translateNotificationsData, requestUpdate } = require('../../src/controllers/process');
const { sendNotifications } = require('../../src/controllers/send');

const { dbMaintentanceService, requestDataTranslationJob } = require('../util');

const Queue = require('bull');

global.Promise = require('bluebird');


describe('Testes unitários', () => {
  /** crie um mini web server para imitar respostas da API */
  before(() => nock(config.HELPDESK_API_URL)
      .get(`/api/v1/services/${dbMaintentanceService.machine_name}`)
      .reply(200, {
        status: 'success',
        data: dbMaintentanceService },
      ));
      /** @todo imitar respostas de atualização também, necessárias para testar 
       * process.requestUpdate()
       *
       * .put(`/api/v1/requests/${requestDataTranslationJob.data.id}`, { ... } )
       *
       **/


  describe('Teste com funções dos workers', () => {
    const queues = {
      translateNotificationsData: new Queue('teste de tradução de notificações'),
      requestUpdate: new Queue('teste de atualização de requisições'),
      sendNotifications: new Queue('teste de envio de e-mails com notificações'),
    };

    queues.translateNotificationsData.process((job, done) => translateNotificationsData(job, queues, done));
    queues.sendNotifications.process((job, done) => sendNotifications(job, queues, done));
    queues.requestUpdate.process((job, done) => requestUpdate(job, done));

    beforeEach(() => {
      const client = new redis();
      return client.flushdb();
    });

    it('teste de translateNotificationsData', (done) => {
      queues.translateNotificationsData.on('active', (job) => {        
        job.data.should.eql(requestDataTranslationJob.data);
      });

      queues.translateNotificationsData.on('completed', (job, result) => {
        /** verifique se os dados foram traduzidos de acordo com o esperado */
        job.data.notifications.should.be.an('array');
        job.data.notifications.length.should.eql(dbMaintentanceService.notifications.length);
        /** verifique se as substituições foram realmente realizadas */
        dbMaintentanceService.notifications.forEach((notification, index) => {
          const requestNotificationData = job.data.notifications[index].data;
          for (const prop in requestNotificationData) {
            requestNotificationData[prop].should.be.an('string');
            requestNotificationData[prop].should.eql(template(dbMaintentanceService
              .notifications[index].data_format[prop],
              {
                service: dbMaintentanceService,
                request: requestDataTranslationJob.data,
              }));
          }
        }, this);
        done();
      });

      queues.translateNotificationsData.on('failed', (job, err) => { 
        done(new Error(err.message));
      });
      /** adicione um job nessa fila para tradução e inicie, propriamente, o teste */
      queues.translateNotificationsData.add(requestDataTranslationJob.data);
    });
  });
});
