var Utils = {
		
	listToString: function(list, key, separator) {
		var keys = [];
		for (var i = 0; i < list.length; i++) {
			keys.push(list[i][key]);
		}
		return keys.join(separator);
	},

	submitMultiPartForm : function(form, params, url, callBack) {

		var iFrameId = "upload_iframe";

		$("#hidden_params").remove();
		$("#" + iFrameId).remove();

		var iframe = $("<iframe id='upload_iframe' name='upload_iframe' style='display:none'></iframe>");
		form
				.append("<input type='hidden' name='params' id='hidden_params' value='"
						+ params + "' />");

		form.parent().append(iframe);
		form.attr("action", url);
		form.attr("target", iFrameId);
		form.attr("method", "POST");
		form.attr("enctype", "multipart/form-data");
		form.attr("encoding", "multipart/form-data");

		iframe.load(function() {
			var response = iframe.contents().text();
			console.info("response = " + response);
			response = $.parseJSON(response);

			if ($.isFunction(callBack)) {
				callBack(response);
			}
		});

		form.submit();
	},
	
	setCookie: function (cname, cvalue) {
	    var d = new Date();
	    d.setTime(d.getTime() + (1*24*60*60*1000));
	    var expires = "expires="+d.toUTCString();
	    document.cookie = cname + "=" + cvalue + "; " + expires;
	},
	
	getCookie: function (cname) {
	    var name = cname + "=";
	    var ca = document.cookie.split(';');
	    for(var i=0; i<ca.length; i++) {
	        var c = ca[i];
	        while (c.charAt(0)==' ') c = c.substring(1);
	        if (c.indexOf(name) == 0) return c.substring(name.length,c.length);
	    }
	    return "";
	},
	
	formatDate: function(date) {
		return date.toLocaleString();
	}
};