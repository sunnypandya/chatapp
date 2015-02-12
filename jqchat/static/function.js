duplicate_msg_possible = false;
$('#user-list li a').click(function(){

	var user_id = $(this).attr('data-id');
	var username = $(this).text().trim();
	$.ajax({
		url: '/getchatroom/',
		type: 'GET',
		data: {'friend_id': user_id},
		beforeSend: function(){

		},
		dataType: 'json',
		success: function(data){
			duplicate_msg_possible = false;
			makeChatClone(data, user_id, username);
		}
	});
});

function makeChatClone(data, user_id, username){
	if ($('#chat-frame-'+data.room).length > 0) {
		return false;
	};
	var push_flag = true;
	var temp = $('#chat-frame-container-clone').clone();
	temp.attr('data-id', data.room);
	$('#right-panel').append( temp );
	temp.attr('id', 'chat-frame-'+data.room);
	temp.find('#chatwindow').attr('id', 'chatwindow-'+data.room).addClass('chatwindow-class');
	temp.find('#chatform').attr('id', 'chatform-'+data.room).addClass('chatform-class');
	temp.find('#msg').attr('id', 'msg-'+data.room).addClass('msg-class');
	temp.find('.members-list').text(username);
	temp.find('.chat-show').show();
	url = "/chat/room/"+data.room+"/ajax/";
	var object = {};
	object['url'] = url;
	object['IntervalID'] = 0;
	object['room'] = data.room;
	object['partners'] = user_id;
	for (var i = 0; i < GLOBALS.length; i++) {
		if(GLOBALS[i].room == object.room){
			push_flag = false;
			break;
		}
	}
	if (push_flag) {
		GLOBALS.push(object);
	};
	room_join(object);
	InitChatWindow(url, null, object);
}

var long_polling = setInterval(function(){
	$.get('/chat/getchats/', // the url to call.
		{login_timestamp: login_timestamp}, // the data to send in the GET request.
		function(payload) { // callback function to be called after the GET is completed.
			for(object in payload.rooms){
				var object = payload.rooms[object];
				duplicate_msg_possible = true;
				makeChatClone(object, object.partners, object.partners_name);
				login_timestamp = +new Date / 1000;
			}              
		},
	'json'
	).fail(function(){
		clearInterval(long_polling);
	});
}, 10000);

$(document).on('click', '.close-chat', function(){
	var id = $(this).closest('.chat-frame-container').attr('data-id');
	var object = null;
	for(obj in GLOBALS){
		if (GLOBALS[obj].room == id) {
			object = GLOBALS[obj];
			break;
		}
	}
	room_leave(object);
	login_timestamp = +new Date / 1000;
	$('#chat-frame-'+object.room).remove();
});

$('#group_chat_form').submit(function(){
	var users = $('#group_friend_list').val().split(",");
	for (var i = 0; i < users.length; i++) {
		if (users[i] == "" || users[i] == " ") {
			//splice args: index, howmany
			users.splice(i, 1);
			continue;
		};
		users[i] = users[i].trim();
	}
	if (users.length < 2) {
		alert('Please enter atleast two users to create group chat');
		return false;
	}
	$.get('/check_user_list/', // the url to call.
		{users: users}, // the data to send in the GET request.
		function(payload) { // callback function to be called after the GET is completed.
			var active_users = payload.active_users;
			var inactive_users = payload.inactive_users;
			/* what if there are inactive users ???*/
			if (active_users.length < 2) {
				alert('Please, it seems there is/are invalid users. \nEnter valid users.');
				return false;
			}
			if (inactive_users.length > 0) {
				console.log(inactive_users.toString());
			}
			$.post('/chat/create_group/', 
				{members: active_users}, 
				function(payload){
					var room = payload.room;
					window.location.href = '/chat/room/'+room+'/';
				},
				'json'
			);
		},
	'json'
	).fail(function(){
		clearInterval(long_polling);
	});
	return false;
});