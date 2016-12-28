Template.Wantlist.events({
  'click #importWantlist'(){
    Meteor.call('importWantlist', Meteor.user());
  }
});

Template.Wantlist.helpers({
  wants(){
    var userId = Meteor.userId();
    return Releases.find({userId: userId}, {sort: {dateAdded: -1}});
  }
})
