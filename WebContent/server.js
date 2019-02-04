//sudo npm install --save body-parser

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var bodyParser = require("body-parser");
var multer  = require('multer');
var done = false;

var clients = {};
var userDetails = {};
var socketIdToUsernameMapping = {};
var totalClients = 0;

var Config = {
		dburl: "localhost",
		dbuser: "root",
		dbpassword: "",
		dbname: "chat_application",
		allowedPictureExtensions: ["png", "jpg", "gif"]
};

app.use(bodyParser.urlencoded({ extended: false }));

/* Configure the multer. */
app.use(multer({
	dest : './public/uploads/',
	rename : function(fieldname, filename) {
		return filename + Date.now();
	},
	onFileUploadStart : function(file) {
		console.log(file.originalname + ' is starting ...');
		done = false;
	},
	onFileUploadComplete : function(file) {
		console.log(file.fieldname + ' uploaded to  ' + file.path);
		done = true;
	}
}));

app.use(express.static(__dirname + '/public'));
app.get('/', function(req, res) {
	 res.sendFile(__dirname + '/public/login.html');
});

server.listen(3000, function() {
	console.log('listening on *:3000');
});

app.get("/GetOnlineUsers", function(req, res) {
	var users = [];
	for (var uname in clients) {
		users.push({
			username: uname,
			name: userDetails[uname].name,
			picture: userDetails[uname].picture
		});
	}
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify({ users: users }));
});

app.post("/Signup", function(request, response) {
	/* console.info(request.body); */
	if (done == true) {
		var picture = request.files.picture.name;
		var extension = request.files.picture.extension.toLowerCase();
		console.log(request.files);
		console.info("file uploaded");
		//var params = JSON.parse(Object.keys(request.body)[0]);
		var params = request.body;
		params.picture = picture;
		console.info(params);
		//response.setHeader('Content-Type', 'application/json');
		
		if (Config.allowedPictureExtensions.indexOf(extension) != -1) {
			DBHelper.addNewUser(params, function(res) {	
				response.send(JSON.stringify(res));
				DBHelper.populateCache();
			});
		}
		else {
			response.send(JSON.stringify({
				status: "error",
				errorMessage: "This file type is now allowed."
			}));
		}
		
		//res.end("File uploaded.");
	}
});

app.post("/Login", function(request, response) {
	var params = request.body;
	var username = params.username;
	var password = params.password;
	
	console.info(params);
	//response.setHeader('Content-Type', 'application/json');
	
	DBHelper.checkLogin(username, password, function(isvalid) {
		response.send(JSON.stringify({
			status : "success",
			isvalid: isvalid
		}));
	});
});

io.on('connection', function (socket) {
	
	console.info("User connected");
	
	//DBHelper.addChatMessage("u1", "u2", "Test message");
	
	socket.on('login', function (data) {
		clients[data.username] = socket;
		socketIdToUsernameMapping[socket.id] = data.username;
		console.info("User [" + data.username + "] has logged in");
		
		var detail = userDetails[data.username];
		if (!detail) {
			DBHelper.getUserInfo(data.username, function(detail) {
				userDetails[detail.username] = detail;
				socket.emit('welcome', { user: detail });
				socket.broadcast.emit('peerOnline', detail);
			});
		}
		else {
			socket.emit('welcome', { user: detail });
			socket.broadcast.emit('peerOnline', detail);
		}
		
		//socket.emit('message', { message: 'welcome to the chat' });
		
    });
	
	socket.on('message', function (data) {
		var to = data.to;
		var message = data.message;
		var isGroup = data.isGroup;
		var senderid = socketIdToUsernameMapping[socket.id];
		
		DBHelper.addChatMessage(senderid, to, message, isGroup);
		console.info("message:: to = " + to + ", message = " + message);
		
		if (isGroup) {
			DBHelper.getGroupMembers(to, function(users) {
				for (var i = 0; i < users.length; i++) {
					if (users[i].username != senderid && clients[users[i].username]) {
						clients[users[i].username].emit('message', { message: message, senderid: senderid, group: {
							id: to,
							usersList: users
						}, senderDetail: userDetails[senderid]});
					}
				}
			});
		}
		else {
			if (clients[to]) {
				clients[to].emit('message', { message: message, senderid: senderid, senderDetail: userDetails[senderid] });
			}
			else {
				socket.emit('alert', { message: 'Peer is offline' });
			}
		}
    });
	
	socket.on("loadChatHistory", function(data) {
		var peerid = data.peerid;
		var isGroup = data.isgroup;
		var userid = socketIdToUsernameMapping[socket.id];
		
		DBHelper.loadChatHistory(userid, peerid, isGroup, function(res) {
			socket.emit("chatHistory", res);
		});
	});
	
	socket.on("createNewGroup", function(data) {
		var listUsers = data.listUsers;
		console.info("createNewGroup");
		DBHelper.createNewGroup(listUsers, function(res) {
			socket.emit("newGroupCreated", res);
		});
	});
	
	socket.on("loadUserGroups", function(data) {
		var username = data.username;
		DBHelper.loadUserGroups(username, function(groups) {
			socket.emit("userGroupsLoaded", {username: username, groups: groups });
		});
	});
	
	socket.on("leaveGroup", function(data) {
		var groupid = data.groupid;
		var username = data.username;
		console.info("leaveGroup:: groupid=[" + groupid + "], username = " + username);
		DBHelper.leaveGroup(groupid, username , function(response) {
			socket.emit("groupLeft", response);
		});
	});
	
	socket.on("clearChatHistory", function(data) {
		var peer_id = data.peer_id;
		var username = socketIdToUsernameMapping[socket.id];
		var isGroup = data.isGroup;
		console.info("clearChatHistory:: peer_id=[" + peer_id + "], username = " + username);
		DBHelper.clearChatHistory(username, peer_id, isGroup, function(response) {
			socket.emit("chatHistoryCleared", response);
		});
	});
	
	//setInterval(function() {
		
	//}, 2000);
	
    socket.on('send', function (data) {
        io.sockets.emit('message', data);
    });
    
    socket.on('disconnect', function () {
    	totalClients--;
    	socket.broadcast.emit('peerOffline', { username: socketIdToUsernameMapping[socket.id] });
	});
});


