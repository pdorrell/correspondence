var dataAttributeNameForItemId = "id";

$(document).ready(function(){
  initializeStructureGroups(dataAttributeNameForItemId);
        
  $("[data-" + dataAttributeNameForItemId + "]").hover(
    function() {
      setSelected($(this));
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

function indexItemByItemId(dataAttributeNameForItemId, itemsMap, item) {
  var itemId = item.data(dataAttributeNameForItemId);
  var itemsForItemId = itemsMap[itemId];
  if (itemsForItemId === undefined) {
    itemsForItemId = [];
    itemsMap[itemId] = itemsForItemId;
  }
  itemsForItemId.push(item[0]);
}

function initializeStructureGroups(dataAttributeNameForItemId) {
  $(".structure-group").each(
    function(index, structureGroup) {
      var itemsByItemId = {};
      initializeStructureData(structureGroup, itemsByItemId, dataAttributeNameForItemId)
    });
}

function createStyleTarget(element, classSuffix) {
  var classNames = $(element).attr("class").split(" ");
  var targetStyleClass = classNames.length > 0 
    ? classSuffix + " " + classNames[0] + "-" + classSuffix 
    : classSuffix;
  return new StyleTarget($(element), targetStyleClass);
}

function initializeStructureData(structureGroup, itemsMap, dataAttributeNameForItemId) {
  // set "structureId" data value, and add each item to indexItemByItemId, initialize "siblings" & "cousins" data values
  $(structureGroup).find(".structure").each(
    function(index, structure) {
      var structureId = index;
      $(structure).find("[data-" + dataAttributeNameForItemId + "]").each(
        function(index, item) {
          var $item = $(item);
          $item.data("structureId", structureId);
          $item.data("selectedStyleTarget", createStyleTarget(item, "selected"));
          $item.data("siblings", []);
          $item.data("cousins", []);
          indexItemByItemId(dataAttributeNameForItemId, itemsMap, $item);
        });
    });
  /* For each item in structure group, determine which other items are siblings (in the same structure) 
     or cousins (in a different structure) with the same id */
  $(structureGroup).find("[data-" + dataAttributeNameForItemId + "]").each(
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
            siblings.push(createStyleTarget(otherItem, "highlighted"));
          }
          else {
            cousins.push(createStyleTarget(otherItem, "highlighted"));
          }
        }
      }
    });
}

var currentSelectedElement = null;

function addStyles(items) {
  for (var i=0; i<items.length; i++) {
    items[i].addStyle();
  }
}

function removeStyles(items) {
  for (var i=0; i<items.length; i++) {
    items[i].removeStyle();
  }
}

function StyleTarget($element, styleClass) {
  this.$element = $element;
  this.styleClass = styleClass;
}

StyleTarget.prototype = {
  addStyle: function() {
    this.$element.addClass(this.styleClass);
  }, 
  removeStyle: function() {
    this.$element.removeClass(this.styleClass);
  }
}

function clearCurrentSelectedElement() {
  if (currentSelectedElement != null) {
    currentSelectedElement.data("selectedStyleTarget").removeStyle();
    removeStyles(currentSelectedElement.data("siblings"));
    removeStyles(currentSelectedElement.data("cousins"));
    currentSelectedElement = null;
  }
}  

function setSelected(element) {
  clearCurrentSelectedElement();
  element.data("selectedStyleTarget").addStyle();
  addStyles(element.data("siblings"));
  addStyles(element.data("cousins"));
  currentSelectedElement = element;
}
