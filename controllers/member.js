var express = require('express');
var router = express.Router();
var auth = require('../auth');
var member = require('../models/mw.member');

/**
 *Shows the login form
 */
router.get('/login', function(req, res){
	res.render("member_login", {role: req.session.role, title: " login"});
});

/**
 *Logs the user in
 */
router.post('/login', function(req, res){
	
	res.redirect("/member/trades");
});

/**
 *Shows the list of books trades initiated by the user, and a list of book trades directed at the user. User can accept/reject trades, and view the profile of the other party in the trade
 */
router.get('/trades', auth.requires('member'), function(req, res){
	res.render("member_trades", {role: req.session.role, title: " trades"});
});

/**
 *Displays the form to allow a user to change their first/last name, city and state
 */
router.get('/profile', auth.requires('member'), function(req, res){
	res.render("member_profile", {role: req.session.role, title: " profile"});
});

/**
 *Updates a member profile
 */
router.post('/profile', auth.requires('member'), function(req, res){
	
	res.redirect("/member/profile?changed");
});

/**
 *Displays a list of books owned by the user, with administrative links to manage them
 */
router.get('/books', auth.requires('member'), function(req, res){
	res.render("member_books", {role: req.session.role, title: " books"});
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
	res.render("member_books_id_edit", {role: req.session.role, title: " books :id edit"});
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
	res.render("member_books_new", {role: req.session.role, title: " books new"});
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
	
	res.redirect("/books");
});

module.exports = router;