var express = require('express'),
	bodyParser = require('body-parser'),
	socketio = require('socket.io'),
	mongoose = require('mongoose'),
	app = express();

var server = app.listen(8080);
var io = socketio.listen(server);

mongoose.connect('mongodb://localhost/chat');

var chatSchema = mongoose.Schema({
	username: String,
	msg: String,
	created: {
		type: Date,
		default: Date.now
	}
});

var Chat = mongoose.model('Message', chatSchema);

var chatUsers = {};

var staticDir = __dirname + '/public';
app.use(express.static(staticDir));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', function( req, res ) {
	res.sendFile(staticDir + 'index.html');
});

io.on('connection', function(socket) {

	socket.on('new guest', function(user, callback) {
		if (user in chatUsers) {
			callback({ isValid: false });
		} else {
			callback({ isValid: true });
			socket.userName = user;
			chatUsers[socket.userName] = socket;
			updateUsers();
		}
	});

	socket.on('send message', function(data, callback) {

		var msg = data.trim();
		if (msg.substr(0, 3) === '/w ') {
			msg = msg.substr(3);
			var index = msg.indexOf(' ');

			if (index !== -1) {
				var name = msg.substr(0, index);
				var message = msg.substr(index + 1);

				if (name in chatUsers) {
					chatUsers[name].emit('private msg', { msg: message, username: socket.userName });
				} else {
					callback('Error: enter a valid user');
				}
			} else {
				callback("Error: you didn't add the message");
			}
		} else {
			var newMessage = new Chat({ msg: data, username: socket.userName } );
			newMessage.save(function(error) {
				if (error) throw error;
				io.emit('new message', { msg: data, username: socket.userName });
			});
		}
	});

	socket.on('disconnect', function(data) {
		if (!socket.userName) {
			return;
		}
		delete chatUsers[socket.userName];
		updateUsers();
	});

	function updateUsers() {
		io.emit('users', Object.keys(chatUsers));
	}

});