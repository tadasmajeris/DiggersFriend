Template.HomeLayout.events({
  'click #discogs_login'(){
    // var importantStuff = window.open('', '_blank', "width=800, height=500");
    // importantStuff.document.write('connecting to Discogs...');
    Meteor.call('discogs.authorize');
    var query = Alerts.find({});
    Alerts.observer = query.observeChanges({
      added: function(){
        Alerts.observer.stop();
        var alert = Alerts.findOne();
        Meteor.call('clearAlerts', alert.url);
        window.open(alert.url, '_self');
      }
    });
  }
});
