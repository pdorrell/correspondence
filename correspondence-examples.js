$(document).ready(function(){
  var initializer = new CORRESPONDENCE.Initializer();
  initializer.initializeStructureGroups($(".structure-group"));
  initializer.selectOnHover();
  initializer.deselectOnClick($("body"));
});
