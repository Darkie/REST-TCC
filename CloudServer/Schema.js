/*
* Schema file containing the schemas for the database
* @author: Masiar Babazadeh babazadm@usi.ch
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var ItemToSell = new Schema({
	uniqueId : { type: Number, index: true }
  , name     : String 
  , type     : String
  , inStock  : Number
  , picture  : String
});

var Tx = new Schema({
	username          : String,
	uniqueId          : Number,
	timeout           : Number,
	item_name         : String,
	confirmation_link : String,
});

var UserSchema = new Schema({
	username : String,
	password : String,
	email    : String,
});

var Item 		= mongoose.model('Item', ItemToSell);
var Transaction = mongoose.model('Transaction', Tx);
var User		= mongoose.model('User', UserSchema);