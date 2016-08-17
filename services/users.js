

var mongo = require('mongodb');


var Server = mongo.Server;
var Db = mongo.Db;
var BSON = mongo.BSONPure;

var server = new Server('localhost', process.env.PORT || 8080, {auto_reconnect: true});

connectToServicesDB();
connectToAreasDB();

function connectToServicesDB(){
    db = new Db('services', server);
    db.open(function(err, db) {
        if(!err) {
            console.log("Connected to 'winedb' database");
        }
    });
}

function connectToAreasDB(){
    areas = new Db('areas', server);
    areas.open(function(err, db) {
        if(!err) {
            console.log("Connected to 'areas' database");
        }
    });
}

mongooseDb.on('error', console.error.bind(console, 'connection error:'));
mongooseDb.once('open', function() {
  console.log('woooorkded')
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




