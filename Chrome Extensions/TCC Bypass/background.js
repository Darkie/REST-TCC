/*
* Variable that stores if the user is currently logged in into
* the coud service that stores all of his/her confirmation links.
*/
var loggedIn = false;

/*
* Variable that stores the transaction website link.
*/
var transactionUrl = "";

chrome.webRequest.onBeforeSendHeaders.addListener(
  function(details) {
    for (var i = 0; i < details.requestHeaders.length; ++i) {
      if (details.requestHeaders[i].name === 'Accept') {
        	details.requestHeaders[i].value = details.requestHeaders[i].value + "+tcc";
        	break;
      }
    }
    return {requestHeaders: details.requestHeaders};
  },
  {urls: ["<all_urls>"]},
  ["blocking", "requestHeaders"]);

chrome.webRequest.onHeadersReceived.addListener(
	function(details){
		for (var i = 0; i < details.responseHeaders.length; ++i) {
			if (details.responseHeaders[i].name === 'Link' && details.responseHeaders[i].value.indexOf("XTCC") != -1) {
				//check that is the response for the booking flight/../seat/../XTCC post
				if(details.responseHeaders[i].value.indexOf("deadline") == -1){
					//store the link (first parse it)
					var str = details.responseHeaders[i].value.substr(0, details.responseHeaders[i].value.indexOf(">"));
					str = str.substring(1, str.length);
					//make a GET request and receive info data
					$.ajax({
						beforeSend: function(req) {
							req.setRequestHeader("Accept", "application/json");
						},
						type: "GET",
						url: str,
						success: function(data){
							//store everything in the response array
							var jsonResult = JSON.parse(data);
							console.log(data);
							var receivedData = {
								confirmationLink: str,
								deadline: jsonResult.deadline,
								title: jsonResult.title,
								uniqueIdTx : jsonResult.uniqueIdTx,
							};
							
							//send data to the server
							//if this fails, it keeps trying like when confirming.
							execute("POST", transactionUrl + "/addTransaction", receivedData);
							/*$.ajax({
								type: "POST",
								url: "http://localhost:3000/addTransaction",
								data: receivedData,
								success: function(data){
									console.log(data);
								}
							});*/
							console.log(receivedData);
						}
					});
				}
			}
		}
	},
	{urls: ["<all_urls>"]},
	["blocking", "responseHeaders"]);
	
	
/*
* This function executes an HTTP request with method
* method and uri url (inputs of the function). Used
* for PUT and DELETE. Handles error if server down.
* It retries after 1 sec, 2 secs, 4 secs, ... until
* succeedes executing the method.
*/
var execute = function(method, url, dataToSend, time){
	//chrome.extension.getBackgroundPage().execute(method, url, i);
	//if timeout doesn't exist, create one
	if(!time){
		var time = 1000;
	}
	
	$.ajax({
		type: method,
		url: url,
		data: dataToSend,
		success: function(data){
			console.log("in jquery: " + data);
		},
		error: function(jqXHR, textStatus, errorThrown) {
			setTimeout(execute, time, method, url, dataToSend, time*2);
		}
	});

	/*var xmlhttp = new XMLHttpRequest();
	xmlhttp.open(method, url, true);

	xmlhttp.onreadystatechange = function() {
	    if (xmlhttp.readyState == 4 && xmlhttp.status != 200)  {
			// Handle error, retry DELETE or PUT in exponential way
			console.log("problem! And i = " + time + " and url " + url + " and xmlhttp.status = " + xmlhttp.status + " and xmlhttp.readyState = " + xmlhttp.readyState);
			// Calls execute(method, url, i*2) after i milliseconds.
			setTimeout(execute, time, method, url, dataToSend, time*2);
			return;
		}

		else if (xmlhttp.readyState == 4 && xmlhttp.status == 200){
			//everything went better than expected, execute something
			console.log("everything worked!");
		}
	};

	xmlhttp.send(null); */
}