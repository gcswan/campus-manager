var userModel = require('../models/userModel.js');
var _ = require('lodash');

/**
* userController.js
*
* @description :: Server-side logic for managing users.
*/
module.exports = {
  
  /**
  * userController.list()
  */
  list: function(req, res) {
    userModel.find(null,null,{
      sort: 'last_name',
    }, function(err, users){
      if(err) {
        return res.json(500, {
          message: 'Error getting user.'
        });
      }
      return res.json(users);
    });
  },
  
  /**
  * userController.show()
  */
  show: function(req, res) {
    var id = req.params.id;
    userModel.findOne({_id: id}, function(err, user){
      if(err) {
        return res.json(500, {
          message: 'Error getting user.'
        });
      }
      if(!user) {
        return res.json(404, {
          message: 'No such user'
        });
      }
      return res.json(user);
    });
  },
  
  /**
  * userController.create()
  */
  create: function(req, res) {
    var user = new userModel();
  
  /**
  * userController.update()
  */
  update: function(req, res) {
    var id = req.params.id;
    userModel.findOne({_id: id}, function(err, user){
      if(err) {
        return res.json(500, {
          message: 'Error saving user',
          error: err
        });
      }
      if(!user) {
        return res.json(404, {
          message: 'No such user'
        });
      }
      
      var attributes = [
        'idn',
        'username',
        'first_name',
        'last_name',
        'email',
        'phone',
        'website',
        'github',
        'is_admin',
        'is_instructor',
        'is_student'
      ];
      
      _.each(attributes, function(attr) {
        user[attr] =  req.body[attr] ? req.body[attr] : user[attr];
      });
    
        if(err) {
          return res.json(500, {
            message: 'Error getting user.'
          });
        }
        if(!user) {
          return res.json(404, {
            message: 'No such user'
          });
        }
        return res.json(user);
      });
    });
  },
  
  /**
  * userController.remove()
  */
  remove: function(req, res) {
    var id = req.params.id;
    userModel.findByIdAndRemove(id, function(err, user){
      if(err) {
        return res.json(500, {
          message: 'Error getting user.'
        });
      }
      return res.json(user);
    });
  },
  
  import: function(req, res) {
    _.each(req.body, function(reqUser) {
      var user = new userModel();
      
      var attributes = [
        'idn',
        'username',
        'first_name',
        'last_name',
        'email',
        'phone',
        'website',
        'github'
      ];
      
      _.each(attributes, function(attr) {
        user[attr] = reqUser[attr] ? reqUser[attr] : user[attr];
      });
      
      user.is_student = true;
      
      userModel.findOne({ _id: req.user.id }).populate('client').exec(function(err, currentUser) { 
        user.client = currentUser.client.id;
        user.save();
      });
    });
    return res.json(req.body);
  }
};