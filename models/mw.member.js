var mongoose = require('mongoose');
var Schema = mongoose.Schema;

module.exports = (function(){
	var memberModel = mongoose.model('booksMember', new Schema({
		'email'		: String,
		'password'	: String,
		'firstname'	: String,
		'lastname'	: String,
		'city'		: String,
		'state'		: String
	}));

	var objReturn = {};

	objReturn.getByLogin = function(req, res, next) {
		memberModel.findOne({'email': req.body.email}).exec(function(err, result){
			if ( !err && result && 'pwsalt' in result ) { 
				var hash = crypto.createHmac('sha512', result.pwsalt);
				hash.update(req.body.password);
				if ( result.pwhash == hash.digest('hex') ) {
					res.member = result;
					next();
				}
			}
			res.member = null;
			next();
		});
	};

	objReturn.getByUsername = function(req, res, next) {
		memberModel.findOne({'email': req.session.email}).exec(function(err, result){
			res.member = ( err ) ? null : result;
			next();
		});
	}
	
})();