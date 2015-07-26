(function() {

	var $chatArea = $('#chat-area'),
		$messageForm = $('#send-message'),
		$messageArea = $('#message'),
		$submitButton = $('#submitButton'),
		$setUserName = $('#setUserName'),
		$userName = $('#userName'),
		$saveName = $('#saveName'),
		$nickError = $('#nickError'),
		$userList = $('#userList'),
		socket = io.connect();

		$setUserName.submit(function(e) {
			e.preventDefault();
			socket.emit('new guest', $userName.val(), function(data) {
				if(data.isValid) {
					$('#newUser').hide();
					$('#chatContainer')
						.fadeIn(500)
						.addClass('chatLayout');
				} else {
					$nickError.fadeIn(500);
					$userName.focus();
				}
			});
			$userName.val('');
		});

		$messageForm.submit(function(e) {
			e.preventDefault();
			socket.emit('send message', $messageArea.val(), function(data) {
				$chatArea.append(data + '<br/>');
			});
			$messageArea.val('');
		});

		socket.on('new message', function(data) {
			$chatArea.append(data.username + ': ' + data.msg + '<br/>');
		});

		socket.on('users', function(data) {
			$userList.empty();
			for (var i=0; i<data.length; i+=1) {
				$userList.append($('<li>' + data[i] + '</li>'));
			}
		}); 

		socket.on('private msg', function(data) {
			$chatArea.append(data.username + ': ' + data.msg + '<br/>');
		});
})();