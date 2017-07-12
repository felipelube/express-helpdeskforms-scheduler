const express = require('express');

const router = express.Router;


const routes = () => {
  const jobsController = require('../controllers/jobsController');
  const jobsRouter = router();

  jobsRouter
    .route('/')
    .post(jobsController.validate, jobsController.insert);

  return jobsRouter;
};

module.exports = routes();
