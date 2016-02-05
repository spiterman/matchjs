var passport = require('passport');
var helpers = require('../db/helpers.js');
var mailer = require('../config/mailer.js');

var setCookieProfile = function(userObj) {
  var profile = {
    id: userObj.id,
    username: userObj.username,
    displayName: userObj.displayName,
    email: userObj._json.email,
    avatar: userObj._json.avatar_url,
    location: userObj._json.location,
    github : userObj.profileUrl
  }
  return profile;
};

var setMailOptions = function(userObj) {
  var mailOptions = {
    from: 'MatchJS <matchjsteam@gmail.com>',
    to: userObj._json.email,
    subject: 'Welcome to MatchJS!',
    html: 'Hello '+userObj.displayName+',<br><br>'
    +'Welcome to <b>MatchJS</b>!<br> Your username is: '
    +userObj.username+'.<br><br>'+'<a href="http://matchjs.herokuapp.com/#/connect">Login</a> now to meet your future Mentor or Mentee!'
  };
  return mailOptions;
}

module.exports = {
  initialLogin: passport.authenticate('github'),

  redirect:  passport.authenticate('github', {failureRedirect: '/failure'}),

  success: function(req, res) {
  
    helpers.signInUser(req.user)
    .then(function(user) {

      //if user is found, set cookie information and redirect to connect
      if (user) {
        var cookie = setCookieProfile(req.user);
        res.cookie('user-profile', cookie, { maxAge: 2592000000 });  // Expires in one month
        console.log("redirecting to connect");

        res.redirect('/#/connect');
      } else {

        //if user not found and email is available
        if (req.user._json.email) {
          //add user to DB and set cookie profile
          helpers.addUser(req.user)
          .then(function(user) {

            var cookie = setCookieProfile(req.user);
            res.cookie('user-profile', cookie, { maxAge: 2592000000 });  // Expires in one month

            //send signup email
            var mailOptions = setMailOptions(req.user);
            mailer(mailOptions);
            //redirect to user's profile
            var profileURL = '/#/profile/' + req.user.username;
            res.redirect(profileURL);
          });

        } else {

          //if user not found and email is not available
          res.redirect('/#/auth');
        }
      }
    });
  },

  addEmail: function(req, res) {

    //set email and add user to database
    req.user._json.email = req.params.email;

    helpers.addUser(req.user)
    .then(function(user) {

      var cookie = setCookieProfile(req.user);
      res.cookie('user-profile', cookie, { maxAge: 2592000000 });  // Expires in one month

      //send signup email
      var mailOptions = setMailOptions(req.user);
      mailer(mailOptions);
      //redirect to user's profile
      var profileURL = '/#/profile/' + req.user.username;
      res.redirect(profileURL);
    });
  }
};