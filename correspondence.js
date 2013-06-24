
$(document).ready(function(){
  initializeStructureGroups();
        
  $("[data-id]").hover(
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

function indexItemByItemId(itemsMap, item) {
  var itemId = item.data("id");
  var itemsForItemId = itemsMap[itemId];
  if (itemsForItemId === undefined) {
    itemsForItemId = [];
    itemsMap[itemId] = itemsForItemId;
  }
  itemsForItemId.push(item[0]);
}

function initializeStructureGroups() {
  $(".structure-group").each(
    function(index, structureGroup) {
      var itemsByItemId = {};
      initializeStructureData(structureGroup, itemsByItemId)
    });
}

function initializeStructureData(structureGroup, itemsMap) {
  // set "structid" data value, and add each item to indexItemByItemId, initialize "siblings" & "cousins" data values
  $(structureGroup).find(".structure").each(
    function(index, structure) {
      var structureId = index;
      $(structure).find("[data-id]").each(
        function(index, item) {
          $(item).data("structureId", structureId);
          $(item).data("siblings", []);
          $(item).data("cousins", []);
          indexItemByItemId(itemsMap, $(item));
        });
    });
  $(structureGroup).find("[data-id]").each(
    function(index, item) {
      var $item = $(item);
      var itemId = $item.data("id");
      var structureId = $item.data("structureId");
      var itemsForItemId = itemsMap[itemId];
      var siblings = $item.data("siblings");
      var cousins = $item.data("cousins");
      for (var i=0; i<itemsForItemId.length; i++) {
        var otherItem = itemsForItemId[i];
        var otherItemStructureId = $(otherItem).data("structureId");
        if (item != otherItem) {
          if (structureId == otherItemStructureId) {
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
