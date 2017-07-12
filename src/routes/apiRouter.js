const express = require('express');

const router = express.Router;
const jobRouter = require('./jobsRouter');


const routes = () => {
  const apiRouter = router();

  apiRouter.use('/jobs', jobRouter);

  return apiRouter;
};

module.exports = routes();
