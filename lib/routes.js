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

FlowRouter.route('/callback', {
  action: function(params, queryParams) {
  Meteor.call('getAccessToken', queryParams);
    // console.log(window.href);
    // window.close();
    // FlowRouter.go('wantlist')
  }
});
