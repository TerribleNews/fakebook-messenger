var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var request = require('request');
var FormData = require('form-data');
var https = require('http');

var bodyParser = require('body-parser');

app.use(bodyParser.json()); // for parsing application/json

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

app.post('/fakebook', function(req, res){
  console.log('Received request from chat server');
  console.log(req.body);
  io.emit('chat message', req.body.message.text);
  res.json({'recipient_id':'bonk', 'message_id':'mid.bonk1234'});
  res.end();
});

io.on('connection', function(socket) {
  console.log('a user connected');
  socket.on('chat message', function(msg){
    var formData = {
      "object":"page",
      "entry":[
        {
          "id":"PAGE_ID",
          "time":123456789,
          "messaging":[
            {
              "sender":{
                "id":"USER_ID"
              },
              "recipient":{
                "id":"PAGE_ID"
              },
              "message": {
                "text": msg
              }
            }
          ]
        }
      ]
    };

    var options =
    {
      // hostname: 'graph.facebook.com',
      // path: '/v2.6/me/messages?debug=all&access_token=' + keys.pageAccessToken,
      hostname: 'localhost',
      port: 8080,
      path: '/fbhook',
      method: 'POST',
      headers:
      {
        'Content-Type': 'application/json; charset=UTF-8'
      }
    };

    var req = https.request(options, function(res)
    {
      console.log('STATUS: ' + res.statusCode);
      console.log('HEADERS: ' + JSON.stringify(res.headers));
      res.setEncoding('utf8');
      res.on('data', function(chunk)
      {
        console.log('BODY: ' + chunk);
      });
      res.on('end', function()
      {
        console.log('No more data in response.')
      })
    });

    req.on('error', function(e)
    {
      console.log('problem with request:' + e.message);
    });

    console.log('Received message');
    var postData = JSON.stringify(formData);
    // write data to request body
    console.log('Sending data (length: ' + postData.length + '): ' + postData);
    req.write(postData);
    req.end();

  });
  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
