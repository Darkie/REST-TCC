/*
* Schema file containing the schemas for the database
* @author: Masiar Babazadeh babazadm@usi.ch
*/

var mongoose = require('mongoose'),
    Schema   = mongoose.Schema;

var Tx = new Schema({
	uniqueId : String,
	timeout  : Number,
	item_no  : Number,
});

var Transaction = mongoose.model('Transaction', Tx);