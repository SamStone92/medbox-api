var express = require("express");
var path = require("path");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var bodyParser = require('body-parser')
var schedule = require('node-schedule');

var USERS_COLLECTION = "users";
var MED_COLLECTION = "medication";
var MED_TAKEN_COLLECTION = "medicationToTake";

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

var db;

mongodb.MongoClient.connect(process.env.MONGODB_URI, function (err, database) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  db = database;
  console.log("Database connection ready");

  var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}


 
var j = schedule.scheduleJob('*/1 * * * *', function(){
  cronJob();
});

function cronJob(){

  db.collection(USERS_COLLECTION).find({}).toArray(function(err, results) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      for (i = 0; i < results.length; i++) { 
        db.collection(MED_COLLECTION).find({user: results[i].email}).toArray(function(err, results) {
           if (err) {
              handleError(res, err.message, "Failed to get contact");
            } else {
                for (i = 0; i < results.length; i++) { 
                  var med = results[i];
                  delete med["_id"];
                  var date = new Date();
                  date.setUTCDate();
                  date.setHours(0,0,0,0);
                  med.date = date.toISOString();
                  med.taken = false;

                  db.collection(MED_TAKEN_COLLECTION).insertOne(med, function(err, doc) {
                 });

                }
            }
        });
      }
    }
  });
}

/*  THE PART FOR USERS */

app.post("/users", function(req, res) {
  var newUser = req.body;
  newUser.createDate = new Date();
  
  db.collection(USERS_COLLECTION).insertOne(newUser, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new contact.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

app.get("/users", function(req, res) {
  db.collection(USERS_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get("/users/:id", function(req, res) {
  db.collection(USERS_COLLECTION).findOne({ email: req.params.id }, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/users/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;
  db.collection(USERS_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update contact");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/users/:id", function(req, res) {
  db.collection(USERS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete contact");
    } else {
      res.status(204).end();
    }
  });
});

/*  THE PART FOR MEDICATION */

app.post("/medication", function(req, res) {
  var newUser = req.body;
  newUser.createDate = new Date();
  
  db.collection(MED_COLLECTION).insertOne(newUser, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to create new contact.");
    } else {
      res.status(201).json(doc.ops[0]);
    }
  });
});

app.get("/medication", function(req, res) {
  db.collection(MED_COLLECTION).find({}).toArray(function(err, docs) {
    if (err) {
      handleError(res, err.message, "Failed to get contacts.");
    } else {
      res.status(200).json(docs);
    }
  });
});

app.get("/medicationForId/:id", function(req, res) {
  db.collection(MED_COLLECTION).findOne({ _id: new ObjectID(req.params.id)}, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.get("/medicationForUser/:id", function(req, res) {
  db.collection(MED_COLLECTION).find({ user: req.params.id }).toArray(function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.get("/medicationForDate", function(req, res) {
  var email = req.query.email;
  var date = req.query.date;

  db.collection(MED_TAKEN_COLLECTION).find({ user:email, date:date }).toArray(function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      res.status(200).json(doc);
    }
  });
});

app.put("/medication/:id", function(req, res) {
  var updateDoc = req.body;
  delete updateDoc._id;
  db.collection(MED_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
    if (err) {
      handleError(res, err.message, "Failed to update contact");
    } else {
      res.status(204).end();
    }
  });
});

app.delete("/users/:id", function(req, res) {
  db.collection(MED_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
    if (err) {
      handleError(res, err.message, "Failed to delete contact");
    } else {
      res.status(204).end();
    }
  });
});
