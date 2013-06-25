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
    * The current selected item can also be de-selected by clicking anywhere outside an item.
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

var CORRESPONDENCE = {};

(function(lib) {

  function Initializer() {
    this.itemIdDataAttribute = "id";
    this.structureElementSelector = ".structure";
    this.currentSelectedElement = null;
    $this = this;
    // Define mouse-over interaction to select item moused over.
    $("[data-" + this.itemIdDataAttribute + "]").mouseenter(
      function(event) {
        $($this).trigger("mouseEnterItem", [event.target]);
      });
    $("body").click(
      function(event) {
        if ($(event.target).attr("data-id") == null) {
          $($this).trigger("clickOutsideItems");
        }
      });
  }

  Initializer.prototype = {
    /** Initialise all the structure groups, using the specified data-* attribute for ID. */
    initializeStructureGroups: function(selector) {
      $this = this;
      selector.each(
        function(index, structureGroup) {
          $this.initializeStructureData(structureGroup)
        });
    }, 
    
    // Clear the currently selected item (and un-highlight any associated siblings and cousins)
    clearCurrentSelection: function() {
      if (this.currentSelectedElement != null) {
        this.currentSelectedElement.data("selectedStyleTarget").removeStyle();
        this.removeStyles(this.currentSelectedElement.data("siblings"));
        this.removeStyles(this.currentSelectedElement.data("cousins"));
        this.currentSelectedElement = null;
      }
    }, 

    // Set a given item as the currently selected item (highlight any associated siblings and cousins)
    setSelected: function(element) {
      this.clearCurrentSelection();
      $element = $(element);
      $element.data("selectedStyleTarget").addStyle();
      this.addStyles($element.data("siblings"));
      this.addStyles($element.data("cousins"));
      this.currentSelectedElement = $element;
    }, 
    
    /** From the specified data attribute, insert item into a map of items, indexed by the item's ID.
        Associated items in a structure group have the same ID, so each item is held in an array of items
        with the same ID.
    */
    indexItemByItemId: function(itemsMap, item) {
      var itemId = item.data(this.itemIdDataAttribute);
      var itemsForItemId = itemsMap[itemId];
      if (itemsForItemId === undefined) {
        itemsForItemId = [];
        itemsMap[itemId] = itemsForItemId;
      }
      itemsForItemId.push(item[0]);
    }, 
    
    /** Create a style target on a DOM element for a given class suffix (representing a state description) 
        For example, if the first CSS class is "word", and the intended state is "selected", 
        the style target will have classes "selected" and "word-selected" (in that order).
        If there is no existing CSS class, then the classes to add would just be the one class "selected".
    */
    createStyleTarget: function(element, classSuffix) {
      var classNames = $(element).attr("class").split(" ");
      var targetStyleClass = classNames.length > 0 
        ? classSuffix + " " + classNames[0] + "-" + classSuffix 
        : classSuffix;
      return new StyleTarget($(element), targetStyleClass);
    }, 

    /** Add the styles for an array of style targets. */
    addStyles: function(items) {
      for (var i=0; i<items.length; i++) {
        items[i].addStyle();
      }
    }, 

    /** Remove the styles for an array of style targets. */
    removeStyles: function(items) {
      for (var i=0; i<items.length; i++) {
        items[i].removeStyle();
      }
    }, 
    
    /** Initialise the structures and items in a given structure group. */
    initializeStructureData: function(structureGroup) {
      // set "structureId" data value, and add each item to indexItemByItemId, initialize "siblings" & "cousins" data values
      var itemsByItemId = {}; // the items map for all items in this structure group
      var itemSelector = "[data-" + this.itemIdDataAttribute + "]";
      $this = this;
      $(structureGroup).find(this.structureElementSelector).each( // for each structure in this structure group
        function(index, structure) {
          var structureId = index;
          $(structure).find(itemSelector).each( // for each item in the structure
            function(index, item) {
              var $item = $(item);
              $item.data("structureId", structureId); // pointer to parent structure
              
              $item.data("selectedStyleTarget", 
                         $this.createStyleTarget(item, "selected")); // style target for this item to become selected
              $item.data("siblings", []); // list of sibling style targets (yet to be populated)
              $item.data("cousins", []); // list of cousin style targets (yet to be populated)
              $this.indexItemByItemId(itemsByItemId, $item); // index this item within it's structure group
            });
        });
      /* For each item in structure group, determine which other items are siblings (in the same structure) 
         or cousins (in a different structure) with the same id, and create the relevant style targets. */
      $(structureGroup).find(itemSelector).each( // for each item in the structure group
        function(index, item) {
          var $item = $(item);
          var itemId = $item.data("id");
          var structureId = $item.data("structureId"); // structure ID of this item
          var itemsForItemId = itemsByItemId[itemId];
          var siblings = $item.data("siblings");
          var cousins = $item.data("cousins");
          for (var i=0; i<itemsForItemId.length; i++) { // for all items with the same ID
            var otherItem = itemsForItemId[i];
            if (item != otherItem) {
              var otherItemStructureId = $(otherItem).data("structureId"); // structure ID of the other item
              if (structureId == otherItemStructureId) {
                siblings.push($this.createStyleTarget(otherItem, "highlighted"));
              }
              else {
                cousins.push($this.createStyleTarget(otherItem, "highlighted"));
              }
            }
          }
        });
    }
    
  };

  /** A "style target" is an intention to add or remove a class or classes to a DOM element
      (as specified by a JQuery selector) */
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

  // export public classes
  lib.Initializer = Initializer;
  
})(CORRESPONDENCE);