var DBHelper = {
		
	connection: null,

	connect: function() {
		var mysql = require('mysql');
		DBHelper.connection = mysql.createConnection({
		  host     : Config.dburl,
		  user     : Config.dbuser,
		  password : Config.dbpassword,
		  database : Config.dbname
		});		
		DBHelper.connection.connect();
	},
	
	disconnect: function() {
		DBHelper.connection.end();
	},

	addChatMessage: function(senderid, receiverid, message, isGroup) {
		var isGrpFlag = 0;
		if (isGroup) {
			isGrpFlag = 1;
		}
		else {
			receiverid = userDetails[receiverid].id;
		}
		
		var query = 'insert into chat_messages(sender_id, receiver_id, message, is_group) values ("' + 
			senderid + '", "' + receiverid + '", "' + message + '", "' + isGrpFlag + '")';
		DBHelper.connection.query(query, function(err, rows, fields) {
			if (!err)
				console.log('The solution is: ', rows);
			else
				console.log('Error while performing Query[' + err + "]");
		});
	},
	addNewUser: function(params, callback) {
		var query = 'insert into users(username, email, name, gender, phone, password, address, picture) values ("' + 
			params.username + '", "' + params.email + '", "' + params.name + '", "' + params.gender +
			'", "' + params.phone + '", "' + params.password + '", "' + params.address + '", "' + params.picture + '" )';
		console.info(query);
		DBHelper.connection.query(query, function(err, rows, fields) {
			
			var response = {};
			if (!err) {
				console.log('New user added : ', rows);
				response.status = "success";
			}
			else {
				console.log('Error while performing Query[' + err + "]");
				response.status = "error";
				response.errorMessage = err + "";
			}
			
			callback(response);
			
		});
	},
	loadChatHistory: function(userid, peerid, isgroup, callback) {
		
		var query = "";
		
		if (isgroup) {
			query = 'select * from chat_messages where (receiver_id = "' + peerid + '") and is_group=1 order by sending_time asc';
		}
		else {
			query = 'select * from chat_messages where (sender_id = "' + userid + '" and receiver_id = "' +
				userDetails[peerid].id + '") or (sender_id = "' + peerid + '" and receiver_id = "' + userDetails[userid].id + '") order by sending_time asc';
		}
		
		console.info(query);
		
		DBHelper.connection.query(query, function(err, rows, fields) {
			var response = {};
			response.peer_id = peerid;
			response.userid = userid;
			
			if (!err) {
				//console.log('New user added : ', rows);
				response.status = "success";
				var messages = [];
				
				for (var i = 0; i < rows.length; i++) {
					console.info("row id = " + rows[i].id);
				    messages.push({
				    	id: rows[i].id,
				    	sending_time: rows[i].sending_time,
				    	sender_id: rows[i].sender_id,
				    	senderDetail: userDetails[rows[i].sender_id],
				    	receiver_id: rows[i].receiver_id,
				    	msg: rows[i].message
				    });
				}
				console.info("Total messages = " + messages.length);
				response.messages = messages;
			}
			else {
				console.log('Error while performing Query[' + err + "]");
				response.status = "error";
				response.errorMessage = err + "";
			}
			
			callback(response);
		});
	},
	
	createNewGroup: function(listUsers, callback) {
		
		var query = 'insert into groups (description) values("")';
		console.info(query);
		
		DBHelper.connection.query(query, function(err, rows, fields) {
			var response = {};
			var users = [];
			for (var i = 0; i < listUsers.length; i++) {
				users.push(userDetails[listUsers[i]]);
			}
			
			response.group = {usersList : users};
			
			if (!err) {
				//console.log('New user added : ', rows);
				DBHelper.connection.query("select LAST_INSERT_ID()", function(err, rows, fields) {
					var groupid = rows[0]["LAST_INSERT_ID()"];
					console.info("group id = " + groupid);
					response.group.id = groupid;
					
					for (var i = 0; i < listUsers.length; i++) {
						var q = "insert into group_users(group_id, username) values('" + groupid + "', '" + listUsers[i] + "')";
						console.info(q);
						DBHelper.connection.query(q, function(err, rows, fields) {
							if (err) {
								console.info("error = " + err);
							}
						});
					}
					response.status = "success";
					callback(response);
				});
			}
			else {
				console.log('Error while performing Query[' + err + "]");
				response.status = "error";
				response.errorMessage = err + "";
				callback(response);
			}
			
			
		});
	},
	
	getGroupMembers: function(groupid, callback) {
		var query = 'select * from group_users where group_id=' + groupid;
		console.info(query);
		
		DBHelper.connection.query(query, function(err, rows, fields) {			
			var usernames = [];
			if (!err) {
				for (var i = 0; i < rows.length; i++) {
					usernames.push(userDetails[rows[i].username]);
				}
			}
			else {
				console.log('Error while performing Query[' + err + "]");
			}
			
			callback(usernames, groupid);
		});
	},
	
	loadUserGroups: function(username, callback) {
		var query = 'select distinct group_id from group_users where username="' + username + '"';
		console.info(query);
		
		DBHelper.connection.query(query, function(err, rows, fields) {			
			var groups = [];
			if (!err) {
				for (var i = 0; i < rows.length; i++) {
					var groupid = rows[i].group_id;
					
					DBHelper.getGroupMembers(groupid, function(users, groupid) {
						groups.push({
							id: groupid,
							usersList: users
						});
						
						if (groups.length == rows.length) {
							callback(groups);
							return;
						}
					});
				}
			}
			else {
				console.log('Error while performing Query[' + err + "]");
			}
			
			//callback([]);
		});
	},
	
	leaveGroup: function(groupid, username, callback) {
		var query = 'delete from group_users where username="' + username + '" and group_id=' + groupid;
		console.info(query);
		
		DBHelper.connection.query(query, function(err, rows, fields) {		
			var response = {
					groupid: groupid,
					username: username
			};
			if (!err) {
				response.status = "success";
			}
			else {
				response.status = "error";
				response.errorMessage = "" + err;
			}
			callback(response);
		});
	},
	
	getUserInfo: function(username, callback) {
		var query = 'select * from users where username="' + username + '"';
		console.info(query);
		
		DBHelper.connection.query(query, function(err, rows, fields) {		
			var user = {
				username: rows[0].username,
				email: rows[0].email,
				name: rows[0].name
			};
			callback(user);
		});
	},
	
	populateCache: function() {
		console.info("Populating cache");
		var query = 'select * from users';
		console.info(query);
		
		DBHelper.connection.query(query, function(err, rows, fields) {
			if (err){
				console.info("" + err);
			}
			else {
				for (var i = 0; i < rows.length; i++) {
					var user = {
						id: rows[i].id,
						username: rows[i].username,
						email: rows[i].email,
						name: rows[i].name,
						picture: rows[i].picture
					};
					userDetails[user.username] = user;
				}
				console.info("Cache populated");
			}
		});	
	},
	
	checkLogin: function(username, password, callback) {
		var query = "select * from users where username='" + username + "' and password='" + password + "'";
		console.info(query);
		DBHelper.connection.query(query, function(err, rows, fields) {
			if (err) {
				console.info("" + err);
			}
			else {
				callback(rows.length > 0 ? true: false);
			}
		});	
	},
	
	clearChatHistory: function(username, peerid, isGroup, callback) {
		var query = "";
		
		if (isGroup) {
			query = 'delete from chat_messages where (receiver_id = "' + peerid + '")';
		}
		else {
			query = 'delete from chat_messages where (sender_id = "' + username + '" and receiver_id = "' +
				userDetails[peerid].id + '") or (sender_id = "' + peerid + '" and receiver_id = "' + userDetails[username].id + '")';
		}
		DBHelper.connection.query(query, function(err, rows, fields) {
			var response = {
				username: username,
				peerid: peerid,
				isGroup: isGroup
			};
			if (!err) {
				response.status = "success";
			}
			else {
				console.log('Error while performing Query[' + err + "]");
				response.status = "error";
				response.errorMessage = "" + err;
			}
			callback(response);
		});
	}
};

DBHelper.connect();
DBHelper.populateCache();