var options = {
  keepHistory: 1000 * 60 * 5,
  localSearch: true
}
var fields = ['artists', 'title', 'labelName'];

ReleaseSearch = new SearchSource('releases', fields, options);

Template.Wantlist.events({
  'click #importWantlist'(){
    Meteor.call('importWantlist', Meteor.user());
    // var query = UpdatedReleases.find({});
    // var handle = query.observeChanges({
    //   removed: function(){
    //     console.log('releases removed');
    //     document.location.reload(true);
    //   },
    //   added: function(){
    //     console.log('releases added');
    //     document.location.reload(true);
    //   }
    // });
  }
});

Template.SearchResult.events({
  'click .header_item'(event){
    var clickedSort = event.target.firstChild.data;
    var userSort = Meteor.user().profile.wantlistSorting.slice(0, -1);
    var arrow = Meteor.user().profile.wantlistSorting.slice(-1);
    arrow = (clickedSort === userSort && arrow === '▼') ? '▲' : '▼';
    var sortText = event.target.firstChild.data + arrow;
    Meteor.users.update(Meteor.userId(), {$set: {'profile.wantlistSorting': sortText}}, function(){
      runReleaseSearch();
    })
  }
});

Template.Wantlist.helpers({
  wantsCount(){
    return Releases.find({userId: Meteor.userId()}).count();
  }
});

Template.SearchResult.helpers({
  anyWants(){
    return Releases.findOne({userId: Meteor.userId()})
  },
  wants(){
    var userId = Meteor.userId();

    return ReleaseSearch.getData({
      transform: function(matchText, regExp) {
        return matchText.replace(regExp, "<b class='highlighter'>$&</b>")
      },
      sort: getWantlistSorting()
    });
  },
  selectedSort(type){
    var userSort = Meteor.user().profile.wantlistSorting.slice(0, -1);
    return (userSort === type) ? 'selected_sort' : ''
  },
  selectedArrow(type){
    var userSort = Meteor.user().profile.wantlistSorting.slice(0, -1);
    var arrow = Meteor.user().profile.wantlistSorting.slice(-1);
    return (userSort === type) ? arrow : ''
  },
  isLoading: function(){
    return ReleaseSearch.getStatus().loading;
  }
});

Template.SearchResult.rendered = function(){
  runReleaseSearch();
}

Template.SearchBox.events({
  "keyup #search-box": _.throttle(function(e) {
    runReleaseSearch();
  }, 200)
});

function buildRegExp(searchText) {
  // this is a dumb implementation
  var parts = searchText.trim().split(/[ \-\:]+/);
  return new RegExp("(" + parts.join('|') + ")", "ig");
}

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
      return {labelName: factor}
    case 'Title':
      return {title: factor}
    case 'Artist':
      return {artists: factor}
  }
}

function runReleaseSearch(){
  console.log('runReleaseSearch');
  var text = $('#search-box').val().trim();
  ReleaseSearch.search(text, { sort: getWantlistSorting(), userId: Meteor.userId() });
}
