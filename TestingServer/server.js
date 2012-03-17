/* 
* Server for Cloud TCC
* Extended with database support (MongoDB & Mongoose)
* @author Masiar Babazadeh 
* babazadm@usi.ch
*/

var express  = require('express'),
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
	res.send("hello world");
});
