var noPic = "icon-no-user.png";

var ViewRenderer = (function() {
	
	function displayUsersList(users) {
		$.each(users, function(i, user) {
			displayUser(user);
		});
	};
	
	function displayUser(user) {
		if (user.username != myUserName) {
			var userRow = $("#usersList").find("[data-username='" + user.username + "']");
			if (userRow.length == 0) {
				var picUrl = getPicUrl(user.picture), str = "";
				str += "<div class='userRow' data-username='" + user.username + "'><div class='pic'><img src='" + picUrl + "' /></div><div class='name'>" 
					+ user.name + "</div><div class='status online'></div><div class='un-read-msg-count'></div></div>";
				$("#usersList").append(str);
			}
			else {
				userRow.find("div.status").removeClass("offline").addClass("online");
			}
		}
	}
	
	function peerOffline(peerid) {
		var userRow = $("#usersList").find("[data-username='" + peerid + "']");
		if (userRow.length > 0) {
			userRow.find("div.status").removeClass("online").addClass("offline");
		}
	}
	
	function getPicUrl(picname) {
		var picUrl = "";
		if (!picname) {
			picUrl = "images/" + noPic;
		}
		else {
			picUrl = "uploads/" + picname;
		}
		return picUrl;
	}
	
	function appendNewMessage(msg, username, group, senderDetail, timestamp) {
		var userpicurl = "", fromOther = "";
		
		if (username != myUserName) {
			//userpicurl = $("#usersList").find("[data-username='" + username + "']").find("img").attr("src");
			userpicurl = "uploads/" + senderDetail.picture;
			fromOther = "from-other";
		}
		else {
			userpicurl = getPicUrl(myPic);
		}
		
		var dt;
		if (!timestamp) {
			dt = new Date();
		}
		else {
			dt = new Date(timestamp);
		}
		timestamp = Utils.formatDate(dt);
		
		var title = "";
		if (group) {
			for (var i = 0; i < group.usersList.length && title == ""; i++) {
				if (group.usersList[i].username == username) {
					title = group.usersList[i].name;
				}
			}
		}
		
		$(".chat-history").append("<div class='chat-msg " + fromOther + "' title='" + title + "'><div class='pic'><img src='" + 
				userpicurl + "' /></div><div class='msg'>" + replaceEmoticons(msg) + "<br/><span class='msg-timestamp'>" + timestamp + "</span></div></div>");
	}
	
	function appendMessages(messages) {
		for (var i = 0; i < messages.length; i++) {
			var message = messages[i];
			appendNewMessage(message.msg, message.sender_id, false, message.senderDetail, message.sending_time);
		}
		scrollChatWindowToBottom();
	}
	
	function scrollChatWindowToBottom() {
		$(".chat-history").animate({ scrollTop: $(".chat-history").prop("scrollHeight") }, "fast");
	}
	
	function showUnreadMessage(peerid, group) {
		
		var critera = "data-username='" + peerid + "'";
		if (group) {
			critera = "data-groupid='" + group.id + "'";
		}
		
		var row = $("#usersList").find("[" + critera + "]");
		
		if (row.length == 0) {
			addGroupRow(group, 1);
			row = $("#usersList").find("[" + critera + "]");
		}
		
		var countArea = row.find(".un-read-msg-count");
		var counthtml = countArea.html();
		var count = 1;
		
		if (counthtml != "") {
			count += parseInt(counthtml.substring(1, counthtml.length - 1));
		}
		
		countArea.html("(" + count + ")");
	}
	
	function replaceEmoticons(text) {
		  var emoticons = {
				":D" : "big-smile.png",
				":P" : "tongue-out.png",
				":)" : "smile.png",
				":'(" : "cry.png",
				":(" : "frown.png",
				"<3" : "heart.png",
				"3:)" : "devil.png",
				"O:)" : "angel.png",
		  }, url = "smileys/", patterns = [],
		     metachars = /[[\]{}()*+?.\\|^$\-,&#\s]/g;
		  
		  for (var i in emoticons) {
		    if (emoticons.hasOwnProperty(i)){ // escape metacharacters
		      patterns.push('('+i.replace(metachars, "\\$&")+')');
		    }
		  }

		  // build the regular expression and replace
		  return text.replace(new RegExp(patterns.join('|'),'g'), function (match) {
		    return typeof emoticons[match] != 'undefined' ?
		           '<img src="'+url+emoticons[match]+'"/>' :
		           match;
		  });
	}
	
	function playPopSound() {
		var audio = new Audio('sounds/pop.wav');
		audio.play();
	}
	
	function displayAddUserSelectionMenu() {
		var menu = "<ul class='dropdown-menu add-user-selection-list'>";
		$("#usersList").find(".userRow").each(function() {
			if ($(this).data("username")) {
				menu += "<li data-username='" + $(this).data("username") + "'>" 
					+ $(this).data("username") + "</li>";
			}
			event.stopPropagation();
		});
		menu += "</ul>";
		console.info(menu);
		$(".chat-options").append(menu);
		
		$(".add-user-selection-list li").click(function() {
			var chat_window = $(".chat-window");
			var peerid = $(this).data("username");
			
			if (chat_window.data("isgroup") == "no") {
				var peer2 = chat_window.data("peer_uname");
				Chat.createNewGroup([myUserName, peerid, peer2]);
			}
			else {
				
			}
			console.info("Adding " + peerid + " to group chat");
			$(".add-user-selection-list").remove();
		});
		
		$(document).click(function() {
			$(".add-user-selection-list").remove();
		});
	}
	
	function newGroupCreated(group) {
		var chat_window = $(".chat-window");
		chat_window.data("groupid", group.id);
		
		var namesString = Utils.listToString(group.usersList, "name", ", ");
		
		chat_window.find(".name").html(namesString);
		
		if (chat_window.data("isgroup") == "no") {
			$(".chat-history").empty();
		}
		
		chat_window.data("isgroup", "yes");
		addGroupRow(group);
		var groupRow = $("#usersList").find("[data-groupid='" + group.id + "']");
		$(".userRow").removeClass("selected");
		groupRow.addClass("selected");
		//$(".new-chat-msg").val("");
		//Chat.loadChatHistory(peerName);
	}
	
	function addGroupRow(group, index) {
		var groupRow = $("#usersList").find("[data-groupid='" + group.id + "']");
		if (groupRow.length == 0) {
			
			var usernames = Utils.listToString(group.usersList, "username", ",");
			var namesString = Utils.listToString(group.usersList, "name", ", ");
			
			var str = "<div class='userRow' data-groupid='" + group.id + "' data-users='" + usernames + "'><div class='pic'><img src='images/user-group.png' /></div><div class='name'>" 
				+ namesString + "</div><div class='un-read-msg-count'></div></div>";
			
			if (index) {
				$("#usersList").append(str);
			} 
			else {
				$("#usersList").prepend(str);
			}
		}
	}
	
	function displayUserGroups(groups) {
		for (var i = 0; i < groups.length; i++) {
			addGroupRow(groups[i]);
		}
	}
	
	function groupLeft(groupid, username) {
		if (username == myUserName) {
			var groupRow = $("#usersList").find("[data-groupid='" + groupid + "']");
			groupRow.remove();
			$("#usersList").find(".userRow")[0].click();
		}
	}
	
	function chatHistoryCleared(username, peerid, isGroup) {
		$(".chat-history").empty();	
	}
	
	function displayWelcomeMessage(name) {
		$(".welcome-msg .display-name").html(name);
	}

	return {
		displayUsersList: displayUsersList,
		appendNewMessage: appendNewMessage,
		displayUser: displayUser,
		appendMessages: appendMessages,
		peerOffline: peerOffline,
		scrollChatWindowToBottom: scrollChatWindowToBottom,
		replaceEmoticons: replaceEmoticons,
		playPopSound: playPopSound,
		showUnreadMessage: showUnreadMessage,
		displayAddUserSelectionMenu: displayAddUserSelectionMenu,
		newGroupCreated: newGroupCreated,
		displayUserGroups: displayUserGroups,
		groupLeft: groupLeft,
		chatHistoryCleared: chatHistoryCleared,
		displayWelcomeMessage: displayWelcomeMessage
	};

})();