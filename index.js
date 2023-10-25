const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const app = express();
const morgan = require('morgan');
// const { mongo } = require('mongoose');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');

//  1) MIDDLEWARES
// Set security http headers
app.use(helmet());

// development logging
console.log(process.env.NODE_ENV);
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
//Limit request from same IP
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour!',
});
app.use('/api', limiter);
//Body parser, reading data from the body into req.body
app.use(express.json());

// data sanitization against NoSQL query injection
app.use(mongoSanitize());
//data sanitization against XSS
app.use(xss());

//implemneting cors
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Origin, X-Requested-With'
  );
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

//prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsAverage',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);
//Serving static files
app.use(express.static(`${__dirname}/public`));
// Test middleware
// app.use((req, res, next) => {
//   console.log('Hello from the middleware😀');
//   next();
// });
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  // console.log(req.headers);
  next();
});

// app.get('/api/v1/tours', getAllTours); //get all tours
// app.get('/api/v1/tours/:id', tour); //get single tour
// app.patch('/api/v1/tours/:id', updateTour); //create patch req
// app.delete('/api/v1/tours/:id', deleteTour); //delete tour
// app.post('/api/v1/tours', createTour); // post request

//  3) ROUTES

// ** A Better Method for routing **

// app.get('/', (req, res) => {
//   res
//     .status(200)
//     .json({ message: 'Hellooo from the server side', serverStatus: 200 });
// });

// app.post('/', (req, res) => {
//   res.status(200).send('you can post to this endpoint');
// });
app.use('/api/v1/users', userRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server !`, 404));
});
app.use(globalErrorHandler);

// 4) START SERVER
module.exports = app;
