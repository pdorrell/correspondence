
$(document).ready(function(){
  initializeStructureData();
        
  $("[data-corrid]").hover(
    function() {
      setHovering($(this));
    }, 
    function() {
      // nothing to unhover
    });
  $("body").click(
    function(event) {
      if (this == event.target) { // click outside of any inner elements to clear any current highlight
        clearCurrentSelectedElement();
      }
    });
});

var itemsByCorrId = {}

function indexItemByCorrId(item) {
  var corrId = item.data("corrid");
  var itemsForCorrId = itemsByCorrId[corrId];
  if (itemsForCorrId === undefined) {
    itemsForCorrId = [];
    itemsByCorrId[corrId] = itemsForCorrId;
  }
  itemsForCorrId.push(item[0]);
}

function initializeStructureData() {
  // set "structid" data value, and add each item to indexItemByCorrId, initialize "siblings" & "cousins" data values
  $(".structure").each(
    function(index, structure) {
      var structureId = $(structure).data("id");
      $(structure).find("[data-corrid]").each(
        function(index, item) {
          $(item).data("structid", structureId);
          $(item).data("siblings", []);
          $(item).data("cousins", []);
          indexItemByCorrId($(item));
        });
    });
  $("[data-corrid]").each(
    function(index, item) {
      var $item = $(item);
      var corrId = $item.data("corrid");
      var structId = $item.data("structid");
      var itemsForCorrId = itemsByCorrId[corrId];
      var siblings = $item.data("siblings", []);
      var cousins = $item.data("cousins", []);
      for (var i=0; i<itemsForCorrId.length; i++) {
        var otherItem = $(itemsForCorrId[i]);
        var otherItemStructId = otherItem.data("structid");
        if (item != otherItem) {
          if (structId == otherItemStructId) {
            siblings.push(otherItem[0]);
          }
          else {
            cousins.push(otherItem[0]);
          }
        }
      }
    });
}

var currentSelectedElement = null;

function clearCurrentSelectedElement() {
  if (currentSelectedElement != null) {
    currentSelectedElement.find("span").removeClass("selected");
    currentSelectedElement = null;
  }
}  

function setHovering(element) {
  clearCurrentSelectedElement();
  element.find("span").addClass("selected");
  currentSelectedElement = element;
}
