var app = require('express')();
var http = require('http')
var server = http.Server(app);
var io = require('socket.io')(server);
var request = require('request');
var https = require('https');
var bodyParser = require('body-parser');
var mongo = require('./database');
var mustache = require('mustache');
var engines = require('consolidate');
var fs = require('fs');

app.use(bodyParser.json()); // for parsing application/json
app.set('views', __dirname + '/views');
app.engine('html', engines.mustache);
app.set('view engine', 'html');

app.get('/', function(req, res){
  res.render('index.html', {
    locals: {},
    partials: {}
  });
});

var fakebook = https.createServer({
  key:  fs.readFileSync('./server.key'),
  cert: fs.readFileSync('./server.crt'),
  ca:   fs.readFileSync('./ca.crt'),
  requestCert: true,
  rejectUnauthorized: false
}, app).listen('3443', function() {
  console.log("Secure Express server listen ing on port 3443");
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
    console.log("Searching for user with id ", msg.user_id);
    mongo.userCollection.findOne({user_id:msg.user_id}, function(err,user) {

      if (err) {
        console.log("Something went wrong finding user.");
      }

      if (user == null) {
        // create a new record
        user = mongo.userCollection.insert({user_id:msg.user_id}, function(err,result){
          if (err) {
            console.log("Unable to create user:", err);
          } else {
            console.log("Created user: ", result);
          }
        });
      }

      console.log("Found user ", user);

      var formData = {
        "object":"page",
        "entry":[
          {
            "id":"PAGE_ID",
            "time":123456789,
            "messaging":[
              {
                "sender":{
                  "id":msg.user_id
                },
                "recipient":{
                  "id":"PAGE_ID"
                },
                "message": {
                  "text": msg.message
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

      var msg_rec = mongo.messageCollection.insert({user: user, message: formData.entry[0].messaging}, function(err,res){
        if (err)
        {
          console.log("Unable to insert message into db:", err);
        }
        else
        {
          console.log("Inserted message into db:", res);
        }
      });

      var req = http.request(options, function(res)
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

      console.log('Received message: ', msg);
      var postData = JSON.stringify(formData);
      // write data to request body
      console.log('Sending data (length: ' + postData.length + '): ' + postData);
      req.write(postData);
      req.end();

    });
  });
  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
});



server.listen(3000, function() {
  console.log('listening on *:3000');
});
