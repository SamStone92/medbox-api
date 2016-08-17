var express = require("express");
var path = require("path");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var bodyParser = require('body-parser')

var CONTACTS_COLLECTION = "users";

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
// in latest body-parser use like below.
app.use(bodyParser.urlencoded({ extended: true }));

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

function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

app.get("/users", function(req, res) {
  db.collection(CONTACTS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.post("/users", function(req, res) {
  
  var serviceObject = req.body;
    console.log('Adding services: ' + JSON.stringify(serviceObject));
    db.collection('users', function(err, collection) {
        collection.insert(serviceObject, {safe:true}, function(err, result) {
            if (err) {
                res.send({'error':'An error has occurred'});
            } else {
                console.log('Success: ' + JSON.stringify(result[0]));
                console.log(req.body);
                res.send(result[0]);
            }
        });
    });
});

app.get("/users/", function(req, res) {
  var email = parseInt(req.query.email);
  db.collection(CONTACTS_COLLECTION).findOne({ email: email}, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      res.status(200).json(doc);
    }
  });
});

// exports.findAllInLocation = function(req, res) {
// 	var lat = parseInt(req.query.lat);
// 	var long = parseInt(req.query.long);

//     areas.collection('areas', function(err, collection) {
//         collection.find( { loc: { $geoWithin: { $centerSphere: [ [ lat, long ] ,
//          100 / 3963.2 ] } } } ).toArray(function(err, items) {
//             if(items.length == 0) {
//                   res.status(501).send('not implemented');
//             } else {
//                 db.collection('services', function(err, collection) {
//                     collection.find( { loc: { $geoWithin: { $centerSphere: [ [ lat, long ] ,
//                      100 / 3963.2 ] } } } ).toArray(function(err, items) {
//                         res.send(items);
//                     });
//                  });
//             }
//         });
//      });
// };

app.put("/users/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;

  db.collection(CONTACTS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update contact");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/users/:id", function(req, res) {
  db.collection(CONTACTS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete contact");
    } else {
      res.status(204).end();
    }
  });
});