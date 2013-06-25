/** 
    This file is part of Correspondence.

    Correspondence is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    Correspondence is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with Correspondence.  If not, see <http://www.gnu.org/licenses/>.

    Correspondence
    ============== 
    
    Interactive visualisation of correspondences between different translations of the same content.
    
    Copyright (2013) Philip Dorrell (thinkinghard.com)
    

    Correspondence defines related items in different related structures that relate to each other.
 
    Basic concepts
    --------------
    
    Structure Group. A group of related structures, defined by a DOM element (e.g. <div>) with CSS class "structure-group".
    
    Structure. Defined by a DOM element (e.g. <div>) inside a structure group with CSS class "structure"
    
    Item. Defined by a DOM element inside a structure with an ID attribute "data-id".
    
    Within a structure, items with the same ID are considered "siblings".
    
    Within a structure group, items with the same ID but not in the same structure are considered "cousins".
    
    There is no relationship between items in different structure groups - i.e. any structure group should be regarded
    as independent of any other structure group.
    
    The default user interaction is as follows:
    
    * At any one time, there is at most one "selected" item.
    * When the user mouses over an item, that item becomes "selected", and any current selected item gets de-selected.
    * When an item is selected, the state of it's siblings and cousins changes:
    * Siblings enter a "highlighted" state.
    * Cousins enter a "highlighted" state. (The default interaction does not treat siblings different from cousins, 
                                            but alternative interactions could treat them differently.)
    * In the default interaction, an item remains selected until another item is selected (i.e. it is not deselected when 
      the user mouses out of the item).
    * Associated siblings and cousins are un-highlighted when the selected item becomes de-selected.
                                           
    The "highlighted" and "selected" states are managed by changing an item's CSS classes. This happens as follows:
    * An item has a "primary" CSS class, which is the first CSS class in it's "class" attribute (if any).
    * In a given state, a CSS class for the state is added, and, if there is a primary CSS class, a CSS class is 
      added consisting of the primary class joined to the state class by a hyphen.
    * When exiting a state, the added CSS classes are removed.
 
    For example, an item with no primary CSS class entering the "selected" state would have the 
    CSS class "selected" added.

    And an item with primary CSS class "word" entereing the "highlighted" state would add 
    two CSS classes: "highlighted" and "word-highlighted". (Note that dues to CSS application 
    rules, any properties in "word-highlighted" will over-ride any identical properties in "highlighted", 
    and both those classes will override any properties in the primary class, or
    in any other CSS classes that the item has in its initial state.)
 
 */

var dataAttributeNameForItemId = "id"; // unique IDs for items will be specified by "data-id" attribute

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
