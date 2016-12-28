Template.Wantlist.events({
  'click #importWantlist'(){
    Meteor.call('importWantlist', Meteor.user());
  }
});

Template.Wantlist.helpers({
  anyWants(){
    return Releases.findOne({userId: Meteor.userId()})
  },
  wants(){
    var userId = Meteor.userId();
    return Releases.find({userId: userId}, {sort: {dateAdded: -1}});
  },
  selectedSort(type){
    var userSort = Meteor.user().profile.wantlistSorting.slice(0, -1);
    return (userSort === type) ? 'selected_sort' : ''
  }
})
