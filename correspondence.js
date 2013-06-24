
$(document).ready(function(){
  initializeStructureData(itemsByCorrId);
        
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

function indexItemByCorrId(itemsMap, item) {
  var corrId = item.data("corrid");
  var itemsForCorrId = itemsMap[corrId];
  if (itemsForCorrId === undefined) {
    itemsForCorrId = [];
    itemsMap[corrId] = itemsForCorrId;
  }
  itemsForCorrId.push(item[0]);
}

function initializeStructureData(itemsMap) {
  // set "structid" data value, and add each item to indexItemByCorrId, initialize "siblings" & "cousins" data values
  $(".structure").each(
    function(index, structure) {
      var structureId = $(structure).data("id");
      $(structure).find("[data-corrid]").each(
        function(index, item) {
          $(item).data("structid", structureId);
          $(item).data("siblings", []);
          $(item).data("cousins", []);
          indexItemByCorrId(itemsMap, $(item));
        });
    });
  $("[data-corrid]").each(
    function(index, item) {
      var $item = $(item);
      var corrId = $item.data("corrid");
      var structId = $item.data("structid");
      var itemsForCorrId = itemsMap[corrId];
      var siblings = $item.data("siblings");
      var cousins = $item.data("cousins");
      for (var i=0; i<itemsForCorrId.length; i++) {
        var otherItem = itemsForCorrId[i];
        var otherItemStructId = $(otherItem).data("structid");
        if (item != otherItem) {
          if (structId == otherItemStructId) {
            siblings.push(otherItem);
          }
          else {
            cousins.push(otherItem);
          }
        }
      }
    });
}

var currentSelectedElement = null;

function unhighlightItems(items) {
  for (var i=0; i<items.length; i++) {
    $(items[i]).find("span").removeClass("highlighted");
  }
}

function highlightItems(items) {
  for (var i=0; i<items.length; i++) {
    $(items[i]).find("span").addClass("highlighted");
  }
}

function clearCurrentSelectedElement() {
  if (currentSelectedElement != null) {
    currentSelectedElement.find("span").removeClass("selected");
    var siblings = currentSelectedElement.data("siblings");
    var cousins = currentSelectedElement.data("cousins");
    unhighlightItems(siblings);
    unhighlightItems(cousins);
    currentSelectedElement = null;
  }
}  

function setHovering(element) {
  clearCurrentSelectedElement();
  element.find("span").addClass("selected");
  var siblings = element.data("siblings");
  var cousins = element.data("cousins");
  highlightItems(siblings);
  highlightItems(cousins);
  currentSelectedElement = element;
}
