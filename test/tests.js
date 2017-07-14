const { server, postJob, requestDataTranslationJob, invalidRequestDataTranslationJobWithoutType,
  invalidRequestDataTranslationJobWithoutData } = require('./util/');
const { describe, it } = require('mocha');

global.Promise = require('bluebird');

describe('Criação de trabalhos', () => {
  it('Deve aceitar, criar e colocar um job na fila para processamento', async () => {
    const res = await postJob(requestDataTranslationJob);

    res.should.have.status(201);
    const job = res.body.data;
    job.should.be.an('object');

    const jobInQueue = await server.locals.queues.translateNotificationsData.getJob(job.id);
    jobInQueue.should.have.property('id', job.id);
  });

  it('Não deve aceitar um job inválido (sem tipo)', async () => {
    const res = await postJob(invalidRequestDataTranslationJobWithoutType);

    res.should.have.status(400);
    res.body.should.have.property('status', 'fail');
  });

  it('Não deve aceitar um job inválido (sem dados)', async () => {
    const res = await postJob(invalidRequestDataTranslationJobWithoutData);

    res.should.have.status(400);
    res.body.should.have.property('status', 'fail');
  });
});
