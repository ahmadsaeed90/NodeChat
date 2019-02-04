var AjaxHelper = (function() {
	
	function sendGetRequest(url, callback) {
		
		$.ajax({
			  dataType: "json",
			  url: url,
			  success: function(response) {
				  callback(response);
			  }
		})/*.fail(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
		};*/
	};
	
	function sendPostRequest(url, params, callback) {
		
		$.ajax({
			  dataType: "json",
			  url: url,
			  data: params,
			  method: "POST",
			  success: function(response) {
				  callback(response);
			  }
		})/*.fail(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
		    console.log( "Request Failed: " + err );
		};*/
	};
	
	return {
		sendGetRequest: sendGetRequest,
		sendPostRequest: sendPostRequest
	};
	
})();