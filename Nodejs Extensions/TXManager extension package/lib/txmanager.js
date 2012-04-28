/*!
 * TCC Wrapper
 */

/*
 * Module dependencies.
 */

var express  = require('express'),
	mongoose = require('mongoose'),
	schemas  = require('./Schema'),
	Schema   = mongoose.Schema,
	XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;

var exports = module.exports;

var db;
var uri;
var Transaction;
var User;

/*
* Function to init the txmanager. It takes a app variable,
* an uri to which the txmanager will be accessible, the
* url of the DB, 
*/
exports.init = function(app, u, dbUri, onGET, onDELETE, onPUT){
	db = mongoose.connect(dbUri);
	uri = u;
	
	db = mongoose.connect(dbUri);
	Transaction = db.model('Transaction');
	User = db.model('User');
	
	/*
	* POST for the login phase.
	*/
	app.post(uri + '/login', function(req, res){
		var user = {};
		user.username = req.body.username;
		user.password = req.body.password;
		exports.login(user.username, user.password, function(foundUser){
			req.session.user = foundUser;
			getTransactions(req.session.user, function(txs){
				if(txs == undefined){
					//temporarily like this
					res.send("no transactions");
				}
				else {
					for(var i = 0; i < txs.length; i++){
						console.log(delete txs[i]["_id"]);
					}
					//temporarily like this
					res.send(txs);
				}
			});
		});
	});
	
	/*
	* POST method handler to receive transactions for a
	* certain user. The user is stored in the session 
	* variable. If it's not logged in, then it ignores
	* the method FOR NOW. If logged in, then saves in the
	* DB the transaction (should receive JSON or something
	* similar)
	*/
	app.post(uri + '/addTransaction', function(req, res){
		console.log("ADD TRANSACTION!")
		//check if user is logged in
		if(req.session.user){
			//console.log("in add transaction");
			//get transaction data (from the chrome extension!)
			var tx = req.body;
			//save it in the database
			var trns = new Transaction();
			trns.username = req.session.user.username;
			trns.timeout = tx.deadline;
			trns.item_name = tx.title;
			trns.confirmation_link = tx.confirmationLink;
			trns.uniqueId = tx.uniqueIdTx;
			trns.pending = false;
			//console.log("transaction to be added: " + trns);
			//create a timeout from the deadline minus the current time, which
			//gives the number of milliseconds after w	hich the timeout will expire
			var to = tx.deadline - (new Date().getTime());
			//console.log(to);
			if(to > 0){
				trns.save(function(err){
					if(err)
						console.log(err);
					else{
						console.log("SAVED TRANSACTION " + trns);
						//setup the timeout
						setTimeout(function() {
							//delete the transaction, first check if it has not been already committed
							findTransaction(tx.uniqueIdTx, function(tx){
								if(tx){
									//transaction still there, it has timeout, remove it
									Transaction.remove({uniqueId : tx.uniqueId}, function(){
										//do something?
										//console.log("timeout! transaction removed from the cloud :(");
									});
								}
							});
						}, to - 1000);
					}
				});
				res.send("success?", 200);
				}
			else{
				//console.log("RECEIVED SOMETHING OLD");
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
	* GET the base view of the page. It will
	* show the current transactions within the
	* currently logged in user.
	*/
	app.get(uri + '/tx', function(req, res){
		getTransactions(req.session.user, function(txs){
			onGET(req, res, txs);
		});
	});
	
	/*
	* DELETE handler to delete a particular transaction
	* defined with uniqueId. This will call delete on the 
	* confirmation link, and then will remove the transaction
	* from the database.
	*/
	app.delete(uri + '/tx/delete/:uniqueId', function(req, res){
		if(req.session.user){
			findTransaction(req.params.uniqueId, function(tx){
				if(tx){
					//if the transaction is still here (no timeout) then do the DELETE on the confirmation link
					console.log("CONFIRMATION LINK IN DELETE: " + tx.confirmation_link + " with tx: " + tx + " and uniqueid " + req.params.uniqueId);
					execute("DELETE", tx.confirmation_link, tx, function(tx){
						//callback, remove the transaction from the database
						Transaction.remove({uniqueId : tx.uniqueId}, function(){
							//send back result (rest of the transactions)
							getTransactions(req.session.user, function(txs){
								onDELETE(req, res, txs);
							});
						});
					});
				}
				//otherwise do nothing
			});
		}
		else{
			console.log("not logged-in in deletion!");
		}
	});
	
	/*
	* PUT request to confirm all the transaction for a 
	* particular user (the one currently logged in).
	*/
	app.put( uri + '/tx/confirm', function(req, res){
		console.log("in confirm");
		if(req.session.user){
			getTransactions(req.session.user, function(txs){
				if(txs){
					//keep the number of transactions
					req.session.user.numberOfTransactionsToConfirm = txs.length;
					//set all transactions to pending, then perform the transaction
					//if it dies during the process, in the startup it should try it
					//again and again (same process)
					req.session.user.someTimeout = 0;
					setAllPending(req.session.user, function(){
						console.log("setting all pending");
						//if the user has transactions to confirm, confirm them all
						for(var i = 0; i < txs.length; i++){
							console.log("executing the various put ("+ (i + 1) +"th)")
							//console.log(txs[i].uniqueId);
							//do the PUT on the confirmation link
							execute("PUT", txs[i].confirmation_link, txs[i], function(tx, isTimeout){
								//remove one from the total
								req.session.user.numberOfTransactionsToConfirm = req.session.user.numberOfTransactionsToConfirm - 1;
								//console.log("just removed one, now is " + req.session.user.numberOfTransactionsToConfirm);
								//callback, remove the transaction from the database
								Transaction.remove({uniqueId : tx.uniqueId}, function(){
									console.log("after removing from db check if final")
									if(isTimeout){
										req.session.user.someTimeout = req.session.user.someTimeout + 1;
									}
									//if counter reaches 0, all transactions executed, send result
									if(req.session.user.numberOfTransactionsToConfirm == 0){
										onPUT(req, res, req.session.user.someTimeout);
									}
								});
							});
						}
					});
				}
			});
		}
		else
			console.log("not logged in in confirmation!");
	});
	
	
	/*------------------------------------------------------------------------------*/
	
	
	/*
	* Function used to register users to the service.
	* The function will be called from an express callback which
	* gathers username, password and mail of the user that wants
	* to register and the extension will take care of the credentials
	* of the user. Executes a final callback after registration
	* is completed successfully. If some error occurred error is
	* logged and callback is executed anyways.
	*/
	exports.register = function(username, password, email, callback){
		var newUser = new User();
		newUser.username = username;
		newUser.password = password;
		newUser.email = email;
		newUser.save(function (err) {
			if(err)
				console.log(err);
			callback();
		});
	}
	
	/*
	* Function that logs in the user given the credentials.
	* If the user is found a callback is executed with as
	* parameter the user itself. If not return false. If an
	* error occurred, it is thrown.
	*/
	exports.login = function(username, password, callback){ 
		User.findOne({"username" : username, "password" : password}, function(err, user) {
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
	* Function to set all the transactions of a certain user in
	* pending status. Used when user wants to commit all the
	* transactions he has in his account.
	*/
	var setAllPending = function(user, callback){
		Transaction.update({username : user.username}, {$set: { pending : true }}, function(err){
			if(err)
				console.log(err);

			//console.log("saved all pending transactions");
			callback();
		});
	}
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
	    if (xmlhttp.readyState == 4 && xmlhttp.status != 200 && xmlhttp.status != 206)  {
			// Handle error, retry DELETE or PUT in exponential way
			//console.log("problem! And i = " + time + " and url " + url + " and xmlhttp.status = " + xmlhttp.status + " and xmlhttp.readyState = " + xmlhttp.readyState);
			// Calls execute(method, url, i*2) after i milliseconds.
			setTimeout(execute, time, method, url, tx, callback, time*2);
			return;
		}
		
		else if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
			//everything went better than expected, execute callback
			//console.log("RECEIVED 200");
			callback(tx);
		}
		
		else if (xmlhttp.readyState == 4 && xmlhttp.status == 206){
			//everything went better than expected, execute callback
			//console.log("RECEIVED 206");
			callback(tx, true);
		}
	};
	
	xmlhttp.send(null);
}