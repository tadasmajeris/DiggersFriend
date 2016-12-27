import { Meteor } from 'meteor/meteor';

const Discogs = require('disconnect').Client;
var REQUEST_DATA;

Meteor.startup(() => {
  Alerts.remove({});
});

Meteor.methods({
  'discogs.authorize'(host){
    var oAuth = new Discogs().oauth();
    oAuth.getRequestToken(
      Meteor.settings.discogsKey,
      Meteor.settings.discogsSecret,
      `${host}callback`,
      Meteor.bindEnvironment(function(err, requestData){
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
        var dis = new Discogs(accessData);
        dis.getIdentity(Meteor.bindEnvironment(function(err, data){
          Meteor.call('insertAlert', {username: data.username, accessData: accessData});
        }));
      })
    );
  },

  'create.user'(username, accessData){
    var existingUser = Meteor.users.findOne({username: username});
    var aData = {token: accessData.token, tokenSecret: accessData.tokenSecret};

    if (existingUser === undefined) {
      Accounts.createUser({ username: username, password: s.reverse(username), profile: aData });
    } else if (aData.token !== existingUser.profile.token) {
      Meteor.users.update( {username: username}, {$set: {profile: aData}} );
    }
    return username
  },

  'importWantlist'(user){
    var accessData = getAccessData(user);
    var wantlist = new Discogs(accessData).user().wantlist();
    wantlist.getReleases(user.username, {per_page: 10}, Meteor.bindEnvironment(function(err, data){
      Meteor.call('insertReleases', user, data.wants);
      // if (data.pagination.pages > 1) {
      //
      // }
      // console.log(data);
      // console.log(data.wants[3]);
    }))
  },

  'insertReleases'(user, releases){
    releases.forEach(function(release){
      var existingRelease = Releases.findOne({userId: user._id, discogsId: release.id});
      if (existingRelease === undefined) {
        var releaseInfo = extractReleaseInfo(user, release);
        console.log(releaseInfo);
        // Releases.insert(releaseInfo);
      }
    })
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
});

function getAccessData(user){
  return {
    method: 'oauth',
    level: 2,
    consumerKey: Meteor.settings.discogsKey,
    consumerSecret: Meteor.settings.discogsSecret,
    token: user.profile.token,
    tokenSecret: user.profile.tokenSecret
  }
}

function extractReleaseInfo(user, release) {
  var info = _.pick(release.basic_information, 'year', 'title', 'thumb');
  info.label = _.pick(release.basic_information.labels[0], 'name', 'catno');
  info.format = extractFormat(release.basic_information.formats[0]);
  info.artists = extractArtists(release.basic_information.artists);
  info.userId = user._id;
  info.discogsId = release.id;
  info.dateAdded = release.date_added;
  return info
}

function extractArtists(artistsArray) {
  var artists = [];
  artistsArray.forEach(function(artist){
    artists.push(artist.name);
  });
  return artists.join(' / ')
}

function extractFormat(format) {
  var str = '';
  if (format.qty > 1) {
    str += format.qty + 'x';
  }
  if (format.name !== 'Vinyl') {
    str += format.name
  } else {
    str += format.descriptions[0]
  }
  return str
}
