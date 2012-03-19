/* 
* Server for Cloud TCC
* Extended with database support (MongoDB & Mongoose)
* @author Masiar Babazadeh 
* babazadm@usi.ch
*/

var express  = require('express'),
	http = require ('http'),
	XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
	

//FOR HTTPS (TODO later)
//var app = require('express').createServer({ key: ... });

var app = express.createServer();
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.session({ 
	secret: 'keyboard cat',
	maxAge : new Date(Date.now() + 3600000), //1 hour
}));

//setup of the timeout & port
var PORT = process.argv[2] ? parseInt(process.argv[2]) : 3000;

//Handles post requests
app.use(require('connect').bodyParser());
//Handles put requests
app.use(express.methodOverride());

app.listen(PORT);

/*
* GET base page, login or register
*/
app.get('/', function(req, res){
	var options = {
		host: 'cloudservertest.nodester.com',
		port: 80,
		path: '/',
		method: 'GET'
	};
	
	var req = http.request(options, function(res){
		console.log('status: ' + res.statusCode);
		console.log('headers: ' + JSON.stringify(res.headers));
		res.setEncoding('utf8');
		res.on('data', function(chunk){
			console.log("body: " + chunk);
		});
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	// write data to request body
	req.write('data\n');
	req.write('data\n');
	req.end();
});

/*
* Function to login on cloudserver
*/
var login = function() {
	var querystring = require('querystring');
	var cookie;

	var data = querystring.stringify({
			username: 'm',
			password: 'm',
		});

	var options = {
	    host: 'grid.inf.unisi.ch',
	    port: 3000,
	    path: '/login',
	    method: 'POST',
	    headers: {
	        'Content-Type': 'application/x-www-form-urlencoded',
	        'Content-Length': data.length
	    }
	};

	var req = http.request(options, function(res) {
		console.log('status: ' + res.statusCode);
		console.log('cookie: ' + JSON.stringify(res.headers["set-cookie"][0]));
		cookie = res.headers["set-cookie"][0];
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			//after login, do some orders
			doOrders();
		});
	});

	req.write(data);
	req.end();
}

/*
* Function to do some order
*/
var doOrders = function() {
	
}

/*
* Test code to run the code as soon as the server is started
*/
login();
