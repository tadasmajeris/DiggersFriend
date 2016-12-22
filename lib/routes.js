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
