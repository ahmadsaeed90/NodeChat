var myUserName = null;
var myPic = null;

var Chat = (function() {
	
	var socket = null;
	
	function getOnlineUsers() {
		AjaxHelper.sendGetRequest("GetOnlineUsers", function(response) {
			var users = response.users;
			console.info(users);
			ViewRenderer.displayUsersList(users);
		});
	};
	
	function connectToSocket() {
		console.info("Going to connect to server socket");
		socket = io("http://localhost:3000");
		
		//socket events
		socket.on("message", function(data) {
			console.info(data);
			console.info("new message:" + data.message); 
			
			if (data.group) {
				if ($(".chat-window").data("isgroup") == "yes" && data.group.id == $(".chat-window").data("groupid")) {
					ViewRenderer.appendNewMessage(data.message, data.senderid, data.group, data.senderDetail);
					ViewRenderer.scrollChatWindowToBottom();
				}
				else {
					ViewRenderer.showUnreadMessage(data.senderid, data.group);
				}
			}
			else {
				var peerName = $(".chat-window").data("peer_uname");
				if ($(".chat-window").data("isgroup") == "no" && peerName == data.senderid) {
					ViewRenderer.appendNewMessage(data.message, data.senderid, null, data.senderDetail);
					ViewRenderer.scrollChatWindowToBottom();
				}
				else {
					ViewRenderer.showUnreadMessage(data.senderid);
				}
			}
			
			ViewRenderer.playPopSound();
			
		});
		socket.on("alert", function (data) {
			console.info(data);
		});
		socket.on("peerOnline", function(user) {
			console.info(user);
			if (user.username != myUserName) {
				ViewRenderer.displayUser(user);
			}
		});
		socket.on("chatHistory", function(response) {
			console.info(response);
			var peerid = response.peerid;
			ViewRenderer.appendMessages(response.messages);
		});
		socket.on("peerOffline", function(response) {
			console.info(response);
			var peerid = response.username;
			ViewRenderer.peerOffline(peerid);
		});
		socket.on("newGroupCreated", function(response) {
			console.info(response);
			var group = response.group;
			ViewRenderer.newGroupCreated(group);
		});
		socket.on("userGroupsLoaded", function(response) {
			console.info(response);
			ViewRenderer.displayUserGroups(response.groups);
		});
		socket.on("groupLeft", function(response) {
			console.info(response);
			if (response.status == "success") {
				ViewRenderer.groupLeft(response.groupid, response.username);
			}
		});
		socket.on("welcome", function(response) {
			console.info(response);
			myPic = response.user.picture;
			ViewRenderer.displayWelcomeMessage(response.user.name);
		});
		socket.on("chatHistoryCleared", function(response) {
			console.info("chatHistoryCleared");
			console.info(response);
			if (response.status == "success") {
				ViewRenderer.chatHistoryCleared(response.username, response.peerid, response.isGroup);
			}
		});
		
	}
	
	function sendMessage(receiver, message, isGroup) {
		socket.emit("message", {to: receiver, message: message, isGroup: isGroup});
	}
	
	function login(username, password) {
		myUserName = username;
		socket.emit("login", {username: username, password: ""});
	}
	
	function loadChatHistory(peerid, isgroup) {
		socket.emit("loadChatHistory", {peerid: peerid, isgroup: isgroup});
	}
	
	function createNewGroup(listUsers) {
		socket.emit("createNewGroup", {listUsers: listUsers});
	}
	
	function loadUserGroups(username) {
		socket.emit("loadUserGroups", {username: username});
	}
	
	function leaveGroup(groupid, username) {
		socket.emit("leaveGroup", {groupid: groupid, username: username});
	}
	
	function clearChatHistory(peer_id, isGroup) {
		socket.emit("clearChatHistory", {peer_id: peer_id, isGroup: isGroup});
	}
	
	function logout() {
		socket.emit("disconnect", {});
	}
	
	return {
		getOnlineUsers: getOnlineUsers,
		sendMessage: sendMessage,
		connectToSocket: connectToSocket,
		login: login,
		loadChatHistory: loadChatHistory,
		createNewGroup: createNewGroup,
		loadUserGroups: loadUserGroups,
		leaveGroup: leaveGroup,
		clearChatHistory: clearChatHistory,
		logout: logout
	};
	
})();