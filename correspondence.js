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
  
  /** Add the styles for an array of style targets. */
  function addStyles(items) {
    for (var i=0; i<items.length; i++) {
      items[i].addStyle();
    }
  }

  /** Remove the styles for an array of style targets. */
  function removeStyles(items) {
    for (var i=0; i<items.length; i++) {
      items[i].removeStyle();
    }
  }
    
  /** From the specified data attribute, insert item into a map of items, indexed by the item's ID.
      Associated items in a structure group have the same ID, so each item is held in an array of items
      with the same ID.
  */
  function indexItemByItemId(itemsMap, item) {
    var itemId = item.data("id");
    var itemsForItemId = itemsMap[itemId];
    if (itemsForItemId === undefined) {
      itemsForItemId = [];
      itemsMap[itemId] = itemsForItemId;
    }
    itemsForItemId.push(item[0]);
  }
    
  function ElementSelection() {
    this.currentSelectedElement = null;
  }
  
  ElementSelection.prototype = {
    clear: function() {
      if (this.currentSelectedElement != null) {
        $currentSelectedElement = $(this.currentSelectedElement);
        $currentSelectedElement.data("selectedStyleTarget").removeStyle();
        removeStyles($currentSelectedElement.data("siblings"));
        removeStyles($currentSelectedElement.data("cousins"));
        this.currentSelectedElement = null;
      }
    }, 

    // Set a given item as the currently selected item (highlight any associated siblings and cousins)
    setSelected: function(element, showSiblings, showCousins) {
      this.clear();
      $element = $(element);
      $element.data("selectedStyleTarget").addStyle();
      if (showSiblings) {
        addStyles($element.data("siblings"));
      }
      if (showCousins) {
        addStyles($element.data("cousins"));
      }
      this.currentSelectedElement = element;
    }, 
    
    showCousins: function() {
      if (this.currentSelectedElement != null) {
        addStyles($(this.currentSelectedElement).data("cousins"));
      }
    }
    
  };
  
  function StructureGroup(structureGroup) {
    this.structureGroup = structureGroup;
    this.initializeStructures(this.structureGroup);
  }
  
  var interleaveCheckboxId = 0;
  
  StructureGroup.prototype = {
    
    setupInterleavingIfRelevant: function() {
      var structuresSelector = $(this.structureGroup).find(".structure");
      if(structuresSelector.length >= 1) {
        var firstStructure = structuresSelector[0];
        var firstStructureItemGroupsSelector = $(firstStructure).find(".item-group");
        if (firstStructureItemGroupsSelector.length > 1) {
          this.setupInterleaving(structuresSelector, firstStructureItemGroupsSelector)
        }
      }
    }, 
    
    setupInterleaving: function(structuresSelector, firstStructureItemGroupsSelector) {
      interleaveCheckboxId++;
      var checkboxId = "interleave_" + interleaveCheckboxId;
      var checkbox = $('<input type="checkbox" id="' + checkboxId + '"/>');
      var label = $('<div class="interleaved"><label for="' + checkboxId + '">Interleaved</label></div>');
      var labelDiv = $('<div class="interleaved"></div>');
      labelDiv.append(label);
      label.prepend(checkbox);
      $(this.structureGroup).prepend(labelDiv);
      var $this = this;
      checkbox.on("change", function(event) {
        if(this.checked) {
          $this.interleave();
        }
        else {
          $this.uninterleave();
        }
      });
      this.setupInterleavingData(structuresSelector, firstStructureItemGroupsSelector);
    }, 
    
    error: function(message) {
      alert("ERROR: " + message);
    }, 
    
    setupInterleavingData: function(structuresSelector, firstStructureItemGroupsSelector) {
      this.numStructures = structuresSelector.length;
      var itemGroupMaps = new Array(this.numStructures);
      this.itemGroupMaps = itemGroupMaps;
      var $this = this;
      for (var i=0; i<this.numStructures; i++) {
        var structure = structuresSelector[i];
        itemGroupMaps[i] = {};
        $(structure).find(".item-group").each(function(index, itemGroup) {
          var groupId = $(itemGroup).data("group-id");
          if(groupId == undefined) {
            console.log("itemGroup = " + itemGroup.outerHTML);
            $this.error((index+1) + "th item group in " + (i+1) + "th structure has no group ID");
          }
          if (itemGroupMaps[i][groupId]) {
            $this.error((index+1) + "th item group in " + (i+1) + 
                        "th structure has two item groups with group ID " + groupId);
          }
          console.log("map " + i + "/" + groupId + " to " + itemGroup.outerHTML);
          itemGroupMaps[i][groupId] = itemGroup;
        });
      }
    }, 
    
    interleave: function() {
      console.log("interleave ...");
    }, 
    
    uninterleave: function() {
      console.log("uninterleave ...");
    }, 
    
    /** Initialise the structures and items in a given structure group. */
    initializeStructures: function() {
      // set "structureId" data value, and add each item to indexItemByItemId, initialize "siblings" & "cousins" data values
      var itemsByItemId = {}; // the items map for all items in this structure group
      
      this.indexItemsByTheirId(itemsByItemId);
      this.linkSiblingsAndCousins(itemsByItemId);
    }, 
      
    indexItemsByTheirId: function (itemsByItemId) {
      $(this.structureGroup).find(".structure").each( // for each structure in this structure group
        function(index, structure) {
          var structureId = index;
          $(structure).find("[data-id]").each( // for each item in the structure
            function(index, item) {
              var $item = $(item);
              $item.data("structureId", structureId); // pointer to parent structure
              
              $item.data("selectedStyleTarget", 
                         createStyleTarget(item, "selected")); // style target for this item to become selected
              $item.data("siblings", []); // list of sibling style targets (yet to be populated)
              $item.data("cousins", []); // list of cousin style targets (yet to be populated)
              indexItemByItemId(itemsByItemId, $item); // index this item within it's structure group
            });
        });
    }, 
    
    linkSiblingsAndCousins: function (itemsByItemId) {
      /* For each item in structure group, determine which other items are siblings (in the same structure) 
         or cousins (in a different structure) with the same id, and create the relevant style targets. */
      $(this.structureGroup).find("[data-id]").each( // for each item in the structure group
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
                siblings.push(createStyleTarget(otherItem, "highlighted"));
              }
              else {
                cousins.push(createStyleTarget(otherItem, "highlighted"));
              }
            }
          }
        });
    }
  }

  /* Object representing all Structure Groups on a web page.
     Structure Groups are mostly independent of each other, except
     there is only one currently selected item in any structure group.
   */
  function StructureGroups(selector) {
    this.elementSelection = new ElementSelection();
    this.selector = selector;
    var $this = this;
    
    this.structureGroups = []
    var $structureGroups = this.structureGroups;

    // For each structure group DOM element, initialize the corresponding structure group
    selector.each(
      function(index, structureGroup) {
        $structureGroups.push(new StructureGroup(structureGroup));
      });
    
    // Event triggered when mouse enters an item
    selector.find("[data-id]").mouseenter(
      function(event) {
        var eventThis = this;
        $($this).trigger("mouseEnterItem", [eventThis]);
      });
    
    // Event triggered when mouse leaves an item
    selector.find("[data-id]").mouseleave(
      function(event) {
        var eventThis = this;
        $($this).trigger("mouseLeaveItem", [eventThis]);
      });
    
    // Event triggered when clicking anywhere that is not inside an item
    $("body").click(
      function(event) {
        if ($(event.target).attr("data-id") == null) {
          $($this).trigger("clickOutsideItems");
        }
      });
  }

  StructureGroups.prototype = {
    
    setupInterleaving: function() {
      for (var i=0; i<this.structureGroups.length; i++) {
        this.structureGroups[i].setupInterleavingIfRelevant();
      }
    }, 
    
    // Clear the currently selected item (and un-highlight any associated siblings and cousins)
    clearCurrentSelection: function() {
      this.elementSelection.clear();
    }, 

    // Set a given item as the currently selected item (highlight any associated siblings and cousins)
    setSelected: function(element, showSiblings, showCousins) {
      this.elementSelection.setSelected(element, showSiblings, showCousins);
    }, 
    
    showCousinsOfSelectedItem: function() {
      this.elementSelection.showCousins();
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

  /** Create a style target on a DOM element for a given class suffix (representing a state description) 
      For example, if the first CSS class is "word", and the intended state is "selected", 
      the style target will have classes "selected" and "word-selected" (in that order).
      If there is no existing CSS class, then the classes to add would just be the one class "selected".
  */
  function createStyleTarget(element, classSuffix) {
    var classNameString = $(element).attr("class");
    var classNames = classNameString == undefined ? [] : classNameString.split(" ");
    var targetStyleClass = classNames.length > 0 
      ? classSuffix + " " + classNames[0] + "-" + classSuffix 
      : classSuffix;
    return new StyleTarget($(element), targetStyleClass);
  }

  // export public classes
  lib.StructureGroups = StructureGroups;
  
})(CORRESPONDENCE);
