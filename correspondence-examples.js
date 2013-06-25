$(document).ready(function(){
  var initializer = new Initializer();
  initializer.initializeStructureGroups($(".structure-group"));
  initializer.selectOnHover();
  initializer.deselectOnClick($("body"));
});
