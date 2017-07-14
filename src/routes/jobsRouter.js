const express = require('express');
const jobsController = require('../controllers/jobsController');

const routes = () => {
  const jobsRouter = express.Router();

  jobsRouter
    .route('/')
    .post(jobsController.validate, jobsController.insert);

  return jobsRouter;
};

module.exports = routes();
