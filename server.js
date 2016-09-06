var express = require("express");
var path = require("path");
var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var bodyParser = require('body-parser')
var schedule = require('node-schedule');
var passport = require('passport');
var apn = require('apn');
var FacebookStrategy = require('passport-facebook').Strategy;
var FacebookTokenStrategy = require('passport-facebook-token');
var mongoose = require('mongoose'),Schema = mongoose.Schema;
mongoose.connect(process.env.MONGODB_URI);
var USERS_COLLECTION = "users";
var MED_COLLECTION = "medication";
var MED_TAKEN_COLLECTION = "medicationToTake";
var NOTIFICATION_SCHEDULE = "notificationSchedules";

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(passport.initialize());
app.use(passport.session());

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
   var server = app.listen(process.env.PORT || 8080, function () {
    var port = server.address().port;
    console.log("App now running on port", port);
  });
});

passport.use('facebook-token', new FacebookTokenStrategy({
    clientID        : 1002975379818961,
    clientSecret    : "f7ee558cd10d02f00e548235fa2e85f1"
  },
  function(accessToken, refreshToken, profile, done) {
    return done(null, profile);
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});


var options = {"production": false, "passphrase": "Blobsrule56"};
var apnConnection = new apn.Connection(options);

var myDevice = new apn.Device("0046971e6a811fdab29f56238e2669f01f2bd49826603b136860e4ebd9072f62");
var note = new apn.Notification();

note.badge = 3;
note.sound = "ping.aiff";
note.alert = "You have a new message";
note.payload = {'messageFrom': 'Caroline'};



function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
}

var j = schedule.scheduleJob('*/1 * * * *', function(){
  moveMedication_cron();
  notification_cron();
});

function moveMedication_cron(){
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
                  var now = new Date();
                  now.setHours(0,0,0,0);
                  med.date = now.toISOString();
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

function parseIsoDatetime(dtstr) {
    var dt = dtstr.split(/[: T-]/).map(parseFloat);
    return new Date(dt[0], dt[1] - 1, dt[2], dt[3] || 0, dt[4] || 0, dt[5] || 0, 0);
}

var user_email;
var user_schedule;
function notification_cron(){
  db.collection(USERS_COLLECTION).find({}).toArray(function(err, users) {
    if (err) {
      handleError(res, err.message, "Failed to get contact");
    } else {
      for (i = 0; i < users.length; i++) { 
        user_email = users[i].email;
        db.collection(NOTIFICATION_SCHEDULE).findOne({ user: user_email }, function(err, muserSchedule) {
                  if (err) {
                    handleError(res, err.message, "Failed to get contact");
                  } else {
                      var newObject = JSON.stringify(muserSchedule);
                      user_schedule = JSON.parse(newObject);
                      db.collection(MED_COLLECTION).find({user: user_email}).toArray(function(err, medication) {
                         if (err) {
                            handleError(res, err.message, "Failed to get contact");
                          } else {

                            for (var i = 0; i = user_schedule.reminders.length - 1; i++) {
                             var date = new Date(user_schedule.reminders[i]);
                             date.setSeconds(0);
                             var now = new Date();
                             var n = now.toISOString();

                             if (n == date){
                              var index = i;
                              for (var i = medication.length - 1; i >= results.length-1; i++) {
                                if(index == results[i].time){
                                  apnConnection.pushNotification(note, myDevice);
                                }
                              }
                             } else {
                              console.log(n + "-" +date);
                             }
                            }
                          }
                      });

                  }
                });

        
      }
    }
  });
}


var notificationSchedule = { 
            user: "",
            reminders: ["2014-03-12T08:00:00+00:00", "2014-03-12T13:37:27+00:00","2014-03-12T13:37:27+00:00", "2014-03-12T13:37:27+00:00" ]
        }; 

/* Authentication for logging in */

app.post('/auth/facebook/token', passport.authenticate(['facebook-token']), 
        function (req, res) {

            if (req.user){
                //you're authenticated! return sensitive secret information here.
                res.send(200);
            } else {
                // not authenticated. go away.
                res.send(401)
            }

        }
);



/*  THE PART FOR USERS */

app.post("/users", passport.authenticate(['facebook-token']), 
        function (req, res) {
            if (req.user){
              var newUser = req.body;
              var email = req.body.email;
              newUser.createDate = new Date();
              db.collection(USERS_COLLECTION).insertOne(newUser, function(err, doc) {
                if (err) {
                  handleError(res, err.message, "Failed to create new contact.");
                } else {
                    res.status(201).json(doc.ops[0]);
                    addNotificationSchedule(newUser.email);
                 }
              });
            } else {
              res.send(401)
            }
        }
);

function addNotificationSchedule(email){
   notificationSchedule.user = email;
                 db.collection(NOTIFICATION_SCHEDULE).insertOne(notificationSchedule, function(err, doc) {
                   if (err) {
                      handleError(res, err.message, "Failed to create new contact.");
                    } else {
                     res.status(201);
                   }
                 });
}

app.get("/users", passport.authenticate(['facebook-token']), 
        function (req, res) {
            if (req.user){
                db.collection(USERS_COLLECTION).find({}).toArray(function(err, docs) {
                    if (err) {
                      handleError(res, err.message, "Failed to get contacts.");
                    } else {
                      res.status(200).json(docs);
                    }
                  });
            } else {
                // not authenticated. go away.
                res.send(401)
            }

        }
);
  


app.get("/users/:id", passport.authenticate(['facebook-token']), 
        function (req, res) {

            if (req.user){
                db.collection(USERS_COLLECTION).findOne({ email: req.params.id }, function(err, doc) {
                  if (err) {
                    handleError(res, err.message, "Failed to get contact");
                  } else {
                    res.status(200).json(doc);
                  }
                });
            } else {
                // not authenticated. go away.
                res.send(401)
            }

        }
 
);

app.put("/users/:id", passport.authenticate(['facebook-token']), 
        function (req, res) {

            if (req.user){
                var updateDoc = req.body;
                db.collection(USERS_COLLECTION).updateOne({email: req.params.id }, updateDoc, function(err, doc) {
                  if (err) {
                    handleError(res, err.message, "Failed to update contact");
                  } else {
                    res.status(204).end();
                  }
                });
            } else {
                // not authenticated. go away.
                res.send(401)
            }

        }

);

app.delete("/users/:id", passport.authenticate(['facebook-token']), 
        function (req, res) {
            if (req.user){
                db.collection(USERS_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
                  if (err) {
                    handleError(res, err.message, "Failed to delete contact");
                  } else {
                    res.status(204).end();
                  }
                });
            } else {
                // not authenticated. go away.
                res.send(401)
            }
        }
);

