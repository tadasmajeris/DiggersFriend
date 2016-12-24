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
        // console.log(err);
        // console.log(requestData);
        REQUEST_DATA = requestData;
        Meteor.call('insertAlert', requestData.authorizeUrl);
      })
    );
  },

  'insertAlert'(url){
    Alerts.insert({url: url})
  },

  'clearAlerts'(url){
    Alerts.remove({url: url});
  },

  'getAccessToken'(params){
    // console.log(params.oauth_token);
    // console.log(params.oauth_verifier);
    var oAuth = new Discogs(REQUEST_DATA).oauth();
    oAuth.getAccessToken(
      params.oauth_verifier, // Verification code sent back by Discogs
      function(err, accessData){
        // Persist "accessData" here for following OAuth calls
        // res.send('Received access token!');
        var dis = new Discogs(accessData);
        // console.log(accessData);
        var user = dis.user();
        dis.getIdentity(function(err, data){
          var username = data.username;
        });
        // var wantlist = user.wantlist();
        // wantlist.getReleases()
        // console.log(user);
        // dis.getIdentity(function(err, data){
          // console.log(err);
          // console.log(data);
        // });
      }
    );

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
