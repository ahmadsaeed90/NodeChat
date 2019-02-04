# NodeChat

1. Install node.js and mysql
2. Open terminal and navigate to Web Content Folder
3. enter "npm install" and press enter.
4. This will read package.json and download all the dependencies on your machine
5. Install mysql, if you havent done already
6. Open schema.sql and run all queries on your machine
7. Open server.js and go to the below section:

var Config = {
		dburl: "localhost",
		dbuser: "root",
		dbpassword: "",
		dbname: "chat_application",
		allowedPictureExtensions: ["png", "jpg", "gif"]
};

Edit db user and password according to your database user.


7. On the terminal write "node server.js"
8. Server will run and print few statements like "Populating Cache"
9. Open brower and enter "localhost:3000". If it redirects to login page, this means all is well.
10. Sign up and login and enjoy the chat!!
