const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../../src/server');

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

const dbMaintentanceService = {
  machine_name: 'bd_maintenance',
  name: 'Manutenção em Banco de Dados',
  description: 'Trata-se da execução de scripts paara a criação e objetos \\n      (tabelas, índices, funções), execução de procedures para manipulação de dados \\n      (carga, atualização ou deleção) e também de solicitações como criação de sinônimos, \\n      concessão de privilégios para usuários da aplicação e criação/agendamento de Jobs. \\n      Geralmente solicitado pela GESIN ou GEINF e usuários externos. <b>Os scripts deverão \\n      ser anexados à SA.</b>',
  form: {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        id: '/properties/summary',
        pattern: {},
        description: 'Breve descrição do que o script vai fazer'
      },
      sgdb: {
        type: 'string',
        id: '/properties/sgdb',
        enum: ['Oracle', 'SQL Server'],
        description: 'SGDB'
      },
      db_name: {
        type: 'string',
        id: '/properties/db_name',
        pattern: {},
        description: 'Nome do banco',
      },
      environment: {
        type: 'string',
        id: '/properties/environment',
        enum: ['Produção', 'Homologação', 'Desenvolvimento'],
        description: 'Ambiente'
      },
      scripts_create_objects: {
        type: 'boolean',
        id: '/properties/scripts_create_objects',
        description: 'Os scripts criam novos objetos no banco (tabelas, views, packages ou outros)'
      },
      backup_needed: {
        type: 'boolean',
        id: '/properties/backup_needed',
        description: 'É necesário fazer backup do banco de dados antes da execução do script'
      },
      backup_retention_period: {
        type: 'number',
        id: '/properties/backup_retention_period',
        description: 'Prazo de retenção do backup'
      },
      execution_date_time: {
        type: 'string',
        id: '/properties/execution_date_time',
        format: 'date-time',
        description: 'Data e hora para execução dos scripts'
      },
      dependent_sa: {
        type: 'number',
        id: '/properties/dependent_sa',
        description: 'Depende de outra SA ou procedimento para ser executado'
      },
      additional_info: {
        type: 'string',
        id: '/properties/additional_info',
        pattern: {},
        description: 'Instruções adicionais para execução ou outras informações'
      },
    },
    required: ['summary', 'sgdb', 'db_name', 'environment', 'scripts_create_objects', 'backup_needed']
  },
  category: 'Banco de dados',
  notifications: [{
    type: 'email',
    data_format: {
      to: 'atendimento@prodest.es.gov.br',
      from: 'teste@example.com',
      body: '%CATEGORY=${service.ca_info.sa_category}\n%FROM_EMAIL_OVERRIDE=${request.ca_info.requestor}\n%PARENT=${request.data.parent_sa}\n%SUMMARY=${request.data.summary} - ${request.data.db_name},%DESCRIPTION=Breve descrição do que o script vai fazer: ${request.data.summary},SGDB (Oracle/SQL Server): ${request.data.sgdb},Nome do banco: ${request.data.db_name},Ambiente (Desenvolvimento, Teste, Treinamento, Homologação ou Produção): ${request.data.environment},Os scripts criam novos objetos no banco (tabelas, views, packages ou outros)? ${request.data.scripts_create_objects? \'Sim\': \'Não\'},É necessário fazer backup do banco de dados antes da execução do script (Sim - Prazo de retenção/Não)? ${request.data.backup_needed ? \'Sim, \'+ request.data.backup_retention_period :\'Não\'},Data e hora para execução dos scripts: ${request.data.backup_retention_period},Depende de outra SA ou procedimento para ser executado: (Sim - Qual/Não)? ${request.data.dependent_sa ? \'Sim, \'+ request.data.dependent_sa :\'Não\'},Instruções adicionais para execução ou outras informações: ${request.data.additional_info}',
      subject: '${service.ca_info.sa_category} - ${request.data.summary} - ${request.data.db_name}',
      attachments: [],
    }
  }],
  ca_info: {
    sa_category: 'Banco de dados.manutenção',
    sa_type: 'CR'
  },
  published: true,
}

const requestTranslationJob = {
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
    ca_info: {
      requestor: 'felipe.braganca',
    }
  } 
}

module.exports = {
  server,
  postJob,
  requestDataTranslationJob,
  API_JOBS_URL,
  invalidRequestDataTranslationJobWithoutType,
  invalidRequestDataTranslationJobWithoutData,
  dbMaintentanceService,
  requestTranslationJob,
};