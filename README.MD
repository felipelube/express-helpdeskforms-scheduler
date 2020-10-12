# Helpdesk Forms Server - Scheduler

Recebe as Requisições criadas pelo Helpdesk Forms Server - Creator, processa elas numa fila interna, notifica o 
Creator a cada alteração de status e envia as notificações das Requisições tal como essas foram configuradas.

## Conceitos
- Serviço: é toda atividade específica ofertada em um catálogo e que possui determinados requisitos, informações a serem
preenchidas pelo usuário final em um formulário específico, bem como informações sobre ações de notificação.
- Formulário: coleção de campos usados para a instrução de uma Requisição. Esses campos são customizáveis através de 
tipo, quantidade e validações adicionais. A especificação desse formulário e seus campos está dentro de um Serviço e 
adere ao JSON Schema draft 4.
- Requisição: é o conjunto de informações referentes a determinado Serviço, uma Requisição de Serviço.
- Notificação: dados da Requisição e informações para onde esses dados deverão ser enviados - geralmente para o CA 
Service Desk Manager
