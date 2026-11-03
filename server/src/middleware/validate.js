const { AppError } = require('./error');

function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message
      }));
      return next(new AppError('Please check the submitted information.', 400, details));
    }
    req[source] = result.data;
    next();
  };
}

module.exports = validate;
