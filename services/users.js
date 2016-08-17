

var mongo = require('mongodb');


var Server = mongo.Server;
var Db = mongo.Db;
var BSON = mongo.BSONPure;

var server = new Server('heroku_42v810c5', process.env.PORT || 8080, {auto_reconnect: true});

connectToServicesDB();
var CONTACTS_COLLECTION = "users";

function connectToServicesDB(){
    db = new Db('users', server);
    db.open(function(err, db) {
        if(!err) {
            console.log("Connected to 'winedb' database");
        }
    });
}




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




