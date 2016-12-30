SearchSource.defineSource('releases', function(searchText, options) {
  var options = (options === null) ? {} : options;

  if(searchText) {
    var regExp = buildRegExp(searchText);
    var selector = {$or: [
      {artists: regExp},
      {title: regExp},
      {labelName: regExp}
    ]};

    return Releases.find(selector, options).fetch();
  } else {
    return Releases.find({}, options).fetch();
  }
});

function buildRegExp(searchText) {
  // this is a dumb implementation
  var parts = searchText.trim().split(/[ \-\:]+/);
  return new RegExp("(" + parts.join('|') + ")", "ig");
}
