/*
* Schema file containing the schemas for the database
* @author: Masiar Babazadeh babazadm@usi.ch
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var Tx = new Schema({
	username          : String,
	uniqueId          : Number,
	timeout           : Number,
	item_name         : String,
	confirmation_link : String,
	pending           : Boolean,
});

var UserSchema = new Schema({
	username : String,
	password : String,
	email    : String,
});

var Transaction = mongoose.model('Transaction', Tx);
var User		= mongoose.model('User', UserSchema);