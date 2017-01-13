var options = {
    keepHistory: 1000,
    localSearch: true
}
var fields = ['artists', 'title', 'labelName'];

ReleaseSearch = new SearchSource('releases', fields, options);

Template.Wantlist.onCreated(function() {
    Meteor.subscribe('releases');
    Meteor.subscribe('updatedReleases');
    Meteor.subscribe('exchangeRates');
    Meteor.subscribe('userAlerts');
});

Template.Wantlist.events({
    'click #importWantlist'(event){
        if (Session.get('importing') !== true) {
            updateHtmlToLoading(true, event.target);

            Meteor.call('importWantlist', Meteor.user());

            var query = Alerts.find({userId: Meteor.userId()});
            var handle = query.observeChanges({
                added: function(){
                    Meteor.call('clearAlerts', {userId: Meteor.userId()});
                    updateHtmlToLoading(false, event.target);
                    runReleaseSearch();
                }
            });
        }
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
        if (event.target.className !== 'heart_button') {
            var popup = window.open("about:blank", "_blank");
            popup.location = `https://www.discogs.com/sell/release/${this.discogsId}?sort=price%2Casc&ev=rb`;
        }
    },
    'click .heart_button'(event){
        var id = this._id;
        var newHeartedStatus = getHeartedValue(id) !== true ? true : false;
        event.target.firstElementChild.className = getIconName(newHeartedStatus, true);
        Releases.update(id, {$set: {hearted: newHeartedStatus}}, function(){
            if (newHeartedStatus === true) {
                getReleaseData(id);
            } else {
                runReleaseSearch();
            }
        })
    },
    'click #header_heart'(event){
        var selectHearted = Meteor.user().profile.hearted !== true ? true : false;
        Meteor.users.update(Meteor.userId(), {$set: {"profile.hearted": selectHearted}}, function(){
            runReleaseSearch();
        });
        if (selectHearted === true) {
            updateUsersFavoritesData();
        }
    }
});

Template.Wantlist.helpers({
    wantsCount(){
        return Releases.find({userId: Meteor.userId()}).count();
    },
    updateUsersFavorites(){
        if (Meteor.user().profile.hearted) {
            updateUsersFavoritesData()
        }
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
    },
    displayPricesIfHearted(){
        return this.hearted ? 'sales_info' : 'invisible';
    },
    calcPrice(){
        var today = new Date().withoutTime();
        var rate = ExchangeRates.findOne({date: today});
        var price = Math.round(this.lowestPriceUSD * rate.GBP);
        return price
    }
});

Template.Wantlist.rendered = function(){
    Session.set('importing', false);
    getTodaysExchangeRates();
}

Template.SearchResult.rendered = function(){
    runReleaseSearch();
}

Template.SearchBox.events({
    "keyup #search-box": _.throttle(function(e) {
        runReleaseSearch();
    }, 200)
});

const buildRegExp = function(searchText) {
    // this is a dumb implementation
    var parts = searchText.trim().split(/[ \-\:]+/);
    return new RegExp("(" + parts.join('|') + ")", "ig");
}

const getWantlistSorting = function() {
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

const runReleaseSearch = function(text){
    var text = (text === undefined) ? $('#search-box').val().trim() : text;
    ReleaseSearch.search(text, { sort: getWantlistSorting(), userId: Meteor.userId(), hearted: Meteor.user().profile.hearted });
}

const getHeartedValue = function(releaseId){
    var release = Releases.findOne(releaseId);
    return (release.hearted === undefined) ? false : release.hearted;
}

const getIconName = function(hearted, mouseOver){
    var iconName = hearted ? "fa fa-heart" : "fa fa-heart-o";
    var visibility = (hearted || mouseOver) ? " visible" : " invisible";
    return iconName + visibility
}

const updateHtmlToLoading = function(isLoading, importButton) {
    Session.set('importing', isLoading);
    importButton.innerText = isLoading ? 'importing...' : 'Import from Discogs';
    importButton.className = isLoading ? 'disabled-btn' : '';
    $('#loading-gif').fadeTo(400, isLoading ? 1 : 0);
}

const getTodaysExchangeRates = function(){
    var today = new Date().withoutTime();
    // if exchange rate hasnt been set today
    if (!ExchangeRates.findOne({date: today})) {
        Meteor.call('getExchangeRates');
    }
}

Date.prototype.withoutTime = function(){
    var d = new Date(this);
    d.setHours(0, 0, 0, 0, 0);
    return d
}

const getReleaseData = function(id) {
    Meteor.call('discogs.getReleaseData', id);
    var query = Alerts.find({userId: Meteor.userId(), status: 'releaseUpdated'});
    var handle = query.observeChanges({
        added: function(){
            Meteor.call('clearAlerts', {userId: Meteor.userId()});
            runReleaseSearch();
        }
    });
}

const updateUsersFavoritesData = function(){
    var favorites = Releases.find({userId: Meteor.userId(), hearted: true});
    favorites.forEach(function(release){
        getReleaseData(release._id);
    });
}
