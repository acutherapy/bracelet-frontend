var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
const materialsRouter = require('./routes/materials');
const colorRouter = require('./routes/color');
const beadPriceRouter = require('./routes/beadPrice');
const ordersRouter = require('./routes/orders');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/api/materials', materialsRouter);
app.use('/api/colors', colorRouter);
app.use('/api/bead-prices', beadPriceRouter);
app.use('/api/orders', ordersRouter);

module.exports = app;
