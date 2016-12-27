import { Meteor } from 'meteor/meteor';

const Discogs = require('disconnect').Client;
var REQUEST_DATA;

Meteor.startup(() => {
  Alerts.remove({});
});

Meteor.methods({
  'discogs.authorize'(){
    var oAuth = new Discogs().oauth();
    oAuth.getRequestToken(
      Meteor.settings.discogsKey,
      Meteor.settings.discogsSecret,
      'http://localhost:3000/callback',
      Meteor.bindEnvironment(function(err, requestData){
        // Persist "requestData" here so that the callback handler can
        // access it later after returning from the authorize url
        REQUEST_DATA = requestData;
        Meteor.call('insertAlert', {url: requestData.authorizeUrl});
      })
    );
  },

  'insertAlert'(data){
    Alerts.insert(data)
  },

  'clearAlerts'(data){
    Alerts.remove(data);
  },

  'getAccessToken'(params){
    var oAuth = new Discogs(REQUEST_DATA).oauth();
    oAuth.getAccessToken(
      params.oauth_verifier, // Verification code sent back by Discogs
      Meteor.bindEnvironment(function(err, accessData){
        // Persist "accessData" here for following OAuth calls
        var dis = new Discogs(accessData);
        dis.getIdentity(Meteor.bindEnvironment(function(err, data){
          Meteor.call('insertAlert', {username: data.username});
        }));
      })
    );
  },

  'create.user'(username){
    var existingUser = Meteor.users.findOne({username: username});
    if (existingUser === undefined) {
      Accounts.createUser({username: username, password: s.reverse(username)});
    }
    return username
  },

  'discogs.getRelease'(id){
    var dis = new Discogs({
      consumerKey: Meteor.settings.discogsKey,
      consumerSecret: Meteor.settings.discogsSecret
    });
    var db = dis.database();
    db.getRelease(id, function(err, data){
      console.log(err);
      console.log(data);
    });
  }
})
