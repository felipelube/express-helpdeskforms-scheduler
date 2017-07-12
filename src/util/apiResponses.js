const Boom = require('boom');

const apiResponses = () => {
  const exceptionToJsendResponse = (err, req, res, next) => {
    let error = err;
    /** converta todos os erros para erros Boom */
    if (!error.isBoom) { // se esse é um erro genérico
      error = Boom.wrap(error); // decora o erro com propriedades de erro Boom
    }

    if (error instanceof Boom.notFound) {
      return next(error); // o próximo middleware é especialista em 404s
    }

    res
      .status(error.output.statusCode)
      .set(error.output.headers);

    console.error(error);
    if (error.isServer) { // erros http 5x são 'erros 'jsend
      return res.jsend.error(error.message, {
        code: error.output.statusCode,
        data: error.data,
      });
    }
    return res.jsend.fail(error.data || error.message); // outros erros são 'falhas' jsend
  };

  const default404Response = (req, res, next) => {
    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const err = new Boom.notFound(`${url} not found`);

    res.status(404);

    console.error(err);
    if (req.accepts('json')) {
      return next(res
        .set(err.output.headers)
        .jsend
        .fail(err.message));
    }
    return next(res
      .type('txt')
      .send(err.message));
  };

  return {
    exceptionToJsendResponse,
    default404Response,
  };
};

module.exports = apiResponses();
