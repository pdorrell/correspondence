$(document).ready(function(){
  var translations = new CORRESPONDENCE.Translations($(".translation"));
  
  translations.setupInterleaving();

  var showSiblings = true;
  var alwaysShowCousins = true;
  var ctrlKeyIsDown = false;
  $(translations).on("mouseEnterItem", 
                     function(event, item) { 
                       translations.setSelected(item, showSiblings, 
                                                alwaysShowCousins || ctrlKeyIsDown); 
                     });
  
  $(document).keydown(function(event) {
    if (event.which == 17) { // ctrl
      if (!alwaysShowCousins) {
        translations.showCousinsOfSelectedItem();
      }
      ctrlKeyIsDown = true;
    }
  });
  
  $("#showCousinsWithCtrl").change(function(event) {
    alwaysShowCousins = !this.checked;
  });
  
  $(document).keyup(function(event) {
    if (event.which == 17) { // ctrl
      ctrlKeyIsDown = false;
    }
  });
  
  $(translations).on("clickOutsideItems", 
                     function(event) { translations.clearCurrentSelection(); });
});
