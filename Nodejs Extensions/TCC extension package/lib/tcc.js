/*!
 * TCC Wrapper
 */

/*
 * Module dependencies.
 */

var express  = require('express'),
	mongoose = require('mongoose'),
	schemas  = require('./Schema'),
	Schema   = mongoose.Schema;

var exports = module.exports;

exports.init = function(app, uri, dbUri, t, afterReservationCallback, deleteCallback, finalCallback){
	exports.timeout = t;
	
	var db = mongoose.connect(dbUri);
	var Transaction = db.model('Transaction');
	var identifiers = parseUri(uri);
	
	//POST handler (reservation)
	app.post(uri, function(req, res){
		if(req.header('Accept').indexOf("+tcc") != -1){
			//making up confirmation link
			//first: uniqueid
			//timestamp + random used because it's impossible to have two equal ids
			//and it's impossible to make up an id up to the millisecond precision
			var uniqueId = new Date().getTime() + "-" + Math.floor(Math.random()*100000) + "-" + Math.floor(Math.random()*100000) + "-" + Math.floor(Math.random()*100000);
			
			//then link
			var els = uri.split("/");
			var counter = 0;
			var newUri = "";
			for(var i = 0; i < els.length; i++){
				if(els[i].indexOf(":") != -1){
					els[i] = req.params[identifiers[counter]];
					counter++;
				}
				if(els[i] != "")
					newUri += "/" + els[i];
			}
			console.log(newUri);
			counter = 0;
			
			var confLink = "<http://"+req.headers.host+ newUri + "/XTCC?id="+uniqueId+">; rel=\"confirm\"";
			//then deadline
			var timestamp = new Date().getTime() + exports.timeout;
			//save everything in the database
			var trns = new Transaction();
			trns.uniqueId = uniqueId;
			trns.timeout = timestamp;
			trns.item_no = req.params.item_no;
			trns.save(function (err) {
				if (!err){
					//reserve the item
					afterReservationCallback(req, res);
					console.log(confLink);
					//setTimeout for the deadline (only now when saved on db)
					setTimeout(function() {
						//delete the transaction, first check if it has not been already committed
						findTransaction(uniqueId, function(tx){
							if(tx){
								console.log("tx : " + tx);
								removeTransaction(uniqueId, function(err){
									if(!err){
										console.log("timeout expired");
										deleteCallback();
									}
									else{
										console.log(err);
									}
								});
							}
						});
					}, exports.timeout - 1000); // fired 1 sec before reservation is deleted
					
					//send only confLink, GET PUT and DELETE will do the rest
					res.header('Link', confLink);
					//send something meaningful that shows that the item has been reserved
					res.send("TCC! sent confirmation link in Link header");
				}
				else {
					console.log(err);
				}
			});
			}
		else {
			res.send("No TCC :(");
		}
	});
	
	//GET handler (info)
	app.get(uri + "/XTCC", function(req, res){
		//take the unique id and check in the db if it exists
		//a transaction with that id.
		var uniqueId = req.query.id;
		findTransaction(uniqueId, function(tx){
			if(tx){
				//transaction found
				var response = "";
				
				//then link
				var els = uri.split("/");
				var counter = 0;
				var newUri = "";
				for(var i = 0; i < els.length; i++){
					if(els[i].indexOf(":") != -1){
						els[i] = req.params[identifiers[counter]];
						counter++;
					}
					if(els[i] != "")
						newUri += "/" + els[i];
				}
				console.log(newUri);
				counter = 0;
				
				var confLink = "http://"+req.headers.host + newUri + "/XTCC?id="+uniqueId;

				if(req.accepts('application/json')){
					//console.log("JSON ASKED");
					var jsonResponse = {
						uri: confLink,
						deadline: tx.timeout,
						rel: "confirm",
						uniqueIdTx : tx.uniqueId,
					};
					response = JSON.stringify(jsonResponse);
					//console.log(response);
				}
				else if(req.accepts('application/xml')){
					//if XML asked
					//console.log("XML asked");
					response = "<payment><uri>"+confLink+"</uri> <deadline>"+tx.timeout+"</deadline> <rel>confirm</rel></payment>";
				}
				//console.log("sending response");
				res.send(response);
			}
			else {
				//the id is not in the db, old or made up, return
				res.send("Wrong transaction number");
			}
		});
	});
	
	
	//DELETE handler
	app.delete(uri+'/XTCC', function(req, res){
		var uniqueId = req.query.id;
		removeTransaction(uniqueId, function(){
			//call the callback
			console.log("in app.delete");
			deleteCallback();
		})
	});
	
	
	//PUT handler (confirm)
	app.put(uri+'/XTCC', function(req, res){
		var uniqueId = req.query.id;
		//in-stock count already decreased by the POST action
		//check that it has not timed out
		findTransaction(uniqueId, function(tx){
			if(tx){
				removeTransaction(uniqueId, function(){
					console.log("before final callback");
					finalCallback();
				});
			}
			else {
				//transaction was not found, probably timoeut
				console.log("this tx: " + uniqueId + " already timeouted or already payed");
				res.send('ok', 206);
			}
		});
	});	
	
	/*
	* Helper functions
	*/


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
	* Function that removes a transaction from the db.
	* Useful when deleting a transaction or confirming
	* one (so the item is bought and the tx is completed).
	* Once done, the callback function is executed.
	* If called with a non-existent Id, nothing happens.
	*/
	var removeTransaction = function(txId, callback){
		Transaction.remove({"uniqueId" : txId}, callback);
	}

	/*
	* This function recreates the timeouts that may be lost
	* when the server + database start up. It iterates through
	* the transactions in the database and for each transaction
	* it controls if the timeout has not already expired, if it
	* has it removes it, if it hasn't it sets a setTimeout.
	*/
	var setDeadlineTimouts = function(){
		//get all the transactions in the database
		Transaction.find({}, function(err, txs){
			//iterates through the transactions
			for(var i = 0; i < txs.length; i++){
				//check if the timeout has already expired
				if(new Date().getTime() > txs[i].timeout){
					//expired, delete the transaction
					removeTransaction(txs[i].uniqueId, function(){});
				}
				else {
					//not expired, set a setTimeout call
					(
						function(i) {
							setTimeout(function() {
								//delete the transaction
								//un-reserve the item
								removeTransaction(txs[i].item_no, function(err){
									if(!err){
										console.log("cancel transaction due to timeout");
										deleteCallback();
									}
									else
										console.log(err);
								});
							}, exports.timeout - 1000);
						}
					)(i); // fired 1 sec before reservation is deleted
				}
			}
		});
	}
	
	//check. if the server died restore transactions in process
	setDeadlineTimouts();
}

/*
* This function takes an uri and parses the regexp
* part of the uri used in express to parse paths.
* The result will be an array of names (identifiers)
* for the variable parts of the path. These identifiers
* will be used in the creation of the confirmation
* link.
* For example: uri = '/:class/:id'; I get parsed 
* the names of the variables ("class", "id") and when
* creating the confirmation link these will be asked
* to the req.params variable thus will send back a
* correct link.
*/
var parseUri = function(uri){
	var pathnames = uri.split('/');
	var result = new Array();
	for(var i = 0; i < pathnames.length; i++){
		if(pathnames[i].indexOf(':') != -1){
			//identifier
			result.push(pathnames[i].split(":")[1]);
		}
	}
	
	return result;
}