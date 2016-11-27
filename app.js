console.log('starting up');
var mode = process.argv[2] || 'development';
if ( mode == 'development' ) {
	require('dotenv').config();
}
var express      = require('express'),
	session      = require('express-session'),
	path         = require('path'),
	app          = express(),
	fs           = require('fs'),
	bodyParser   = require('body-parser'),
	pug          = require('pug');

// database connection
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);

// some environment variables
app.set('view engine', 'pug');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/libs', express.static(path.join(__dirname, 'bower_components')));
app.use(session({
	secret: 'Fr33C0d3C4mp##b00k5t3r',
	resave: false,
	saveUninitialized: false
}));

// dynamically include routes (Controller)
fs.readdirSync('./controllers').forEach(function (file) {
	if(file.substr(-3) == '.js') {
		var fc = file.replace('.js', '');
		app.use('/'+fc, require('./controllers/' + file));
	}
});

app.get('/', function(req, res){
	res.redirect("/books");
});

if ( mode == 'development' ) {
	app.use(require('nodebuilder'));
}


app.listen(process.env.PORT, function(){
  console.log('Express server listening on port ' + process.env.PORT);
});