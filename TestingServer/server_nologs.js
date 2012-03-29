/* 
* Server for testing CloudServer & BaseServer
* Contacts CloudServer and logs in. Does some input number
* of reservations through BaseServer and confirms through
* CloudServer.
* @author Masiar Babazadeh 
* babazadm@usi.ch
*/

var express  = require('express'),
	http = require ('http'),
	XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest,
	querystring = require('querystring'),
	parse = require('url').parse;

//setup of some variables
var ITEM_PORT = 3010;
var cookie;
var rndm_username;
var rndm_password;
var BOOKINGS = process.argv[2] ? parseInt(process.argv[2]) : 2;
var PORT = process.argv[3] ? parseInt(process.argv[3]) : 3100;
var CLIENT_NMR = process.argv[4] ? parseInt(process.argv[4]) : 0;
//variables for computing time
var START_AFTER_REGISTRATION;
var START_AFTER_RESERVATIONS;
var END;

/*
* Function to register on cloudserver
*/
var register = function() {
	rndm_username = randomString();
	rndm_password = randomString();
	var data = querystring.stringify({
			username: rndm_username,
			password: rndm_password,
			email: 'm@l.com',
		});

	var options = {
	    host: 'grid.inf.unisi.ch',
	    port: 3000,
	    path: '/register',
	    method: 'POST',
	    headers: {
	        'Content-Type': 'application/x-www-form-urlencoded',
	        'Content-Length': data.length
	    }
	};

	var req = http.request(options, function(res) {
		cookie = res.headers["set-cookie"][0];
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			//after registration do login
			login(true);
		});
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.write(data);
	req.end();
}

/*
* Function to login on cloudserver
*/
var login = function(registered) {
	var data;
	
	if(registered){
		data = querystring.stringify({
				username: rndm_username,
				password: rndm_password,
		});	
	}
	else {
		data = querystring.stringify({
				username: 'm',
				password: 'm',
			});
	}

	var options = {
	    host: 'grid.inf.unisi.ch',
	    port: 3000,
	    path: '/login',
	    method: 'POST',
	    headers: {
	        'Content-Type': 'application/x-www-form-urlencoded',
	        'Content-Length': data.length
	    }
	};

	var req = http.request(options, function(res) {
		cookie = res.headers["set-cookie"][0];
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			//after login, do some orders 
			doOrders(BOOKINGS);
		});
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.write(data);
	req.end();
}

/*
* Function to do some orders
*/
var doOrders = function(ords) {
	START_AFTER_REGISTRATION = new Date().getTime();
	//call many times doOrder with different ids?
	for(var i = 0; i < ords; i++){
		var item_id = Math.floor(Math.random() * 3) + 1;
		
		doOrder(item_id);
	}
}

/*
* Function to place one single order on one single object
*/
var doOrder = function(item_id){
	var options = {
	    host: 'grid.inf.unisi.ch',
	    port: ITEM_PORT,
	    path: '/item/' + item_id,
	    method: 'POST',
	    headers: {
	        'cookie' : cookie,
			'accept' : 'application/json+tcc',
	    }
	};

	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		
		res.on('data', function (chunk) {
			//have to check if the headers contain 'Link' and 'XTCC'
			if(res.headers["link"] && res.headers["link"].indexOf("XTCC") != -1){
				//parse url
				var str = res.headers["link"].substr(0, res.headers["link"].indexOf(">"));
				str = str.substring(1, str.length);
				if(res.headers["deadline"] == undefined){
					//deadline undefined, get more info through the link
					getInfoForItem(str);
				}
			}
		});
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.write('data\n');
	req.write('data\n');
	req.end();
}

/*
* Function to get more info from the reserved item
*/
var getInfoForItem = function(uri) {
	//parse data from uri to fill options variable
	var data = parse(uri);
	
	var options = {
	  	host: data.hostname,
	    port: data.port,
	    path: data.path,
		headers: {
			'cookie' : cookie,
			'accept' : 'application/json',
		}
	};

	http.get(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function(chunk){
			if(chunk == "Wrong transaction number"){
				console.log("Wrong transaction number for client_nmr " + CLIENT_NMR);
			}
			else{
				chunk = JSON.parse(chunk);
				//store data and/or send it directly to CloudServer
				var receivedData = {
					confirmationLink: chunk.uri,
					deadline: chunk.deadline,
					title: chunk.title,
					uniqueIdTx : chunk.uniqueIdTx,
				};

				sendDataToCloud(receivedData);
			}
		});
		
		//XXX: not working
		//on end, decrease bookings variable
		res.on('end', function(e){
			BOOKINGS = BOOKINGS - 1;
			if(BOOKINGS == 0){
				setTimeout(function(){
					START_AFTER_RESERVATIONS = new Date().getTime();
					confirm();
				}, 2000);
			}
		});
		
		
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});
}

/*
* Function to send data of a single reservation order
* to the CloudServer.
*/
var sendDataToCloud = function(receivedData){
	var data = querystring.stringify(receivedData);
	//setup the options
	var options = {
	    host: 'grid.inf.unisi.ch',
	    port: 3000,
	    path: '/addTransaction',
	    method: 'POST',
	    headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': data.length,
	        'cookie' : cookie,
	    }
	};
	
	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
		});
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.write(data);
	req.end();
}

/*
* Function to confirm all of what we have
*/
var confirm = function() {
	var options = {
	    host: 'grid.inf.unisi.ch',
	    port: 3000,
	    path: '/tx/confirm',
	    method: 'PUT',
	    headers: {
			'cookie' : cookie,
	    }
	};
	
	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			END = new Date().getTime();
			var total_time = END - START_AFTER_REGISTRATION;
			var confirm_time = END - START_AFTER_RESERVATIONS;
			if(chunk == "all_ok"){
				console.log("CID"+CLIENT_NMR+",all_ok,"+total_time+","+confirm_time);
			}
			else{
				//console.log(chunk);
				console.log("CID#"+CLIENT_NMR+","+chunk+","+total_time+","+confirm_time);
			}
			process.exit(1);
		});
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.write('data\n');
	req.write('data\n');
	req.end();
}

/*
* Function to delete something
*/
var deleteTransaction = function(item_id){
	var options = {
	    host: 'grid.inf.unisi.ch',
	    port: 3000,
	    path: '/tx/delete/' + item_id,
	    method: 'DELETE',
	    headers: {
			'cookie' : cookie,
	    }
	};
	
	var req = http.request(options, function(res) {
		res.setEncoding('utf8');
		res.on('data', function (chunk) {
		});
	});
	
	req.on('error', function(e) {
		console.log('problem with request: ' + e.message);
	});

	req.write('data\n');
	req.write('data\n');
	req.end();
}

/*
* This function generates a random string. Useful for generating
* random username and password for testing.
*/
var randomString = function() {
	var chars = "ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
	var string_length = 10;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}

/*
* Test code to run the code as soon as the server is started
*/
register();
