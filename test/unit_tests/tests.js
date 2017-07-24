const { describe, it } = require('mocha');
const nock = require('nock');
const config = require('config');
const redis = require('ioredis');
const template = require('es6-template-strings');

const { translateNotificationsData, requestUpdate } = require('../../src/controllers/process');
const { sendNotifications } = require('../../src/controllers/send');

const { dbMaintentanceService, requestTranslationJob } = require('../util');

const Queue = require('bull');

const helpdeskFormsAPI = nock(config.HELPDESK_API_URL)
  .get('/api/v1/services/bd_maintenance')
  .reply(200, {
    status: 'success',
    data: dbMaintentanceService,
  });

global.Promise = require('bluebird');

describe.only('Testes unitários', () => {
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
        console.log('início do teste com translateNotificationsData');
        job.data.should.eql(requestTranslationJob.data);
      });

      queues.translateNotificationsData.on('progress', (job, progress) => {
        console.log(progress);
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
                request: requestTranslationJob.data,
              }));
          }
        }, this);
        console.log('fim do teste com translateNotificationsData');
        done();
      });
      /** adicione manualmente um job nessa fila para tradução e inicie, propriamente, o teste */
      queues.translateNotificationsData.add(requestTranslationJob.data);
    });
  });
});
