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
    
    Structure Group. A group of related structures, defined by a DOM element (e.g. <div>) with CSS class "translations".
    
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
    * Siblings enter a "match" state.
    * Cousins enter a "match" state. (The default interaction does not treat siblings different from cousins, 
    but alternative interactions could treat them differently.)
    * In the default interaction, an item remains selected until another item is selected (i.e. it is not deselected when 
    the user mouses out of the item).
    * The current selected item can also be de-selected by clicking anywhere outside an item.
    * Associated siblings and cousins are un-match when the selected item becomes de-selected.
    
    The "match" and "selected" states are managed by changing an item's CSS classes. This happens as follows:
    * An item has a "primary" CSS class, which is the first CSS class in it's "class" attribute (if any).
    * In a given state, a CSS class for the state is added, and, if there is a primary CSS class, a CSS class is 
    added consisting of the primary class joined to the state class by a hyphen.
    * When exiting a state, the added CSS classes are removed.
    
    For example, an item with no primary CSS class entering the "selected" state would have the 
    CSS class "selected" added.

    And an item with primary CSS class "word" entereing the "match" state would add 
    two CSS classes: "match" and "word-match". (Note that dues to CSS application 
    rules, any properties in "word-match" will over-ride any identical properties in "match", 
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
    
  /** From the specified data attribute, insert item into a map of items, indexed by each of
      the item's IDs.
      Associated items in a structure group have the same IDs, so each item is held in an array of items
      with the same ID.
  */
  function indexItemByItemIds(itemsMap, item) {
    var itemIds = item.data("itemIds");
    for (var i=0; i<itemIds.length; i++) {
      var itemId = itemIds[i];
      var itemsForItemId = itemsMap[itemId];
      if (itemsForItemId === undefined) {
        itemsForItemId = [];
        itemsMap[itemId] = itemsForItemId;
      }
      itemsForItemId.push(item[0]);
    }
  }
  
  // parse item IDs from comma-separated list e.g "1,3,2" => ["1","3","2"]
  function parseItemIds(itemIdAttribute) {
    var itemIds = itemIdAttribute.toString().split(",");
    return itemIds;
  }
  
  function matchIsPartial(itemIds, otherItemIds) {
    for (var i=0; i<otherItemIds.length; i++) {
      if (itemIds.indexOf(otherItemIds[i]) == -1) {
        return true;
      }
    }
    return false;
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
        var firstStructureItemGroupsSelector = $(firstStructure).find(".line");
        if (firstStructureItemGroupsSelector.length > 1) {
          this.setupInterleaving(structuresSelector, firstStructureItemGroupsSelector)
        }
      }
    }, 
    
    setupInterleaving: function(structuresSelector, firstStructureItemGroupsSelector) {
      structuresSelector.detach();
      this.interleavingSetupErrors = [];
      interleaveCheckboxId++;
      var checkboxId = "interleave_" + interleaveCheckboxId;
      var checkbox = $('<input type="checkbox" id="' + checkboxId + '"/>');
      var label = $('<span class="interleaving-control"><label for="' + checkboxId + '">Interleaved</label></span>');
      var labelDiv = $('<div class="interleaving-control-wrapper"></div>');
      labelDiv.append(label);
      label.prepend(checkbox);
      $(this.structureGroup).append(labelDiv);
      $(this.structureGroup).css("padding-top", 0);
      var $this = this;
      var structuresWrapperDiv = $('<div class="structures-wrapper"></div>');
      structuresSelector.each(function(index, structureElement) {
        $(structuresWrapperDiv).append(structureElement);
      });
      this.structuresWrapperDiv = structuresWrapperDiv;
      $(this.structureGroup).append(structuresWrapperDiv);
      this.setupInterleavingData(structuresSelector, firstStructureItemGroupsSelector);
      if (this.interleavingSetupErrors.length == 0) {
        checkbox.on("change", function(event) {
          if(this.checked) {
            $this.interleave();
          }
          else {
            $this.uninterleave();
          }
        });
      }
    }, 
    
    error: function(message) {
      this.interleavingSetupErrors.push(message);
      alert("ERROR: " + message);
    }, 
    
    setupInterleavingData: function(structuresSelector, firstStructureItemGroupsSelector) {
      this.saveLanguageAnnotations(structuresSelector);
      this.setupInterleavingGroupIds(firstStructureItemGroupsSelector);
      this.setupInterleavingGroupIdMaps(structuresSelector);
    }, 
    
    saveLanguageAnnotations: function(structuresSelector) {
      this.languageAnnotations = new Array(structuresSelector.length);
      for (var i=0; i<structuresSelector.length; i++) {
        var structure = structuresSelector[i];
        this.languageAnnotations[i] = $(structure).find(".language");
      }
    }, 
    
    setupInterleavingGroupIds: function(firstStructureItemGroupsSelector) {
      this.numGroupIds = firstStructureItemGroupsSelector.length;
      this.groupIds = new Array(this.numGroupIds);
      for (var i=0; i<this.numGroupIds; i++) {
        var groupId = $(firstStructureItemGroupsSelector[i]).data("group-id");
        if(groupId == undefined) {
            $this.error((index+1) + "th item group in 1st structure has no group ID");
        }
        this.groupIds[i] = groupId;
      }
    }, 
      
    
    setupInterleavingGroupIdMaps: function(structuresSelector) {
      this.numStructures = structuresSelector.length;
      var itemGroupMaps = new Array(this.numStructures);
      this.itemGroupMaps = itemGroupMaps;
      var structureClassAttributes = new Array(this.numStructures);
      this.structureClassAttributes = structureClassAttributes;
      var $this = this;
      for (var i=0; i<this.numStructures; i++) {
        var structure = structuresSelector[i];
        this.structureClassAttributes[i] = $(structure).attr("class");
        itemGroupMaps[i] = {};
        for (var j=0; j<this.numGroupIds; j++) {
          itemGroupMaps[i][this.groupIds[j]] = null;
        }
        $(structure).find(".line").each(function(index, itemGroup) {
          var groupId = $(itemGroup).data("group-id");
          if(groupId == undefined) {
            $this.error((index+1) + "th item group in " + (i+1) + "th structure has no group ID");
          }
          if (!$.inArray(groupId, this.groupIds)) {
            $this.error((index+1) + "th item group in " + (i+1) + "th structure has group ID " + groupId + 
                        " which does not exist in first structure");
          }
          if (itemGroupMaps[i][groupId]) {
            $this.error((index+1) + "th item group in " + (i+1) + 
                        "th structure has two item groups with group ID " + groupId);
          }
          itemGroupMaps[i][groupId] = itemGroup;
        });
      }
    }, 
    
    interleave: function() {
      $(this.structuresWrapperDiv).find(".structure").detach();
      var structuresWrapperDiv = this.structuresWrapperDiv;
      for (var i=0; i<this.numGroupIds; i++) {
        var groupId = this.groupIds[i];
        var interleavedGroupDiv = $('<div class="interleaved-group"></div>');
        for (var j=0; j<this.numStructures; j++) {
          var itemGroup = this.itemGroupMaps[j][groupId];
          if (itemGroup != null) {
            var structureDiv = $('<div></div>');
            var $structureDiv = $(structureDiv);
            $structureDiv.attr("class", this.structureClassAttributes[j]);
            if(i == 0) {
              for (var k=0; k<this.languageAnnotations[j].length; k++) {
                $structureDiv.append(this.languageAnnotations[j][k]);
              }
            }
            $structureDiv.append(itemGroup);
            $(interleavedGroupDiv).append(structureDiv);
          }
        }
        $(structuresWrapperDiv).append(interleavedGroupDiv);
      }
    }, 
    
    uninterleave: function() {
      $(this.structuresWrapperDiv).find(".interleaved-group").detach();
      for (var i=0; i<this.numStructures; i++) {
        var structureDiv = $('<div></div>');
        var $structureDiv = $(structureDiv);
        $structureDiv.attr("class", this.structureClassAttributes[i]);
        for (var k=0; k<this.languageAnnotations[i].length; k++) {
          $structureDiv.append(this.languageAnnotations[i][k]);
        }
        $(this.structuresWrapperDiv).append(structureDiv);
        for (var j=0; j<this.numGroupIds; j++) {
          var groupId = this.groupIds[j];
          var itemGroup = this.itemGroupMaps[i][groupId];
          if (itemGroup != null) {
            $structureDiv.append(itemGroup);
          }
        }
      }
    }, 
    
    /** Initialise the structures and items in a given structure group. */
    initializeStructures: function() {
      // set "structureId" data value, and add each item to indexItemByItemId, initialize "siblings" & "cousins" data values
      var itemsByItemId = {}; // the items map for all items in this structure group
      this.addStructureItemClassToItems();
      this.indexItemsByTheirId(itemsByItemId);
      this.linkSiblingsAndCousins(itemsByItemId);
    }, 
    
    /** Items are identified by "data-id" attribute, so they don't actually have any 
        specific CSS class. This method specifically adds in the "structure-item" class. */
    addStructureItemClassToItems: function () {
      $(this.structureGroup).find(".structure").each( // for each structure in this structure group
        function(index, structure) {
          $(structure).find("[data-id]").each( // for each item in the structure
            function(index, item) {
              var $item = $(item);
              $item.addClass("structure-item unhighlighted");
            });
        });
    }, 
      
    indexItemsByTheirId: function (itemsByItemId) {
      $(this.structureGroup).find(".structure").each( // for each structure in this structure group
        function(index, structure) {
          var structureId = index;
          $(structure).find("[data-id]").each( // for each item in the structure
            function(index, item) {
              var $item = $(item);
              var itemIdAttribute = $item.data("id");
              $item.data("structureId", structureId); // pointer to parent structure
              $item.data("itemIds", parseItemIds(itemIdAttribute));
              $item.data("selectedStyleTarget", 
                         createStyleTarget(item, "selected", 
                                           "unhighlighted")); // style target for this item to become selected
              $item.data("siblings", []); // list of sibling style targets (yet to be populated)
              $item.data("cousins", []); // list of cousin style targets (yet to be populated)
              indexItemByItemIds(itemsByItemId, $item); // index this item within it's structure group
            });
        });
    }, 
    
    linkSiblingsAndCousins: function (itemsByItemId) {
      /* For each item in structure group, determine which other items are siblings (in the same structure) 
         or cousins (in a different structure) with the same id, and create the relevant style targets. */
      $(this.structureGroup).find("[data-id]").each( // for each item in the structure group
        function(index, item) {
          var $item = $(item);
          var itemIds = $item.data("itemIds");
          var structureId = $item.data("structureId"); // structure ID of this item
          var siblings = $item.data("siblings");
          var cousins = $item.data("cousins");
          var itemsFound = [];
          for (var i=0; i<itemIds.length; i++) { // for each ID that the item has
            var itemId = itemIds[i];
            var itemsForItemId = itemsByItemId[itemId];
            for (var j=0; j<itemsForItemId.length; j++) { // for all other items with this ID
              var otherItem = itemsForItemId[j];
              if (itemsFound.indexOf(otherItem) == -1) { // don't include items that we've already included
                itemsFound.push(otherItem);
                if (item != otherItem) {
                  var otherItemStructureId = $(otherItem).data("structureId"); // structure ID of the other item
                  var otherItemIds = $(otherItem).data("itemIds");
                  var matchStyleClass = matchIsPartial(itemIds, otherItemIds) ? "partial-match" : "match";
                  if (structureId == otherItemStructureId) {
                    siblings.push(createStyleTarget(otherItem, matchStyleClass, "unhighlighted"));
                  }
                  else {
                    cousins.push(createStyleTarget(otherItem, matchStyleClass, "unhighlighted"));
                  }
                }
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
      (as specified by a JQuery selector).
      There is also a "default" style class, which explicitly represents the element
      being in an "unstyled" state. (This is to deal with issues about CSS priority rules.)
      */
  function StyleTarget($element, styleClass, defaultStyleClass) {
    this.$element = $element;
    this.styleClass = styleClass;
    this.defaultStyleClass = defaultStyleClass;
  }

  StyleTarget.prototype = {
    addStyle: function() {
      this.$element.addClass(this.styleClass);
      this.$element.removeClass(this.defaultStyleClass);
    }, 
    removeStyle: function() {
      this.$element.removeClass(this.styleClass);
      this.$element.addClass(this.defaultStyleClass);
    }
  }

  /** Create a style target on a DOM element for a given class suffix (representing a state description) 
      For example, if the first CSS class is "word", and the intended state is "selected", 
      the style target will have classes "selected" and "word-selected" (in that order).
      If there is no existing CSS class, then the classes to add would just be the one class "selected".
  */
  function createStyleTarget(element, classSuffix, defaultStyleClass) {
    var classNameString = $(element).attr("class");
    var classNames = classNameString == undefined ? [] : classNameString.split(" ");
    var targetStyleClass = classNames.length > 0 
      ? classSuffix + " " + classNames[0] + "-" + classSuffix 
      : classSuffix;
    return new StyleTarget($(element), targetStyleClass, defaultStyleClass);
  }

  // export public classes
  lib.StructureGroups = StructureGroups;
  
})(CORRESPONDENCE);
