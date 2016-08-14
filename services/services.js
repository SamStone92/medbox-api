var mongo = require('mongodb');
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/Moono');
var mongooseDb = mongoose.connection;

var Server = mongo.Server;
var Db = mongo.Db;
var BSON = mongo.BSONPure;

var server = new Server('localhost', 27017, {auto_reconnect: true});

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


exports.addService = function(req, res) {
    var serviceObject = req.body;
    console.log('Adding services: ' + JSON.stringify(serviceObject));
    db.collection('services', function(err, collection) {
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
}







