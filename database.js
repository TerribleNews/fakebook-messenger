var mongo = require('mongodb'),
Server = mongo.Server,
Db = mongo.Db;

var server = new Server('localhost', 3303, {auto_reconnect: true});
var db = new Db('exampleDb', server);

// This code should probably all go into another module or something
db.open(function(err, db) {
  if(!err) {
    console.log("We are connected");
  } else {
    console.log("Unable to open database connection.");
    process.exit(-1);
  }
});

var userCollection = db.collection('users', function(err,collectionref) {
  if (err)
  console.log("Error getting users collecdtion:", err);
});

var messageCollection = db.collection('messages', function(err, collectionref){
  if (err)
  console.log("Error gettign messages collection:", err);
});

exports.userCollection = userCollection;
exports.messageCollection = messageCollection;
