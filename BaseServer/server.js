/* 
* Test server for TCC
* Extended with database support (MongoDB & Mongoose)
* @author Masiar Babazadeh 
* babazadm@usi.ch
*/

var express  = require('express'),
	mongoose = require('mongoose'),
	schemas  = require('./Schema'),
	Schema   = mongoose.Schema,
	jade	 = require('jade');

//FOR HTTPS (TODO later)
//var app = require('express').createServer({ key: ... });

var app = express.createServer(
	express.logger()
);

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

var db = mongoose.connect('mongodb://localhost:27017/ItemDB');
var Item = db.model('Item');
var Transaction = db.model('Transaction');

/*
* First page of the ItemSeller
*/
app.get('/', function(req, res){
	res.render(__dirname + '/pages/index.jade', {
		port : PORT,
	});
});

/*
* GET for the admin page to add custom items 
* to the database. It displays a form to add
* items.
*/
app.get('/admin', function(req, res){
	res.render(__dirname + '/pages/add_objects.jade', {});
});

/*
* POST for the admin page to accept new items
* which will be added to the database.
*/
app.post('/admin', function(req, res){
	var newItem = new Item();
	newItem.name = req.body.name;
	newItem.type = req.body.type;
	newItem.picture = req.body.picture;
	newItem.inStock = req.body.inStock;
	saveItem(newItem);
	
	//send back the adding page
	res.render(__dirname + '/pages/add_objects.jade', {});
});

/*
* GET handler for showing the list of elments
* with a given type (:class).
*/
app.get('/show/:class', function(req, res){
	var ty = req.params.class;
	searchItems(ty, function(foundItems){
		res.render(__dirname + '/pages/show_items.jade', {
			type : ty,
			items: foundItems,
			port : PORT,
		});
	});
});

/*
* GET handler for the action of getting an item
* page. It will display the item page with some
* information about it and the button to reserve it.
*/
app.get('/item/:item_no', function(req, res){
	//retrieve item from database
	findItem(req.params.item_no, function(item){
		//send page with item info to the client
		if(item){
			var img = item.picture ? item.picture : false
			res.render(__dirname + '/pages/single_element.jade', {
				type : item.type,
				name : item.name,
				inStock : item.inStock,
				no : req.params.item_no,
				image : img,
				port : PORT,
			});
		}
		else
			res.send("Item not found in the database.");
	});
});

