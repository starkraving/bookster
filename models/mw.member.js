var mongoose    = require('mongoose');
var Schema      = mongoose.Schema;
var crypto      = require('crypto');
var validator   = require('validator');

module.exports = (function(){
	var memberModel = mongoose.model('booksMember', new Schema({
		'email'		: String,
		'pwsalt'	: String,
		'pwhash'	: String,
		'firstname'	: String,
		'lastname'	: String,
		'city'		: String,
		'state'		: String
	}));

	var objReturn = {};

	objReturn.create = function(memberInfo, callback) {
		var member = new memberModel(memberInfo).save(function(err, doc, rowsaffected){
			callback();
		});
	};

	objReturn.update = function(memberInfo, callback) {
		var member = memberModel.findOne({email: memberInfo.email}).exec(function(err, member){
			if ( err ) return;
			member.firstname = memberInfo.firstname;
			member.lastname = memberInfo.lastname;
			member.city = memberInfo.city;
			member.state = memberInfo.state;
			if ( memberInfo.pwsalt && memberInfo.pwhash ) {
				member.pwsalt = memberInfo.pwsalt;
				member.pwhash = memberInfo.pwhash;
			}
			member.save(function(err, doc, rowsaffected){
				callback();
			});
		});
	};

	objReturn.findOne = function(email, callback) {
		memberModel.findOne({email: email}).exec(function(err, result){
			if ( err ) result = null;
			callback(result);
		});
	};

	objReturn.getByLogin = function(req, res, next) {
		memberModel.findOne({email: req.body.email}).exec(function(err, result){
			if ( !err && result && 'pwsalt' in result ) { 
				var hash = crypto.createHmac('sha512', result.pwsalt);
				hash.update(req.body.password);
				if ( result.pwhash == hash.digest('hex') ) {
					delete result.pwsalt;
					delete result.pwhash;
					res.member = result;
					return next();
				}
			}
			res.member = null;
			next();
		});
	};

	objReturn.getByEmail = function(scope) {
		return function(req, res, next) {
			objReturn.findOne({email: req[scope].email}).exec(function(result){
				res.member = result;
				next();
			});
		}
	}

	objReturn.validateInfo = function(memberInfo, postData, requireEmail, requirePassword) {
		if ( arguments.length < 3 ) requireEmail = true;
		if ( arguments.length < 4 ) requirePassword = true;
		var errors = [];
		if ( memberInfo.firstname.length === 0 ) { errors.push('First Name is required'); }
		if ( memberInfo.lastname.length === 0 ) { errors.push('Last Name is required'); }
		if ( memberInfo.city.length === 0 ) { errors.push('City is required'); }
		if ( memberInfo.state.length === 0 ) { errors.push('State is required'); }
		if ( requireEmail ) {
			if ( memberInfo.email.length === 0 ) { errors.push('Email is required'); }
			if ( !validator.isEmail(memberInfo.email) ) { errors.push('Please use a valid email address'); }
		}
		if ( requirePassword ) {
			if ( postData.password.length === 0 ) { errors.push('Password is required'); }
			if ( postData.password_confirm.length === 0 ) { errors.push('Confirm Password is required'); }
			if ( postData.password != postData.password_confirm ) { errors.push('Password and Confirm Password don\'t match') }
		}
		return errors;
	}

	return objReturn;
	
})();