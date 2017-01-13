Meteor.publish('exchangeRates', function() {
    return ExchangeRates.find();
});

Meteor.publish('alerts', function() {
    return Alerts.find();
});

Meteor.publish('userAlerts', function() {
    return Alerts.find({userId: this.userId});
});

Meteor.publish('releases', function() {
    return Releases.find({userId: this.userId});
});

Meteor.publish('updatedReleases', function() {
    return UpdatedReleases.find({userId: this.userId});
});
