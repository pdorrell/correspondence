$(document).ready(function(){
  var initializer = new CORRESPONDENCE.Initializer();
  initializer.initializeStructureGroups($(".structure-group"));
  $(initializer).on("mouseEnterItem", 
                    function(event, item) { initializer.setSelected(item); });
  $(initializer).on("clickOutsideItems", 
                    function(event) { initializer.clearCurrentSelection(); });
});
