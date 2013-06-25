$(document).ready(function(){
  var structureGroups = new CORRESPONDENCE.StructureGroups($(".structure-group"));

  $(structureGroups).on("mouseEnterItem", 
                        function(event, item) { structureGroups.setSelected(item); });
  
  $(structureGroups).on("clickOutsideItems", 
                        function(event) { structureGroups.clearCurrentSelection(); });
});
