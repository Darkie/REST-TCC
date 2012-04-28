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
  , picture    : String
});

var Item 		= mongoose.model('Item', ItemToSell);
