Accounts.onLogin(function() {
    FlowRouter.go('wantlist')
});

Accounts.onLogout(function() {
    FlowRouter.go('home')
});

FlowRouter.triggers.enter([function(context, redirect){
    if(context.context.pathname !== '/callback' && !Meteor.userId()){
        FlowRouter.go('home');
    }
}]);

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

FlowRouter.route('/callback', {
    action: function(params, queryParams) {
        Meteor.subscribe('alerts');
        Meteor.call('getAccessToken', queryParams);
        var query = Alerts.find({username: {$exists: true}});
        Alerts.observer = query.observeChanges({
            added: function(){
                Alerts.observer.stop();
                var alert = Alerts.findOne();
                Meteor.call('clearAlerts', {username: alert.username});
                Meteor.call('create.user', alert.username, alert.accessData, function(err, username){
                    var password = s.reverse(username);
                    Meteor.loginWithPassword(username, password);
                })
            }
        });
    }
});
