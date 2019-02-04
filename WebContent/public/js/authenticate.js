$(function() {
	Utils.setCookie("uname", "");
	
	$("#signup").click(function() {
		if ($("#name").val() == "" || $("#username").val() == "" || $("#email").val() == "" || $("#phone").val() == "" ||
			$("#password").val() == "" || $("#address").val() == "" || $("#picture").val() == "") {
			$("#msg").html("All fiels are required.").removeClass("success-msg").addClass("error-msg");
			return;
		}
		$("#msg").html("");
		
		Utils.submitMultiPartForm($("#signupForm"), "", "/Signup", function(response) {
			console.info(response);
			if (response.status == "success") {
				$("#msg").html("Successfully Registered").removeClass("error-msg").addClass("success-msg");
			}
			else {
				if (response.errorMessage.search("Duplicate") != -1){
					response.errorMessage = "This username is already taken.";
				}
				$("#msg").html(response.errorMessage).removeClass("success-msg").addClass("error-msg");
			}
		});
		
	});
	
	$("#login").click(function() {
		var uname = $("#username").val();
		if (uname == "" || $("#password").val() == "") {
			$("#msg").html("All fiels are required.").removeClass("success-msg").addClass("error-msg");
			return;
		}
		$("#msg").html("");
		
		Utils.submitMultiPartForm($("#loginForm"), "", "/Login", function(response) {
			console.info(response);
			if (response.isvalid) {
				$("#msg").html("Login Successful").removeClass("error-msg").addClass("success-msg");
				Utils.setCookie("uname", uname);
				location.href = "home.html";
			}
			else {
				$("#msg").html("Invalid login").removeClass("success-msg").addClass("error-msg");
			}
		});
		
	});
	
});