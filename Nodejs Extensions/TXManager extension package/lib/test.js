/*
* Testing server that make use of the txmanager extension.
* This simple test server imports the txmanager extension
* and creates a basic TXManager server. Doesn't have a GUI
* either, just read responses to check if the server is
* behaving correctly.
*
* @author: masiar.babazadeh@usi.ch
*/

var express  = require('express'),
	jade	 = require('jade');
	
var txmanager = require('./txmanager');

//FOR HTTPS (TODO later)
//var app = require('express').createServer({ key: ... });

var app = express.createServer(
	express.logger()
);
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.session({ 
	secret: 'keyboard cat',
	maxAge : new Date(Date.now() + 3600000), //1 hour
}));
app.set('view engine', 'ejs');
app.set("view options", { layout: true });

//Handles post requests
app.use(require('connect').bodyParser());
//Handles put requests
app.use(express.methodOverride());

app.listen(3000);

/*
* GET base page, login or register
*/
app.get('/cloud/txmanager', function(req, res){
	if(req.session.user){
		//redirect to list of tx
		res.redirect('/cloud/txmanager/tx');
	}
	else{
		res.render(__dirname + '/pages/login_register.jade', {});
	}
});

/*
* POST for the register phase.
*/
app.post('/register', function(req, res){
	var username = req.body.username;
	var password = req.body.password;
	var email = req.body.email;
	
	txmanager.register(username, password, email, function(){
		//send something in the callback
		res.send("Registration completed");
	});
});

/*
* POST for the login phase.
*/
app.post('/login', function(req, res){
	var username = req.body.username;
	var password = req.body.password;
	txmanager.login(username, password, function(user){
		//REMEMBER TO SET THIS OTHERWISE USER WON'T NEVER BE CONNECTED (no cookie)
		req.session.user = user;
		res.send("Login completed");
	});
});


txmanager.init(app, 
'/cloud/txmanager', 
'mongodb://localhost:27017/ItemDB',
function(req, res, txs){
	res.render(__dirname + '/pages/base.jade', {
		transactions : txs,
	});
},
function(req, res, txs){
	res.render(__dirname + '/pages/base.jade', {
		transactions : txs,
	});
},
function(req, res, timeouts){
	res.send("confirmed! timeouts happened: " + timeouts);
});