Template.Wantlist.events({
  'click #importWantlist'(){
    Meteor.call('importWantlist', Meteor.user());
  },
  'click .header_item'(event){
    var clickedSort = event.target.firstChild.data;
    var userSort = Meteor.user().profile.wantlistSorting.slice(0, -1);
    var arrow = Meteor.user().profile.wantlistSorting.slice(-1);
    arrow = (clickedSort === userSort && arrow === '▼') ? '▲' : '▼';
    var sortText = event.target.firstChild.data + arrow;
    Meteor.call('updateWantlistSorting', Meteor.userId(), sortText);
  }
});

Template.Wantlist.helpers({
  anyWants(){
    return Releases.findOne({userId: Meteor.userId()})
  },
  wants(){
    var userId = Meteor.userId();
    var sorting = getWantlistSorting();
    return Releases.find({userId: userId}, {sort: sorting});
  },
  selectedSort(type){
    var userSort = Meteor.user().profile.wantlistSorting.slice(0, -1);
    return (userSort === type) ? 'selected_sort' : ''
  },
  selectedArrow(type){
    var userSort = Meteor.user().profile.wantlistSorting.slice(0, -1);
    var arrow = Meteor.user().profile.wantlistSorting.slice(-1);
    return (userSort === type) ? arrow : ''
  }
})

function getWantlistSorting() {
  var userSort = Meteor.user().profile.wantlistSorting.slice(0, -1);
  var arrow = Meteor.user().profile.wantlistSorting.slice(-1);
  var factor = (arrow === '▲') ? 1 : -1;

  switch(userSort) {
    case 'Added':
      return {dateAdded: factor}
    case 'Year':
      return {year: factor}
    case 'Format':
      return {format: factor}
    case 'Label':
      return {'label.name': factor}
    case 'Title':
      return {title: factor}
    case 'Artist':
      return {artists: factor}
  }
}
