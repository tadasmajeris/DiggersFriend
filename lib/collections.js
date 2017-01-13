Alerts = new Mongo.Collection("alerts");
Releases = new Mongo.Collection("releases");
UpdatedReleases = new Mongo.Collection("updatedReleases");
ExchangeRates = new Mongo.Collection("exchangeRates");

Releases.allow({
    insert() {
        return false;
    },
    update(userId, doc, fields) {
        if (fields[0] === 'hearted') {
            return !!userId;
        }
    },
    remove() {
        return false;
    }
});

Meteor.users.allow({
    insert() {
        return false;
    },
    update(userId, doc, fields) {
        if (fields[0] === 'profile.wantlistSorting' || fields[0] === 'profile.hearted') {
            return !!userId;
        }
    },
    remove() {
        return false;
    }
});
