$(document).ready(function(){
  var initializer = new CORRESPONDENCE.Initializer();
  initializer.initializeStructureGroups($(".structure-group"));
  initializer.deselectOnClick($("body"));
  $(initializer).on("mouseEnterItem", 
                    function(event, item) { initializer.setSelected(item); });
});