/*
* POST handler for the post action done on an item
* this will trigger the reservation of the object if
* the client supports TCC (otherwise nothing for now).
*/
app.post('/item/:item_no', function(req, res){
	//check if item exists/retrieve it from db
	findItem(req.params.item_no, function(item){
		if(item){
			if(item.inStock > 0){
				//check if the request is TCC
				if(req.header('Accept').indexOf("+tcc") != -1){
					//making up confirmation link
					//first: uniqueid
					//timestamp used because it's impossible to have two equal ids
					//and it's impossible to make up an id up to the millisecond precision
					var uniqueId = new Date().getTime();
					//then link
					var confLink = "<http://"+req.headers.host+"/buy/" + req.params.item_no + "/XTCC?id="+uniqueId+">; rel=\"confirm\"";
					//then deadline
					var timestamp = new Date().getTime() + TIMEOUT;
					//save everything in the database
					var trns = new Transaction();
					trns.uniqueId = uniqueId;
					trns.timeout = timestamp;
					trns.item_no = req.params.item_no;
					trns.save(function (err) {
						if (!err){
							//reserve the item
							modifyStockCount(req.params.item_no, false, function(err){
								if(!err){
									console.log("modified stock count");
									
									//setTimeout for the deadline (only now when saved on db)
									setTimeout(function() {
										//delete the transaction, first check if it has not been already committed
										findTransaction(uniqueId, function(tx){
											if(tx){
												//transaction still there, it has not comfirmed and its timeout, un-reserve the item
												modifyStockCount(req.params.item_no, true, function(err){
													//delete the transaction for that item
													removeTransaction(uniqueId, function(err){
														if(!err){
															console.log("cancel transaction due to timeout");
														}
														else
															console.log(err);
													});
												});
											}
										});
									}, TIMEOUT - 1000); // fired 1 sec before reservation is deleted
									
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
						else
							console.log(err);
					});
				}
				else {
					res.send("No TCC :(");
				}
			}
			else {
				res.send("Item is completely sold out.");
			}
		}
		else {
			res.send("Item not found in the database.");
		}
	});
});

/*
* GET handler for the info asked by the Chrome extension.
* It returns the information about the transaction done
* with TCC: again the URI (confirmation link), the 
* deadline (in milliseconds), the rel and the title.
*/
app.get('/buy/:item_no/XTCC', function(req, res){
	//take the unique id and check in the db if it exists
	//a transaction with that id.
	var uniqueId = req.query.id;
	findTransaction(uniqueId, function(tx){
		if(tx){
			//transaction found
			var response = ""; 
			var confLink = "http://"+req.headers.host+"/buy/" + req.params.item_no + "/XTCC?id="+uniqueId;
			
			//get the item name
			getItemName(req.params.item_no, function(itemName){
				//if JSON asked
				if(req.accepts('application/json')){
					console.log("JSON ASKED");
					var jsonResponse = {
						uri: confLink,
						deadline: tx.timeout,
						rel: "confirm",
						title: "Item: " + itemName,
						uniqueIdTx : tx.uniqueId,
					};
					response = JSON.stringify(jsonResponse);
				}
				else if(req.accepts('application/xml')){
					//if XML asked
					console.log("XML asked");
					response = "<payment><uri>"+confLink+"</uri> <deadline>"+tx.timeout+"</deadline> <title>Item: " + itemName + "</title> <rel>confirm</rel></payment>";
				}
				res.send(response);
			});
		}
		else {
			//the id is not in the db, old or made up, return
			res.send("Wrong transaction number");
		}
	});
});

/*
* DELETE handler for the transaction. It deletes
* the current transaction for the item reserved
* and add back the item to the stock.
*/
app.delete('/buy/:item_no/XTCC', function(req, res){
	var uniqueId = req.query.id;
	//un-reserve the item
	modifyStockCount(req.params.item_no, true, function(err){
		//delete the transaction for that item
		removeTransaction(uniqueId, function(err){
			if(!err){
				console.log("DELETE method to cancel transaction");
				res.send('ok', 200);
			}
			else
				console.log(err);
		});
	});
});

/*
* PUT handler for the transaction. It decreases
* by one the inStock count for the item and
* deletes the transaction that has been confirmed.
* TODO: something for payment & sending item.
*/
app.put('/buy/:item_no/XTCC', function(req, res){
	var uniqueId = req.query.id;
	//in-stock count already decreased by the POST action
	//just remove the transaction and so something for the payment
	removeTransaction(uniqueId, function(err){
		if(!err){
			console.log("PUT payment has been done for uniqueId " + uniqueId);
			res.send('ok', 200);
			//do something for the payment
			//do something for sending the item to the buyer
		}
		else
			console.log(err);
	});
});

//execute function for each transaction in the database re-set the timeout


/******USEFUL FUNCTIONS******/

/*
* Function that checks in the database if the id
* chosen by some other transaction has already been
* taken by some previous transaction.
*/
var checkUniqueness = function(newId){
	Transaction.findOne({"uniqueId" : newId}, function(err, tx) {
		if (err) {
  	 		throw err; 
  		} 
  		else { 
			if(tx){
				console.log("not unique")
				return false;
			}
			else{
				console.log("unique")
				return true;
			}
  		}
	});
}

/*
* Function that takes an item id and a function callback
* and performs a search inside the database and if a 
* result is found, the result is passed to the callback
*/
var findItem = function(itemId, callback){
	Item.findOne({"uniqueId" : itemId}, function(err, item) {
		if (err) {
  	 		throw err; 
  		} 
  		else { 
			callback(item);
  		}
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
* Function that increases or decreases the 
* stock count depending on the input variable
* given.
*/
var modifyStockCount = function(itemId, increase, callback){
	var conditions = { "uniqueId" : itemId };
	var update;
	if(increase)
		update = {$inc : {inStock : 1}};
	else
		update = {$inc : {inStock : -1}};
	Item.update(conditions, update, callback);
}

/*
* Function that searches for items with a given
* type (itemType) and calls the callback with
* the results.
*/
var searchItems = function(itemType, callback){
	Item.find({"type" : itemType}, function(err, items) {
		if (err) {
  	 		throw err; 
  		} 
  		else { 
			callback(items);
  		}
	});
}

/*
* Function that takes a new object and saves
* it into the database. The input is the object
* itself.
*/
var saveItem = function(newItem){
	//get a correct id
	Item.find({}, ['uniqueId']) .sort('uniqueId', -1).execFind( function(err, items) {
			if(err)
				console.log(err);
			else{
				//check if no item in db start with uniqueId = 1
				if(items[0] == undefined){
					newItem.uniqueId = 1;
				}
				else {
					//set it into the item
					newItem.uniqueId = items[0].uniqueId + 1;
					console.log(items);
				}
				//save the item
				newItem.save(function (err) {
					console.log("Item saved!");
				});
			}
		});
}

/*
* Returns the item name given the item id in the database.
*/
var getItemName = function(item_id, callback){
	Item.findOne({"uniqueId" : item_id}, function(err, item) {
		if (err) {
  	 		throw err; 
  		} 
  		else { 
			callback(item.name);
  		}
	});
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
							modifyStockCount(txs[i].item_no, true, function(err){
								//delete the transaction for that item
								removeTransaction(txs[i].uniqueId, function(err){
									if(!err){
										console.log("cancel transaction due to timeout");
									}
									else
										console.log(err);
								});
							});
						}, TIMEOUT - 1000);
					}
				)(i); // fired 1 sec before reservation is deleted
			}
		}
	});
}

setDeadlineTimouts();