var options = {
  keepHistory: 1000,
  localSearch: true
}
var fields = ['artists', 'title', 'labelName'];

ReleaseSearch = new SearchSource('releases', fields, options);

Template.Wantlist.events({
  'click #importWantlist'(){
    Meteor.call('importWantlist', Meteor.user());
    var query = Alerts.find({userId: Meteor.userId()});
    var handle = query.observeChanges({
      added: function(){
        Meteor.call('clearAlerts', {userId: Meteor.userId()})
        runReleaseSearch();
      }
    });
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
  },
  'mouseenter .wantlist_li'(event){
    var heartButton = event.target.getElementsByClassName("heart_button")[0];
    if (heartButton) { heartButton.firstElementChild.className = getIconName(getHeartedValue(this._id), true) }
  },
  'mouseleave .wantlist_li'(event){
    var heartButton = event.target.getElementsByClassName("heart_button")[0];
    if (heartButton) { heartButton.firstElementChild.className = getIconName(getHeartedValue(this._id), false) }
  },
  'click .wantlist_li'(event){
    if (event.target.className === 'release_info') {
      var popup = window.open("about:blank", "_blank");
      popup.location = `https://www.discogs.com/sell/release/${this.discogsId}?sort=price%2Casc&ev=rb`;
    }
  },
  'click .heart_button'(event){
    var newHeartedStatus = getHeartedValue(this._id) !== true ? true : false;
    event.target.firstElementChild.className = getIconName(newHeartedStatus, true);
    Releases.update(this._id, {$set: {hearted: newHeartedStatus}}, function(){
      if (Meteor.user().profile.hearted) {
        runReleaseSearch();
      }
    })
  },
  'click #header_heart'(event){
    var selectHearted = Meteor.user().profile.hearted !== true ? true : false;
    Meteor.users.update(Meteor.userId(), {$set: {"profile.hearted": selectHearted}}, function(){
      runReleaseSearch();
    });
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
  isLoading(){
    return ReleaseSearch.getStatus().loading;
  },
  heartIcon(){
    return getIconName(this.hearted);
  },
  displayThumb(){
    var defaultImage = "https://s.discogs.com/images/default-release.png";
    return this.thumb ? this.thumb : defaultImage;
  },
  headerHeart(){
    var hearted = Meteor.user().profile.hearted;
    return getIconName(hearted, true);
  },
  selectedHeart(){
    return Meteor.user().profile.hearted ? "selected_sort" : '';
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

function runReleaseSearch(text){
  var text = (text === undefined) ? $('#search-box').val().trim() : text;
  ReleaseSearch.search(text, { sort: getWantlistSorting(), userId: Meteor.userId(), hearted: Meteor.user().profile.hearted });
}

function getHeartedValue(releaseId){
  var release = Releases.findOne(releaseId);
  return (release.hearted === undefined) ? false : release.hearted;
}

function getIconName(hearted, mouseOver){
  var iconName = hearted ? "fa fa-heart" : "fa fa-heart-o";
  var visibility = (hearted || mouseOver) ? " visible" : " invisible";
  return iconName + visibility
}
