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
      aData.wantlistSorting = 'Added▼';
      Accounts.createUser({ username: username, password: s.reverse(username), profile: aData });
    } else if (aData.token !== existingUser.profile.token) {
      if (!existingUser.profile.wantlistSorting) { aData.wantlistSorting = 'Added▼' }
      Meteor.users.update( {username: username}, {$set: {profile: aData}} );
    }
    return username
  },

  'importWantlist'(user){
    var accessData = getAccessData(user);
    var wantlist = new Discogs(accessData).user().wantlist();
    wantlist.getReleases(user.username, {per_page: 100}, Meteor.bindEnvironment(function(err, data){
      var onLastPage = (data.pagination.pages === 1) ? true : false;
      var update = Releases.findOne({userId: Meteor.userId()}) !== undefined;
      var options = {onLastPage: onLastPage, update: update};

      Meteor.call('insertReleases', user, data.wants, options);
      if (data.pagination.pages > 1) {
        for (var i=2; i<=data.pagination.pages; i++) {
          if (i === data.pagination.pages) { options.onLastPage = true };
          wantlist.getReleases(user.username, {page: i, per_page: 100}, Meteor.bindEnvironment(function(err, data){
            Meteor.call('insertReleases', user, data.wants, options);
          }))
        }
      }
    }))
  },

  'insertReleases'(user, releases, options){
    releases.forEach(function(release, i, array){
      var releaseInfo = extractReleaseInfo(user, release);

      var existingRelease = Releases.findOne({userId: user._id, discogsId: release.id});
      if (existingRelease === undefined) {
        Releases.insert(releaseInfo);
      }

      if (options.update) {
        releaseInfo = _.pick(releaseInfo, 'userId', 'discogsId');
        var lastItem = (i === array.length - 1);
        if (lastItem && options.onLastPage) {
          UpdatedReleases.insert(releaseInfo, function(){
            Meteor.call('deleteRemovedReleases');
          });
        } else {
          UpdatedReleases.insert(releaseInfo);
        }
      }
    })
  },

  'deleteRemovedReleases'(){
    var releases = Releases.find({userId: Meteor.userId()}).fetch();
    var releasesIds = getReleaseIds(releases);
    var updatedReleases = UpdatedReleases.find({userId: Meteor.userId()}).fetch();
    var updatedReleasesIds = getReleaseIds(updatedReleases);

    var deletedReleasesIds = _.difference(releasesIds, updatedReleasesIds);

    deletedReleasesIds.forEach(function(discogsId){
      Releases.remove({userId: Meteor.userId(), discogsId: discogsId});
    });
    UpdatedReleases.remove({userId: Meteor.userId()});
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
  var info        = _.pick(release.basic_information, 'year', 'title', 'thumb');
  info.labelName  = release.basic_information.labels[0].name;
  info.catNo      = release.basic_information.labels[0].catno;
  info.format     = extractFormat(release.basic_information.formats[0]);
  info.artists    = extractArtists(release.basic_information.artists);
  info.userId     = user._id;
  info.discogsId  = release.id;
  info.dateAdded  = release.date_added;
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

function getReleaseIds(releases){
  var ids = [];
  releases.forEach(function(release){
    ids.push(release.discogsId);
  });
  return ids
}
