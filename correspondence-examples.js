$(document).ready(function(){
  var initializer = new CORRESPONDENCE.StructureGroups();
  initializer.initializeStructureGroups($(".structure-group"));
  $(initializer).on("mouseEnterItem", 
                    function(event, item) { initializer.setSelected(item); });
  $(initializer).on("clickOutsideItems", 
                    function(event) { initializer.clearCurrentSelection(); });
});
