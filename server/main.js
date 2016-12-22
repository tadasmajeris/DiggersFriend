import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  Alerts.remove({});
});

Meteor.methods({
  'discogs.authorize'(){
    var Discogs = require('disconnect').Client;
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
        Meteor.call('insertAlert', requestData.authorizeUrl);
      })
    );
  },

  'insertAlert'(url){
    Alerts.insert({url: url})
  },

  'clearAlerts'(){
    Alerts.remove({});
  },

  'discogs.getRelease'(id){
    var Discogs = require('disconnect').Client;
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
