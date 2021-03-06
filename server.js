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

function compareDates(date1, date2){
  var seconds = date1.getSeconds() == date2.getSeconds();
  var minutes = date1.getMinutes() == date2.getMinutes();

  var hours = date1.getHours() == date2.getHours();
    
  return seconds && minutes && hours;
}

function notification_cron(){
  db.collection(NOTIFICATION_SCHEDULE).find({}).toArray(function(err, schedules) {
      var schedule;
      for (schedule in schedules) {
        var reminder;
        var userSchedule = schedules[schedule].reminders
          for (reminder in userSchedule){
            var now = new Date();
            var userDate = new Date(userSchedule[reminder]);
            if(compareDates(now, userDate)){
              checkIfMedicationForTime(parseInt(reminder)+1, schedules[schedule].user);
            } else {
              console.log(now + " " + userDate);
            }
          }
      }
    }
  );
}

function checkIfMedicationForTime(userTime, email){

  db.collection(MED_COLLECTION).findOne({ time: String(userTime), user : email}, function(err, doc) {
    console.log(email + " doc: " +userTime);
      if(doc != null){
        db.collection(USERS_COLLECTION).findOne({ email: email}, function(err, user) {
              console.log(user);

            if(user != null){
              console.log(user.UUID);
              console.log("sned this motherfucker");
              var options = {"production": false, "passphrase": "Blobsrule56"};
              var apnConnection = new apn.Connection(options);
              var myDevice = new apn.Device(user.UUID);
              var note = new apn.Notification();

              note.sound = "ping.aiff";
              note.alert = "It's time to take your " + getDayType(userTime) + " medication."

              apnConnection.pushNotification(note, myDevice);
            }
          }
        );
      }
    }
  );        
}

function getDayType(dayInt){
  switch(dayInt){
    case 1:
      return "morning";
      break;
    case 2:
      return "afternoon";
      break;
    case 3:
      return "evening";
      break;
    case 4:
      return "night";
      break;
    default:
      return "";
  }
}

var notificationSchedule = { 
            user: "",
            reminders: ["2014-03-12T08:00:00.511Z", "2014-03-12T13:37:27.511Z","2014-03-12T13:37:27.511Z", "2014-03-12T13:37:27.511Z" ]
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
                      console.log("fucked it");
                    } else {
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


app.put("/medication/:id", passport.authenticate(['facebook-token']), function(req, res) {
 
            if (req.user){
              var updateDoc = req.body;
              delete updateDoc._id;

                db.collection(MED_TAKEN_COLLECTION).updateOne({_id: new ObjectID(req.params.id)}, updateDoc, function(err, doc) {
                  if (err) {
                    handleError(res, err.message, "Failed to update contact");
                  } else {
                    res.status(204).end();
                  }
                });
              }else {
                              // not authenticated. go away.
                res.send(401)
            }

        });



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




