/* 
* Server for Cloud TCC
* Extended with database support (MongoDB & Mongoose)
* @author Masiar Babazadeh 
* babazadm@usi.ch
*/

var express  = require('express'),
	mongoose = require('mongoose'),
	schemas  = require('./Schema'),
	Schema   = mongoose.Schema,
	jade	 = require('jade'),
	//$ = require('jquery'),
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
app.set('view engine', 'ejs');
app.set("view options", { layout: true });

//setup of the timeout & port
var PORT = process.argv[2] ? parseInt(process.argv[2]) : 3000;
var TIMEOUT = process.argv[3] ? parseInt(process.argv[3]) : 86400000;

//Handles post requests
app.use(require('connect').bodyParser());
//Handles put requests
app.use(express.methodOverride());

app.listen(PORT);
//app.use(app.router); 

var db = mongoose.connect('mongodb://localhost:27017/CloudDB');
var Transaction = db.model('Transaction');
var User = db.model('User');

/*
* GET base page, login or register
*/
app.get('/', function(req, res){
	console.log("user in session: " + JSON.stringify(req.session.user));
	if(req.session.user){
		//directly get the transactions
		getTransactions(req.session.user, function(txs){
			console.log(txs);
			if(txs == undefined){
				res.render(__dirname + '/pages/base.jade', {
					transactions : null,
				});
			}
			else {
				console.log("TRANSACTIONSSSSS " + txs);
				res.render(__dirname + '/pages/base.jade', {
					transactions : txs,
				});
			}
		});
	}
	else{
		res.render(__dirname + '/pages/login_register.jade', {});
	}
});

/*
* POST for the register phase.
*/
app.post('/register', function(req, res){
	console.log("in register");
	var newUser = new User();
	newUser.username = req.body.username;
	newUser.password = req.body.password;
	newUser.email = req.body.email;
	console.log("here");
	newUser.save(function (err) {
		if(err)
			console.log(err);
		console.log("User saved!  with username " + newUser.username + " and pass " + newUser.password);
	});
	
	//send something
	res.send("Registration completed");
});

/*
* POST for the login phase.
*/
app.post('/login', function(req, res){
	console.log("in login");
	var user = {};
	user.username = req.body.username;
	user.password = req.body.password;
	checkLogin(user, function(foundUser){
		//login correct
		console.log("login!");
		req.session.user = foundUser;
		console.log("user in session: " + JSON.stringify(req.session.user));
		getTransactions(req.session.user, function(txs){
			if(txs == undefined){
				res.render(__dirname + '/pages/base.jade', {
					transactions : null,
				});
			}
			else {
				for(var i = 0; i < txs.length; i++){
					console.log(delete txs[i]["_id"]);
				}
				console.log("TRANSACTIONSSSSS " + txs);
				res.render(__dirname + '/pages/base.jade', {
					transactions : txs,
				});
			}
		});
	});
});

/*
* GET the base view of the page. It will
* show the current transactions within the
* currently logged in user.
*/
app.get('/tx', function(req, res){
	getTransactions(req.session.user, function(txs){
		console.log("found transactions: ");
		console.log(txs);
		res.render(__dirname + '/pages/base.jade', {
			transactions : txs,
		});
	});
});

