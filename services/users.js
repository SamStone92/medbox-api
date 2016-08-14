
var CONTACTS_COLLECTION = "contacts";

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







