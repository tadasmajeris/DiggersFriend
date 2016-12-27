Template.HomeLayout.events({
  'click #discogs_login'(){
    // var importantStuff = window.open('', '_blank', "width=800, height=500");
    // importantStuff.document.write('connecting to Discogs...');
    Meteor.call('discogs.authorize');
    var query = Alerts.find({url: {$exists: true}});
    Alerts.observer = query.observeChanges({
      added: function(){
        console.log('added url');
        Alerts.observer.stop();
        var alert = Alerts.findOne({url: {$exists: true}});
        Meteor.call('clearAlerts', {url: alert.url});
        window.open(alert.url, '_self');
      }
    });
  }
});
