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
					//check if it's a duplicate
					if(notDuplicate(details.responseHeaders[i].value)){
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
								};
								
								var res = JSON.parse(localStorage.getItem('responses'));
								if(!res)
									res = new Array();
								res.push(receivedData);
								localStorage.setItem('responses', JSON.stringify(res));
								console.log(res);
							}
						});
					}
				}
			}
		}
	},
	{urls: ["<all_urls>"]},
	["blocking", "responseHeaders"]);
	
	
/*
*Checks if the link received is not already inside the array
*This should neverever happen, if it happens something is
*really messed up badly.
*/
var notDuplicate = function(responseUrl){
	var responses = JSON.parse(localStorage.getItem('responses'));
	for(var i = 0; i < responses.length; i++){
		if(responses[i].confirmationLink == responseUrl)
			return false;
	}
	return true;
}

/*
		* This function executes an HTTP request with method
		* method and uri url (inputs of the function). Used
		* for PUT and DELETE. Handles error if server down.
		* It retries after 1 sec, 2 secs, 4 secs, ... until
		* succeedes executing the method.
*/
		var execute = function(method, url, time){
			//chrome.extension.getBackgroundPage().execute(method, url, i);
			//if timeout doesn't exist, create one
			if(!time){
				var time = 1000;
			}
			
			var xmlhttp = new XMLHttpRequest(); 
			xmlhttp.open(method, url, true);
			
			xmlhttp.onreadystatechange = function() {
			    if (xmlhttp.readyState == 4 && xmlhttp.status != 200)  {
					// Handle error, retry DELETE or PUT in exponential way
					console.log("problem! And i = " + time + " and url " + url + " and xmlhttp.status = " + xmlhttp.status + " and xmlhttp.readyState = " + xmlhttp.readyState);
					// Calls execute(method, url, i*2) after i milliseconds.
					setTimeout(execute, time, method, url, time*2);
					return;
				}
			};
			
			xmlhttp.send(null);
		}