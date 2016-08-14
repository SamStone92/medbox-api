var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;

var CONTACTS_COLLECTION = "contacts";

var app = express();
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.json());

// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Connect to the database before starting the application server.
mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  // Save database object from the callback for reuse.
  db = database;
  console.log("Database connection ready");

  // Initialize the app.
  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

exports.findAllInLocation = function(req, res) {
	var lat = parseInt(req.query.lat);
	var long = parseInt(req.query.long);

    areas.collection('areas', function(err, collection) {
        collection.find( { loc: { $geoWithin: { $centerSphere: [ [ lat, long ] ,
         100 / 3963.2 ] } } } ).toArray(function(err, items) {
            if(items.length == 0) {
                  res.status(501).send('not implemented');
            } else {
                db.collection('services', function(err, collection) {
                    collection.find( { loc: { $geoWithin: { $centerSphere: [ [ lat, long ] ,
                     100 / 3963.2 ] } } } ).toArray(function(err, items) {
                        res.send(items);
                    });
                 });
            }
        });
     });
};


exports.addUser = function(req, res) {
    console.log("got this far");
  var newContact = req.body;
  newContact.createDate = new Date();

  if (!(req.body.firstName || req.body.lastName)) {
    console.log(err.message);
  }

  db.collection(CONTACTS_COLLECTION).insertOne(newContact, function(err, doc) {
    if (err) {
      console.log(err.message);
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
}







