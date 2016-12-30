SearchSource.defineSource('releases', function(searchText, options) {
  var options = (options === null) ? {} : options;

  if(searchText) {
    var regExp = buildRegExp(searchText);
    var selector = {$or: [
      {artists: regExp},
      {title: regExp},
      {labelName: regExp}
    ]};
    selector = {$and: [{userId: options.userId}, selector]}

    return Releases.find(selector, options).fetch();
  } else {
    return Releases.find({userId: options.userId}, options).fetch();
  }
});

function buildRegExp(searchText) {
  // this is a dumb implementation
  var parts = searchText.trim().split(/[ \-\:]+/);
  return new RegExp("(" + parts.join('|') + ")", "ig");
}