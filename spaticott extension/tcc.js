/*
* TCC handler for spaticott
* @author: masiar.babazadeh@usi.ch
*/

var http = require ('http'),
	XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
	querystring = require('querystring'),
	parse = require('url').parse;
	
	
/*
* Constructor
*/
function tcc() {
	if (false === (this instanceof tcc)){
		return new tcc();
	}
}

/*
* Init the tcc object. Stores the txmanager in order to give it the 
* confirmation link once it has been trimmed out.
* XXX: TO BE REFACTORED, INPUT uri NOT NEEDED ANYMORE! Pass uri dirctly to .reserve function
*/
tcc.prototype.__init = function(txmanager, uri, scheduler){
	this.txmanager = txmanager;
	this.uri = uri;
	this.__scheduler = scheduler;
}


/*
* Function that does the reservation of the item. In other words it 
* sends the POST to reserve something, waits for an answer and when
* provided, checks if it's a resource that supports tcc. If it's the
* case then trims down the confirmation link out of the header and
* stores it into the txmanager.
*/
tcc.prototype.reserve = function(__event, uri, scheduler, txmanager){
	//parse data from uri to fill options variable
	var data = parse(uri);

	var options = {
	  	host: data.hostname,
	    port: data.port,
	    path: data.pathname,
		method: 'POST',
		headers: {
			'accept' : 'application/json+tcc',
		}
	};
	
	console.log(data);

	var req = http.request(options, function(res) {
		res.setEncoding('utf8');

		res.on('data', function (chunk) {
			//have to check if the headers contain 'Link' and 'XTCC'
			if(res.headers["link"] && res.headers["link"].indexOf("XTCC") != -1){
				//parse url, str variable is now the link to confirm this order
				var str = res.headers["link"].substr(0, res.headers["link"].indexOf(">"));
				str = str.substring(1, str.length);
				if(res.headers["deadline"] == undefined){
					console.log(str);
					//deadline undefined, get more info through the link
					getInfo(str, __event, scheduler, txmanager);
				}
			}
		});
	});
	
	var sched = scheduler;
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
		sched.emit(__event);
	});

	req.write('data\n');
	req.write('data\n');
	req.end();
}

/*
* Function to get more info from the reserved item (eg. timeout)
*/
var getInfo = function(uri, __event, __scheduler, txmanager) {
	//parse data from uri to fill options variable
	var data = parse(uri);
	
	var options = {
	  	host: data.hostname,
	    port: data.port,
	    path: data.pathname + data.search,
		headers: {
			'accept' : 'application/json',
		}
	};
	console.log(options);
	console.log(data);
	http.get(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function(chunk){
			if(chunk == "Wrong transaction number or timed up before get info"){
				console.log("Wrong tx id");
			}
			else{
				console.log(chunk);
				chunk = JSON.parse(chunk);
				//store data and/or send it directly to CloudServer
				var receivedData = {
					uri: chunk.uri,
					deadline: chunk.deadline,
					title: chunk.title,
					uniqueIdTx : chunk.uniqueIdTx,
				};
				//store data in transaction manager
				txmanager.storeLink(receivedData);
				__scheduler.emit(__event);
			}
		});
		
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
		__scheduler.emit(__event);
	});
}

/*
* Function that returns the result of the execution of tcc. In theory
* this function should return nothing, because what tcc returns is
* already stored in the transaction manager, but it's here to avoid the
* compiler to compile something different when compiling tcc. 
* For now it returns nothing.
*/
tcc.prototype.get__result = function(){
	
}

exports.TCC = tcc;