Template.HomeLayout.onCreated(function() {
    Meteor.subscribe('alerts');
});

Template.HomeLayout.events({
    'click #discogs_login'(){
        // var newWindow = window.open('', '_blank', "width=800, height=500");
        // newWindow.document.write('connecting to Discogs...');
        Meteor.call('discogs.authorize', window.location.href);
        var query = Alerts.find({url: {$exists: true}});
        Alerts.observer = query.observeChanges({
            added: function(){
                Alerts.observer.stop();
                var alert = Alerts.findOne({url: {$exists: true}});
                Meteor.call('clearAlerts', {url: alert.url});
                window.open(alert.url, '_self');
            }
        });
    }
});
