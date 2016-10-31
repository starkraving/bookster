var express = require('express');
var router = express.Router();


/**
 *Shows the login form
 */
router.get('/login', function(req, res){
	res.render("member_login", {title: " login"});
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
router.get('/trades', function(req, res){
	res.render("member_trades", {title: " trades"});
});

/**
 *Displays the form to allow a user to change their first/last name, city and state
 */
router.get('/profile', function(req, res){
	res.render("member_profile", {title: " profile"});
});

/**
 *Updates a member profile
 */
router.post('/profile', function(req, res){
	
	res.redirect("/member/profile?changed");
});

/**
 *Displays a list of books owned by the user, with administrative links to manage them
 */
router.get('/books', function(req, res){
	res.render("member_books", {title: " books"});
});

/**
 *Removes a book from the current user's list
 */
router.post('/books/:id/remove', function(req, res){
	
	res.redirect("/member/books");
});

/**
 *Displays a form interface enabling the user to make changes to a single book in their list
 */
router.get('/books/:id/edit', function(req, res){
	res.render("member_books_id_edit", {title: " books :id edit"});
});

/**
 *Saves changes to a book in the current user's list
 */
router.post('/books/:id/edit', function(req, res){
	
	res.redirect("/member/books");
});

/**
 *Displays a form interface to enable the user to add a new book to their list
 */
router.get('/books/new', function(req, res){
	res.render("member_books_new", {title: " books new"});
});

/**
 *Inserts a new book into the current user's list
 */
router.post('/books/new', function(req, res){
	
	res.redirect("/member/books");
});

/**
 *Logs the current user out of their session
 */
router.get('/logout', function(req, res){
	
	res.redirect("/books");
});

module.exports = router;