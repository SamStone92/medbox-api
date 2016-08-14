var express = require('express');
var wine = require('./services/services');

var app = express();

app.configure(function () {
    app.use(express.logger('dev'));     /* 'default', 'short', 'tiny', 'dev' */
    app.use(express.bodyParser());
});

app.get('/services', wine.findAllInLocation);
app.post('/services', wine.addService);

app.listen(3000);
console.log('Listening on port 3000...');