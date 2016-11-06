var express    = require('express');
var router     = express.Router();
var auth       = require('../auth');
var member     = require('../models/mw.member');
var crypto     = require('crypto');

/**
 *Shows the login form
 */
router.get('/login', function(req, res){
	res.render("member_login", {role: req.session.role, errors: [], title: "Member Login"});
});

/**
 *Logs the user in
 */
router.post('/login', member.getByLogin, function(req, res){
	if ( !res.member ) {
		res.render("member_login", {role: req.session.role, errors: ['Invalid email or password'], title: "Member Login"});
	} else {
		req.session.role = 'member';
		req.session.memberInfo = res.member;
		res.redirect("/member/trades");
	}
});

/**
 *Shows the list of books trades initiated by the user, and a list of book trades directed at the user. User can accept/reject trades, and view the profile of the other party in the trade
 */
router.get('/trades', auth.requires('member'), function(req, res){
	res.render("member_trades", {role: req.session.role, title: "My Trades"});
});

/**
 *Displays the form to allow a user to change their first/last name, city and state
 */
router.get('/profile', auth.requires('member'), function(req, res){
	var message = ( typeof req.query.changed != 'undefined' ) ? 'Profile changed successfullly' : '';
	res.render("member_profile", {role: req.session.role, title: "My Profile", message: message, errors: [], memberInfo: req.session.memberInfo});
});

/**
 *Updates a member profile
 */
router.post('/profile', auth.requires('member'), function(req, res){
	var passwordRequired    = ( req.body.password.length > 0 ),
		errors              = member.validateInfo(req.body, req.body, false, passwordRequired);
	if ( errors.length > 0 ) {
		res.render("member_profile", {role: req.session.role, title: "My Profile", message: '', errors: errors, memberInfo: req.body});
	} else {
		var memberInfo = {
			'email'		: req.session.memberInfo.email,
			'firstname'	: req.body.firstname,
			'lastname'	: req.body.lastname,
			'city'		: req.body.city,
			'state'		: req.body.state
		};
		if ( passwordRequired ) {
			memberInfo.pwsalt = new Date().getTime().toString(36);
			var hash = crypto.createHmac('sha512', memberInfo.pwsalt);
			hash.update(req.body.password);
			memberInfo.pwhash = hash.digest('hex');
		}
		member.update(memberInfo, function(){
			delete memberInfo.pwsalt;
			delete memberInfo.pwhash;
			req.session.memberInfo = memberInfo;
			res.redirect("/member/profile?changed");
		});
		return;
	}
});

/**
 *Displays a list of books owned by the user, with administrative links to manage them
 */
router.get('/books', auth.requires('member'), function(req, res){
	res.render("member_books", {role: req.session.role, title: "My Books"});
});

/**
 *Removes a book from the current user's list
 */
router.post('/books/:id/remove', auth.requires('member'), function(req, res){
	
	res.redirect("/member/books");
});

/**
 *Displays a form interface enabling the user to make changes to a single book in their list
 */
router.get('/books/:id/edit', auth.requires('member'), function(req, res){
	res.render("member_books_id_edit", {role: req.session.role, title: "Edit Book"});
});

/**
 *Saves changes to a book in the current user's list
 */
router.post('/books/:id/edit', auth.requires('member'), function(req, res){
	
	res.redirect("/member/books");
});

/**
 *Displays a form interface to enable the user to add a new book to their list
 */
router.get('/books/new', auth.requires('member'), function(req, res){
	res.render("member_books_new", {role: req.session.role, title: "Add a Book"});
});

/**
 *Inserts a new book into the current user's list
 */
router.post('/books/new', auth.requires('member'), function(req, res){
	
	res.redirect("/member/books");
});

/**
 *Logs the current user out of their session
 */
router.get('/logout', function(req, res){
	delete req.session.role;
	delete req.session.memberInfo;
	res.redirect("/books");
});

/**
 *Form interface for creating a new membership
 */
router.get('/signup', function(req, res){
	res.render("member_signup", {role: req.session.role, errors: [], title: "Member Signup", memberInfo: {
		email: '',
		password: '',
		password_confirm: '',
		firstname: '',
		lastname: '',
		city: '',
		state: ''
	}});
});

/**
 *Create a new membership
 */
router.post('/signup', member.getByEmail('body'), function(req, res){
	var memberInfo = {
			'email'		: req.body.email,
			'pwsalt'	: new Date().getTime().toString(36),
			'firstname'	: req.body.firstname,
			'lastname'	: req.body.lastname,
			'city'		: req.body.city,
			'state'		: req.body.state
		},
		errors = member.validateInfo(memberInfo, req.body),
		emailUsed = false;

	if ( memberInfo.email.length > 0 && res.member ) {
		emailUsed = true;
		memberInfo.email = '';
		errors.push('Email is not available; please try another one');
	}
	if ( errors.length === 0 ) {
		var hash = crypto.createHmac('sha512', memberInfo.pwsalt);
		hash.update(req.body.password);
		memberInfo.pwhash = hash.digest('hex');
		return member.create(memberInfo, function(){
			delete memberInfo.pwsalt;
			delete memberInfo.pwhash;
			req.session.role = 'member';
			req.session.memberInfo = memberInfo;
			res.redirect("/member/books");
		});
	} else {
		memberInfo.password = ( emailUsed ) ? '' : req.body.password;
		memberInfo.password_confirm = ( emailUsed ) ? '' : req.body.password_confirm;
		res.render("member_signup", {role: req.session.role, errors: errors, title: "Member Signup", memberInfo: memberInfo});
	}
});

module.exports = router;