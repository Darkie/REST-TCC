/*
* Testing server that make use of the tcc extension.
* This simple test server imports the tcc extension
* and creates a basic TCC-compliant server.
*
* @author: masiar.babazadeh@usi.ch
*/

var express  = require('express'),
	jade	 = require('jade');
	
var tcc = require('./tcc');

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

app.get('/', function(req, res){
	res.send("prova");
})

tcc.init(app, 
function(continuation){
	console.log("inital callback");
	continuation();
},
'/buy/:item', 
'mongodb://localhost:27017/ItemDB', 
60000, 
function(){
	console.log("triggered after reservation");
},
function(){
	console.log("delete triggered");
}, 
function(){
	console.log("put triggered");
});