
var express = require("express");
var path = require("path");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var bodyParser = require('body-parser')

var CONTACTS_COLLECTION = "contacts";

var db;

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));

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


exports.getUser = function(req, res) {
	var email = req.query.email;
  	db.collection(CONTACTS_COLLECTION).findOne({ email: email}, function(err, doc) {
    	if (err) {
      		handleError(res, err.message, "Failed to get contact");
    	} else {
      		res.status(200).json(doc);
    	}
  	});
};