/*  THE PART FOR MEDICATION */

app.post("/medication", passport.authenticate(['facebook-token']), 
        function (req, res) {
            if (req.user){
                var newUser = req.body;
                newUser.createDate = new Date();
                
                db.collection(MED_COLLECTION).insertOne(newUser, function(err, doc) {
                  if (err) {
                    handleError(res, err.message, "Failed to create new contact.");
                  } else {
                    res.status(201).json(doc.ops[0]);
                  }
                });
            } else {
                // not authenticated. go away.
                res.send(401)
            }
        }
);

app.get("/medication", passport.authenticate(['facebook-token']), 
        function (req, res) {
            if (req.user){
                db.collection(MED_COLLECTION).find({}).toArray(function(err, docs) {
                  if (err) {
                    handleError(res, err.message, "Failed to get contacts.");
                  } else {
                    res.status(200).json(docs);
                  }
                });
            } else {
                // not authenticated. go away.
                res.send(401)
            }
        }
);

app.get("/medicationForId/:id", passport.authenticate(['facebook-token']), 
        function (req, res) {

            if (req.user){
                db.collection(MED_COLLECTION).findOne({ _id: new ObjectID(req.params.id)}, function(err, doc) {
                  if (err) {
                    handleError(res, err.message, "Failed to get contact");
                  } else {
                    res.status(200).json(doc);
                  }
                });
            } else {
                res.send(401)
            }
        }
);

app.get("/medicationForUser/:id", passport.authenticate(['facebook-token']), 
        function (req, res) {
            if (req.user){
                db.collection(MED_COLLECTION).find({ user: req.params.id }).toArray(function(err, doc) {
                  if (err) {
                    handleError(res, err.message, "Failed to get contact");
                  } else {
                    res.status(200).json(doc);
                  }
                });
            } else {
                // not authenticated. go away.
                res.send(401)
            }
        }
);

app.get("/medicationForDate", passport.authenticate(['facebook-token']), 
        function (req, res) {
            if (req.user){
                var email = req.query.email;
                var date = req.query.date;

                db.collection(MED_TAKEN_COLLECTION).find({ user:email, date:date }).toArray(function(err, doc) {
                  if (err) {
                    handleError(res, err.message, "Failed to get contact");
                  } else {
                    res.status(200).json(doc);
                  }
                });
            } else {
                res.send(401)
            }
        }
);

app.put("/medication/:id", passport.authenticate(['facebook-token']), 
        function (req, res) {
            if (req.user){
                var updateDoc = req.body;
                delete updateDoc._id;
                db.collection(MED_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
                  if (err) {
                    handleError(res, err.message, "Failed to update contact");
                  } else {
                    res.status(204).end();
                  }
                });
            } else {
                res.send(401)
            }
        }
);

app.delete("/users/:id", passport.authenticate(['facebook-token']), 
        function (req, res) {
            if (req.user){
                db.collection(MED_COLLECTION).deleteOne({_id: new ObjectID(req.params.id)}, function(err, result) {
                  if (err) {
                    handleError(res, err.message, "Failed to delete contact");
                  } else {
                    res.status(204).end();
                  }
                });
            } else {
                res.send(401)
            }
        }
);

/*Notification schedule calls */

app.get("/remindersForUser/:id", passport.authenticate(['facebook-token']), 
     function (req, res) {
          if (req.user){
                db.collection(NOTIFICATION_SCHEDULE).findOne({ user: req.params.id }, function(err, doc) {
                  if (err) {
                    handleError(res, err.message, "Failed to get contact");
                  } else {
                    res.status(200).json(doc);
                  }
                });
            } else {
                res.send(401)
            }
        }
);

app.put("/reminders/:id", passport.authenticate(['facebook-token']), 
        function (req, res) {
            if (req.user){
                var schedule = req.body;
                delete schedule._id;

                db.collection(NOTIFICATION_SCHEDULE).updateOne({user: req.params.id }, schedule, function(err, doc) {
                  if (err) {
                    handleError(res, err.message, "Failed to update contact");
                  } else {
                    res.status(204).end();
                  }
                });
            } else {
                res.send(401)
            }

        }
);




