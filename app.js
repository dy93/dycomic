'use strict';
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');
// const img = require('./routes/img');
const comic = require('./api/v1/comics');
const fs = require('fs');
const crypto = require('crypto')

// try to load stop key
let secret = ''
try {
	secret = fs.readFileSync('secret.txt').toString();
} catch (e) { }

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);
// app.use('/img', img);
app.use('/api/v1/comics', comic);

// the stop api
app.use('/stop', function (req, res, next) {
	if (!('x-hub-signature' in req.headers)) {
		return next();
	}
	let hash = crypto.createHmac('sha1', secret).update(JSON.stringify(req.body)).digest('hex');
	if (hash === req.headers['x-hub-signature'].substr(5)) {
		console.log('stop...');
		return process.exit(0);
	}
	return next();
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function (err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;
