/*
* Testing server that make use of the tcc extension.
* This simple test server imports the tcc extension
* and creates a basic TCC-compliant server.
*
* @author: masiar.babazadeh@usi.ch
*/

var express  = require('express'),
	mongoose = require('mongoose'),
	schemas  = require('./Schema_itemdb'),
	Schema   = mongoose.Schema,
	jade	 = require('jade');
	
var tcc = require('./tcc');
var PORT = 3030;

//FOR HTTPS (TODO later)
//var app = require('express').createServer({ key: ... });

var app = express.createServer(
	express.logger()
);

app.set('view engine', 'ejs');
app.set("view options", { layout: true });

//Handles post requests
app.use(require('connect').bodyParser());
//Handles put requests
app.use(express.methodOverride());

app.listen(3030);

var db = mongoose.connect('mongodb://localhost:27017/ItemDB');
var Item = db.model('Item');

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
	res.render(__dirname + '/pages/add_objects.jade', {
		port : PORT,
	});
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
	res.render(__dirname + '/pages/add_objects.jade', {
		port: PORT,
	});
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


tcc.init(app, 
'/item/:item', 
'mongodb://localhost:27017/ItemDB', 
60000, 
function(req, res, item){
	console.log("triggered POST");
	modifyStockCount(item, false, function(err){
		console.log("ITEM ID: " + item);
		if(!err){
			console.log("no errors");
			res.send("TCC! sent confirmation link in Link header");
		}
		else {
			console.log("error finding item (wrong item id?)");
		}
	});
},
function(req, res, item, timeout){
	//here req + res because we don't know what the user wants to send
	//timeout is a flag telling if it's a timeout of a reservation, if
	//it is, no res should be sent!
	console.log("delete triggered");
	modifyStockCount(item, true, function(err){
		if(!err && !timeout)
			res.send('ok', 200);
		else if(timeout)
			console.log("some timeout, deleting the reservation");
		else {
			console.log("error finding item (wrong item id?)");
		}
	});
}, 
function(req, res, timeout, item){
	//timeout input variable is a flag that tells if the
	//timeout already triggered for this particular transaction
	if(timeout){
		console.log("this item reservation: " + item + " already timeouted or already payed");
		res.send('ok', 206);
	}
	else {
		console.log("PUT payment has been done for uniqueId " + item);
		res.send('ok', 200);
	}
});
