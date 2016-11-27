var express         = require('express');
var router          = express.Router();
var auth            = require('../auth');
var member          = require('../models/mw.member');
var book            = require('../models/mw.book');
var notification    = require('../models/mw.notification.js');
var crypto          = require('crypto');
var request         = require('request');
var validator       = require('validator');
var fs              = require('fs');
var path            = require('path');

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
 *Shows the list of books trades initiated by the user, and a list of book trades directed at the user. User can accept/reject trades
 */
router.get('/trades', auth.requires('member'), book.myTrades, notification.getAndClear, function(req, res){
	res.render("member_trades", {role: req.session.role, title: "My Trades", trades: res.myTrades, notifications: res.notifications});
});

/**
 *Shows form with list of current book owners to choose from
 */
router.get('/trades/new/:id', auth.requires('member'), book.ownersByBook('params'), member.getByEmails, function(req, res){
	res.render("member_trades_new_id", {role: req.session.role, id: req.params.id, title: "Select an Owner for Trade", owners: res.owners});
});

/**
 *Creates a new trade request with a requester and a requestee
 */
router.post('/trades/new/:id', auth.requires('member'), function(req, res){
	book.insertTrade(req.params.id, {
		requester: req.session.memberInfo.email, 
		requestee: req.body.email
	}, function(){
		res.redirect("/member/trades");
	});
});

/**
 *Cancels the current user's trade request
 */
router.post('/trades/cancel/:id', auth.requires('member'), function(req, res){
	book.cancelTrade(req.params.id, {
		requester: req.session.memberInfo.email, 
		requestee: req.body.requestee
	}, function(){
		res.redirect("/member/trades");
	});
});

/**
 *Rejects a trade request initiated by another user
 */
router.post('/trades/reject/:id', auth.requires('member'), function(req, res){
	book.rejectTrade(req.params.id, {
		requester: req.body.requester,
		requestee: req.session.memberInfo.email
	}, function(){
		res.redirect("/member/trades");
	});
});

/**
 *Accepts a trade request initiated by another user
 */
router.post('/trades/accept/:id', auth.requires('member'), function(req, res){
	book.acceptTrade(req.params.id, {
		requester: req.body.requester,
		requestee: req.session.memberInfo.email
	}, function(){
		res.redirect("/member/trades");
	});
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
router.get('/books', auth.requires('member'), book.myBooks, function(req, res){
	res.render("member_books", {role: req.session.role, title: "My Books", books: res.myBooks});
});

/**
 *Removes a book from the current user's list
 */
router.post('/books/:id/remove', auth.requires('member'), function(req, res){
	book.removeOwner(req.params.id, req.session.memberInfo.email, function(){
		res.redirect("/member/books");
	});
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
router.post('/books/new/:id?', auth.requires('member'), function(req, res){
	if ( !req.params.id ) {
		var filter = ( ['isbn','inauthor','intitle'].indexOf(req.body.searchType) )
						? req.body.searchType+':' : '';
		request('https://www.googleapis.com/books/v1/volumes?q='+filter+escape(req.body.search), function(err, response, body){
			if ( err ) {
				body = fs.readFileSync(path.resolve(__dirname+'/../views/books.json'));
			}
			res.render('member_books_new_select', {role: req.session.role, title: "Add a Book", books: JSON.parse(body)});
		});
	} else {
		book.find({googleID:req.params.id}, function(results){
			if ( results.length ) {
				book.update(results[0].googleID, {owners: results[0].owners.push(req.session.memberInfo.email)}, function(){
					res.redirect("/member/books");
				})
			} else {
				bookData = JSON.parse(req.body.bookData);
				bookData.googleID = bookData.id;
				bookData.owners = [req.session.memberInfo.email];
				bookData.trades = [];
				book.insert(bookData, function(){
					res.redirect("/member/books");
				});
			}
		})
	}
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