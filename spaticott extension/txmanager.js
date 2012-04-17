/*
* TCC transaction manager handler for spaticott
*
* XXX: not failure-resistant (need DB for persistence?)
* @author: masiar.babazadeh@usi.ch
*/

var http = require ('http'),
	XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
	querystring = require('querystring'),
	parse = require('url').parse;
	

/*
* Constructor
*/
function txmanager() {
	if (false === (this instanceof txmanager)){
		return new txmanager();
	}
}

/*
* Init the txmanager. It should only have an array to store
* all the confirmation links received from the various tcc
* requests.
*/
txmanager.prototype.__init = function(){
	this.confLink = new Array();
}

/*
* Function used to store a new confirmation link into the txmanager. The
* confirmation link is not only a link per se, contains the link to confirm
* the transaction and the timeout in milliseconds and other stuff.
*/
txmanager.prototype.storeLink = function(txlink){
	this.confLink.push(txlink);
	console.log(this.confLink);
	//setup the timeout
	var to = txlink.deadline - (new Date().getTime());
	var confLinks = this.confLink;
	console.log("to = " + to + " deadline = " + txlink.deadline + " nowdate = " + (new Date().getTime()))
	setTimeout(function() {
		//delete the transaction, first check if it has not been already committed
		
		//XXX: impossible that this.confLink is undefined but it happens, check why!
		if(confLinks != undefined){
			for(var i = 0; i < confLinks.length; i++){
				if(confLinks[i].uri == txlink.uri){
					confLinks.splice(i, 1);
					break;
				}
			}
		}
	}, to - 1000);
}

/*
* Function used to delete a particular order done in the past. It takes
* a txlink object and performs a DELETE request.
*/
txmanager.prototype.delete = function(txlink){
	execute("DELETE", txlink, function(tx, isTimeout){
		//callback, remove the transaction from the list
		for(var i = 0; i < this.confLink.length; i++){
			if(this.confLink[i].uri == tx.uri){
				this.confLink.splice(i, 1);
				break;
			}
		}
	});
}

/*
* Function used to confirm all the reservations done so far. It takes
* the array of confirmation links and starts the PUT execution through 
* the execute method, that handles per se the failures.
*/
txmanager.prototype.confirm = function(){
	console.log("in confirm with legnth of confLink " + this.confLink.length);
	var counter = this.confLink.length;
	for(var i = 0; i < this.confLink.length; i++){
		//do the PUT on the confirmation link
		this.execute("PUT", this.confLink[i], function(txlink, isTimeout){
			if(isTimeout){
				//we have a timeout during confirmation
			}
			
			counter--;
			if(counter == 0){
				//counter reaced zero, all transactions executed, clear the list
				//not really necessary but to avoid errors of any kind is better
				this.confLink = new Array();
			}
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
txmanager.prototype.execute = function(method, txlink, callback, time){
	//if timeout doesn't exist, create one
	if(!time){
		var time = 1000;
	}
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.open(method, txlink.uri, true);
	
	xmlhttp.onreadystatechange = function() {
	    if (xmlhttp.readyState == 4 && xmlhttp.status != 200 && xmlhttp.status != 206)  {
			// Handle error, retry DELETE or PUT in exponential way
			//console.log("problem! And i = " + time + " and url " + url + " and xmlhttp.status = " + xmlhttp.status + " and xmlhttp.readyState = " + xmlhttp.readyState);
			// Calls execute(method, url, i*2) after i milliseconds.
			setTimeout(execute, time, method, txlink, callback, time*2);
			return;
		}
		
		else if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
			//everything went better than expected, execute callback
			callback(txlink, false);
		}
		
		else if (xmlhttp.readyState == 4 && xmlhttp.status == 206){
			//some trouble, execute callback saying something is lost
			callback(txlink, true);
		}
	};
	
	xmlhttp.send(null);
}

exports.TXManager = txmanager;