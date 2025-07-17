const AppError = require('./../utils/appError');

const handleJWTError = () =>
  new AppError('You are not logged in, Please log in again', 401);

const handleJWTExpiredError = () =>
  new AppError('Token Expired, please log in again', 401);

const handleCastErrorDB = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  return new AppError(`Invalid Data Entered: ${errors.join('. ')}`, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
  return new AppError(`Duplicate field value: ${value} use another value`, 400);
};
//=>
// Development Errors
const showErrDev = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

//=>
// Production Errors
const showErrProd = (err, req, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    showErrDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    let error = {
      ...err,
      name: err.name,
      errmsg: err.errmsg,
      message: err.message,
    };
    //handling "invalid ID accessed" error (while getting single tour) [used the 'CastError' *name* by mongoose when generated]
    if (error.name === 'CastError') error = handleCastErrorDB(error);
    //handling the "duplicate value entered" error (while duplicate data is given to DB) [used the 11000 *code* by mongoose when generated]
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    //all other validation errors together (like duration, image, summary, etc.). all of that are handled together
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    //JWT error if there is mismatched token
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    showErrProd(error, req, res);
  }

  next();
};
