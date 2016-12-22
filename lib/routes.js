// Router.route('/');
// Router.route('/wantlist');

FlowRouter.route('/', {
  name: 'home',
  action() {
    BlazeLayout.render('HomeLayout');
  }
});

FlowRouter.route('/wantlist', {
  name: 'wantlist',
  action() {
    BlazeLayout.render('MainLayout', {main: 'Wantlist'});
  }
});

FlowRouter.route('/authorize', {
  name: 'authorize',
  action() {
    // Meteor.call('discogs.getRelease', 2172055);
    Meteor.call('discogs.authorize');
    var query = Alerts.find({});
    Alerts.observer = query.observeChanges({
      added: function(){
        Alerts.observer.stop();
        var alert = Alerts.findOne();
        // Meteor.call('clearAlerts');
        console.log(alert.url);
        window.open(alert.url, '_blank');
        // Router.go(alert.url)
      }
    });
  }
});

FlowRouter.route('/callback', {
  action() {
    console.log(window.href);
    // window.close();
    FlowRouter.go('wantlist')
  }
});