/*
* PUT method handler to receive transactions for a
* certain user. The user is stored in the session 
* variable. If it's not logged in, then it ignores
* the method FOR NOW. If logged in, then saves in the
* DB the transaction (should receive JSON or something
* similar)
*/
app.post('/addTransaction', function(req, res){
	//check if user is logged in
	if(req.session.user){
		console.log("in add transaction");
		//get transaction data
		var tx = req.body;
		//save it in the database
		var trns = new Transaction();
		trns.username = req.session.user.username;
		trns.timeout = tx.deadline;
		trns.item_name = tx.title;
		trns.confirmation_link = tx.confirmationLink;
		trns.uniqueId = tx.uniqueIdTx;
		trns.pending = false;
		console.log("transaction to be added: " + trns);
		//create a timeout from the deadline minus the current time, which
		//gives the number of milliseconds after w	hich the timeout will expire
		var to = tx.deadline - (new Date().getTime());
		console.log(to);
		if(to > 0){
			trns.save(function(err){
				if(err)
					console.log(err);
				else{
					//setup the timeout
					setTimeout(function() {
						//delete the transaction, first check if it has not been already committed
						findTransaction(tx.uniqueIdTx, function(tx){
							if(tx){
								//transaction still there, it has timeout, remove it
								Transaction.remove({uniqueId : tx.uniqueId}, function(){
									//do something?
									console.log("timeout! transaction removed from the cloud :(");
								});
							}
						});
					}, to - 1000);
				}
			});
			res.send("success?", 200);
			}
		else{
			console.log("RECEIVED SOMETHING OLD");
			res.send("old", 200);
		}
	}
	else{
		//not logged in, do nothing FOR NOW (and send error);
		console.log("not logged in...");
		res.send("not logged in...", 400);
	}
});

/*
* DELETE handler to delete a particular transaction
* defined with uniqueId. This will call delete on the 
* confirmation link, and then will remove the transaction
* from the database.
*/
app.delete('/tx/delete/:uniqueId', function(req, res){
	console.log("delete with uniqueId = " + req.params.uniqueId);
	if(req.session.user){
		findTransaction(req.params.uniqueId, function(tx){
			if(tx){
				//if the transaction is still here (no timeout) then do the DELETE on the confirmation link
				execute("DELETE", tx.confirmation_link, tx, function(tx){
					//callback, remove the transaction from the database
					Transaction.remove({uniqueId : tx.uniqueId}, function(){
						//send back result (rest of the transactions)
						getTransactions(req.session.user, function(txs){
							if(txs == undefined){
								res.render(__dirname + '/pages/base.jade', {
									transactions : {},
								});
							}
							else {
								res.render(__dirname + '/pages/base.jade', {
									transactions : txs,
								});
							}
						});
					});
				});
			}
			//otherwise do nothing
		});
	}
	else{
		console.log("not logged in in deletion!");
	}
});

/*
* PUT request to confirm all the transaction for a 
* particular user (the one currently logged in).
*/
app.put('/tx/confirm', function(req, res){
	console.log("confirm clicked!");
	if(req.session.user){
		getTransactions(req.session.user, function(txs){
			if(txs){
				console.log(txs);
				//set all transactions to pending, then perform the transaction
				//if it dies during the process, in the startup it should try it
				//again and again (same process)
				setAllPending(req.session.user, function(){
					//if the user has transactions to confirm, confirm them all
					for(var i = 0; i < txs.length; i++){
						console.log(txs[i].uniqueId);
						//do the PUT on the confirmation link
						execute("PUT", txs[i].confirmation_link, txs[i], function(tx){
							console.log(tx.uniqueId);
							//callback, remove the transaction from the database
							Transaction.remove({uniqueId : tx.uniqueId}, function(){
								//do nothing, because it's a loop, impossible to tell 
								//which callback will be called.
							});
						});
					}
				});
			}
		});
		//send back something to tell the user everything is all right.
		res.send("Transaction performed correctly.");
	}
	else
		console.log("not logged in in confirmation!");
});

/******USEFUL FUNCTIONS******/

/*
* Function to login user. Receives an user object and
* a callback function. If the user is inside the
* database, the callback is executed.
*/
var checkLogin = function(user, callback){
	console.log(user);
	User.findOne({"username" : user.username, "password" : user.password}, function(err, user) {
		if (err) {
			console.log(err);
  	 		throw err; 
  		} 
  		else if(user != undefined || user != null) {
			callback(user);
  		}
	});
}

/*
* This function gets all the transactions for the user
* which logged in. If no transaction found then the
* empty base page is sent, otherwise it is filled with
* the current transactions of the user. Returns all the
* transactions with all the fields except for _id.
*/
var getTransactions = function(user, callback){
	Transaction.find({username : user.username}, { '_id': 0, 'uniqueId' :1, 'timeout': 1, 'confirmation_link': 1, 'item_name': 1}, function(err, txs){
		console.log("user : " + user.username + " with txs: " + txs);
		callback(txs);
	});
}

