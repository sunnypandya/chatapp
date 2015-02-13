duplicate_msg_possible = false;
//Handles the csrf_token for ajax posts, taken from:
// https://docs.djangoproject.com/en/dev/ref/contrib/csrf/

$(document).ajaxSend(function(event, xhr, settings) {
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    function sameOrigin(url) {
        // url could be relative or scheme relative or absolute
        var host = document.location.host; // host + port
        var protocol = document.location.protocol;
        var sr_origin = '//' + host;
        var origin = protocol + sr_origin;
        // Allow absolute or scheme relative URLs to same origin
        return (url == origin || url.slice(0, origin.length + 1) == origin + '/') ||
            (url == sr_origin || url.slice(0, sr_origin.length + 1) == sr_origin + '/') ||
            // or any other URL that isn't scheme relative or absolute i.e relative.
            !(/^(\/\/|http:|https:).*/.test(url));
    }
    function safeMethod(method) {
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }

    if (!safeMethod(settings.type) && sameOrigin(settings.url)) {
        xhr.setRequestHeader("X-CSRFToken", getCookie('csrftoken'));
    }
});

// Chat client code.


// Keep track of the last message received (to avoid receiving the same message several times).
// This global variable is updated every time a new message is received.
var timestamp = 0;

// URL to contact to get updates.
var url = null;

// How often to call updates (in milliseconds)
var CallInterval = 8000;
// ID of the function called at regular intervals.
var IntervalID = 0;

// A callback function to be called to further process each response.
var prCallback = null;

function callServer(obj){
  alert('callServer called');
        if (obj.timestamp == 0) {return;};
  // At each call to the server we pass data.
  $.get(obj.url, // the url to call.
      {time: obj.timestamp}, // the data to send in the GET request.
      function(payload) { // callback function to be called after the GET is completed.
                                                  console.log(payload);
                                                  processResponse(payload, obj);
              },
      'json'
        ).fail(function( jqXHR, textStatus, errorThrown ){
            console.log(errorThrown);
            console.log(jqXHR);
            clearInterval(obj.IntervalID);
        });
  };

function processResponse(payload, obj) {
  // if no new messages, return.
  if(payload.status == 0) {};
  // Get the timestamp, store it in global variable to be passed to the server on next call.
  obj.timestamp = payload.time;
  for(message in payload.messages) {
              $('#chat-window-container').find('#chatwindow').append('<p>'+payload.messages[message].text.replace(BREAK_LINE_REPLACE,'<br/>')+'</p>');
  }
        // Populate the room members window
        //$("#memberswindow").html("")
        for(member in payload.members) {
                //$("#memberswindow").append('<strong>'+payload.members[member].username+'</strong><br />');
        }

  // Scroll down if messages fill up the div.
  var chatDiv = document.getElementById("chatwindow");
  chatDiv.scrollTop = chatDiv.scrollHeight;

        // Scroll down if members fill up the div.
        //var membDiv = document.getElementById("memberswindow");
  //membDiv.scrollTop = membDiv.scrollHeight;

  // Handle custom data (data other than messages).
  // This is only called if a callback function has been specified.
  if(prCallback != null) prCallback(payload, obj);
}

function InitChatWindow(ChatMessagesUrl, ProcessResponseCallback, obj){
/**   The args to provide are:
  - the URL to call for AJAX calls.
  - A callback function that handles any data in the JSON payload other than the basic messages.
    For example, it is used in the example below to handle changes to the room's description. */

  $("#loading").remove(); // Remove the dummy 'loading' message.

  // Push the calling args into global variables so that they can be accessed from any function.
  url = ChatMessagesUrl;
  prCallback = ProcessResponseCallback;

  // Read new messages from the server every X milliseconds.
  obj.IntervalID = setInterval(function(){
          callServer(obj); 
        }, CallInterval);

  // The above will trigger the first call only after X milliseconds; so we
  // manually trigger an immediate call.
  if (!duplicate_msg_possible) {
                duplicate_msg_possible = false;
                callServer(obj);        
       }
  // Process messages input by the user & send them to the server.
  $("#chatform").submit(function(){
    // If user clicks to send a message on a empty message box, then don't do anything.
    if($("#msg").val().trim() == "") return false;

    // We don't want to post a call at the same time as the regular message update call,
    // so cancel that first.
    clearInterval(obj.IntervalID);

    $.post(obj.url,
        {
                            csrfmiddlewaretoken: csrf_token,
        time: obj.timestamp,
        action: "postmsg",
        message: $("#msg").val().trim().replace(/(?:\r\n|\r|\n)/g, BREAK_LINE_REPLACE),
              },
              function(payload) {
                    $("#msg").val(""); // clean out contents of input field.
                    // Calls to the server always return the latest messages, so display them.
                    processResponse(payload, obj);
        },
            'json'
        );
        
        // Start calling the server again at regular intervals.
        obj.IntervalID = setInterval(function(){
                callServer(obj); 
              }, CallInterval);
    return false;
  });


} // End InitChatWindow

/** This code below is an example of how to extend the chat system.
 * It's used in the second example chat window and allows us to manage a user-updatable
 * description field.
 *  */

// Callback function, processes extra data sent in server responses.
function HandleRoomDescription(payload) {
  $("#chatroom_description").text(payload.description);
}
/*
function InitChatDescription(){

  $("form#chatroom_description_form").submit(function(){
    // If user clicks to send a message on a empty message box, then don't do anything.
    if($("#id_description").val() == "") return false;
    // We don't want to post a call at the same time as the regular message update call,
    // so cancel that first.
    clearInterval(IntervalID);
    $.post(url,
        {
        time: timestamp,
        action: "change_description",
        description: $("#id_description").val()
              },
              function(payload) {
                    $("#id_description").val(""); // clean out contents of input field.
                    // Calls to the server always return the latest messages, so display them.
                    processResponse(payload);
                    },
            'json'
        );
        // Start calling the server again at regular intervals.
        IntervalID = setInterval(callServer, CallInterval);
    return false;
  });

}*/

// Join leave section
function room_join(obj) {
    clearInterval(obj.IntervalID);
    //login_timestamp = +new Date / 1000;
    $.post(obj.url,{time: obj.timestamp, csrfmiddlewaretoken: csrf_token, action: "room_join"}, function(payload) {processResponse(payload, obj);}, 'json');
    /*obj.IntervalID = setInterval(function(){
      callServer(obj); 
    }, CallInterval);*/
}

function room_leave(obj) {
    clearInterval(obj.IntervalID);
    //login_timestamp = +new Date / 1000;
    $.post(obj.url,{time: obj.timestamp, csrfmiddlewaretoken: csrf_token, action: "room_leave"}, function(payload) {processResponse(payload, obj);}, 'json');
    /*obj.IntervalID = setInterval(function(){
      callServer(obj); 
    }, CallInterval);*/
}

//$(window).load(function(){room_join()});
$(window).unload(function(){
  //room_leave();
});