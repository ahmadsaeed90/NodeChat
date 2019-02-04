//E:\lp\java\java sol\ChatApplication\WebContent

$(function() {
	
	//Chat.getOnlineUsers();
	var uname = Utils.getCookie("uname");
	var pass = Utils.getCookie("pass");
	
	if (uname == null || uname == "") {
		alert("Restricted access.");
		location.href = "login.html";
	}
	
	Chat.connectToSocket();
	Chat.login(uname, pass);
	Chat.getOnlineUsers();
	Chat.loadUserGroups(myUserName);
	
	$("#usersListArea").on("click", "div.userRow", function() {
		$(".userRow").removeClass("selected");
		$(this).find(".un-read-msg-count").empty();
		$(this).addClass("selected");
		var chat_window = $(".chat-window");
		var groupid = $(this).data("groupid");
		$(".send-msg-btn").removeAttr("disabled");
		if (groupid) {
			//this is group
			chat_window.data("groupid", groupid);
			$(".exit-group").show();
			chat_window.data("isgroup", "yes");
			chat_window.find(".name").html($(this).find(".name").html());
			$(".chat-history").empty();
			$(".new-chat-msg").val("");
			Chat.loadChatHistory(groupid, true);
		}
		else {
			chat_window.data("isgroup", "no");
			$(".exit-group").hide();
			var peerName = $(this).data("username");
			chat_window.data("peer_uname", peerName);
			chat_window.find(".name").html($(this).find(".name").html());
			$(".chat-history").empty();
			$(".new-chat-msg").val("");
			Chat.loadChatHistory(peerName);
		}		
	});
	
	$(".send-msg-btn").click(function() {
		var chat_window = $(".chat-window");
		var msg = chat_window.find(".new-chat-msg").val();
		
		if ($.trim(msg).length > 0) {
			var to = null;
			var isGroup = chat_window.data("isgroup") == "yes";
			
			if (isGroup) {
				to = chat_window.data("groupid");
			}
			else {
				to = chat_window.data("peer_uname");
			}
			
			Chat.sendMessage(to, msg, isGroup);
			ViewRenderer.appendNewMessage(msg, myUserName);
			chat_window.find(".new-chat-msg").val("");
			ViewRenderer.scrollChatWindowToBottom();
		}
	});
	
	$(".add-user-to-chat").click(function() {
		var chat_window = $(".chat-window");
		if (chat_window.data("groupid") || chat_window.data("peer_uname"))
			ViewRenderer.displayAddUserSelectionMenu();
	});
	
	$(".exit-group").click(function() {
		var chat_window = $(".chat-window");
		var groupid = chat_window.data("groupid");
		Chat.leaveGroup(groupid, myUserName);
	});
	
	$(".logOutLink").click(function() {
		Chat.logout();
	});
	
	$(".clear-chat-history").click(function() {
		var chat_window = $(".chat-window");
		var isGroup = chat_window.data("isgroup") == "yes";
		var peer_id;
		if (isGroup) {
			peer_id = chat_window.data("groupid");
		}
		else {
			peer_id = chat_window.data("peer_uname");
		}
		Chat.clearChatHistory(peer_id, isGroup);
	});
});




