drop table if exists group_users;
drop table if exists groups;
drop table if exists chat_messages;
drop table if exists users;

CREATE TABLE users (
	id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
	username VARCHAR(100) unique,
	email VARCHAR(100),
	name VARCHAR(100),
	gender CHAR(1),
	phone VARCHAR(100),
	password VARCHAR(100),
	address VARCHAR(100),
	picture varchar(100)
);

CREATE TABLE chat_messages (
	id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
	sender_id VARCHAR(100),
	receiver_id int,
	message text not null,
	is_group int not null,
	sending_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (SENDER_ID) REFERENCES USERS (USERNAME)
);

create table groups (
	id int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY,
	description varchar(100)
);

create table group_users (
	group_id int(11),
	username varchar(100),
	FOREIGN KEY (group_id) REFERENCES groups (id),
	FOREIGN KEY (username) REFERENCES users (username)
);