/*
* Function that takes a transaction id and a function callback
* and performs a search inside the database and if a 
* result is found, the result is passed to the callback
*/
var findTransaction = function(transactionId, callback){
	Transaction.findOne({"uniqueId" : transactionId}, function(err, tx) {
		if (err) {
  	 		throw err; 
  		} 
  		else {
			callback(tx);
  		}
	}); 
}

/*
* This function executes an HTTP request with method
* method and uri url (inputs of the function). Used
* for PUT and DELETE. Handles error if server down.
* It retries after 1 sec, 2 secs, 4 secs, ... until
* succeedes executing the method.
*/
var execute = function(method, url, tx, callback, time){
	//chrome.extension.getBackgroundPage().execute(method, url, i);
	//if timeout doesn't exist, create one
	if(!time){
		var time = 1000;
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open(method, url, true);
	
	xmlhttp.onreadystatechange = function() {
	    if (xmlhttp.readyState == 4 && xmlhttp.status != 200)  {
			// Handle error, retry DELETE or PUT in exponential way
			console.log("problem! And i = " + time + " and url " + url + " and xmlhttp.status = " + xmlhttp.status + " and xmlhttp.readyState = " + xmlhttp.readyState);
			// Calls execute(method, url, i*2) after i milliseconds.
			setTimeout(execute, time, method, url,tx, callback, time*2);
			return;
		}
		
		else if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
			//everything went better than expected, execute callback
			callback(tx);
		}
	};
	
	xmlhttp.send(null);
}

/*
* Function to set all the transactions of a certain user in
* pending status. Used when user wants to commit all the
* transactions he has in his account.
*/
var setAllPending = function(user, callback){
	Transaction.update({username : user.username}, {$set: { pending : true }}, function(err){
		if(err)
			console.log(err);
		
		console.log("saved all pending transactions");
		callback();
	});
}

/*
* This function recreates the timeouts that may be lost
* when the server + database start up. It iterates through
* the transactions in the database and for each transaction
* it controls if the timeout has not already expired, if it
* has it sends a DELETE to the base server for that transaction.
*/
var setDeadlineTimouts = function(){
	//get all the transactions in the database
	console.log("setting up the timeouts in setDeadlineTimeouts");
	Transaction.find({}, function(err, txs){
		console.log("found these transactions to check " + txs);
		//iterates through the transactions
		for(var i = 0; i < txs.length; i++){
			//check if the timeout has already expired
			if(new Date().getTime() > txs[i].timeout){
				console.log("EXPIRED!");
				//expired, delete the transaction
				Transaction.remove({uniqueId : txs[i].uniqueId}, function(){
					//do something here too?
				});
			}
			else if(txs[i].pending){
				//transaction in pending, should be execute (since has not timeout yet)
				execute("PUT", txs[i].confirmation_link, txs[i], function(tx){
					console.log("found transaction with id : " + tx.uniqueId + " to be committed");
					//callback, remove the transaction from the database
					Transaction.remove({uniqueId : tx.uniqueId}, function(){
						//do nothing, because it's a loop, impossible to tell 
						//which callback will be called.
					});
				});
			}
			else {
				//not expired, set a setTimeout call
				//create a timeout from the deadline minus the current time, which
				//gives the number of milliseconds after which the timeout will expire
				var to = txs[i].timeout - (new Date().getTime());
				console.log("will expire in " + to);
				(
					function(i) {
						console.log("SET TIMEOUT");
						setTimeout(function() {
							//delete the transaction, first check if it has not been already committed
							findTransaction(txs[i].uniqueId, function(tx){
								console.log("search transaction to delete")
								if(tx){
									console.log("found transaction to delete: " + tx)
									//transaction still there, it has timeout, remove it
									Transaction.remove({uniqueId : tx.uniqueId}, function(){
										//do something?
										console.log("timeout! transaction removed from the cloud :( due to a timeout");
									});
								}
							});
						}, to - 1000);
					}
				)(i); // fired 1 sec before reservation is deleted
			}
		}
	});
}

setDeadlineTimouts();
