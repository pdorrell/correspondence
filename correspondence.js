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
    

    Correspondence defines related items in different related blocks that relate to each other.
    
    Basic concepts
    --------------
    
    Translation. A group of blocks, each of which expresses the same content in a different language. 
       Defined by a DOM element (e.g. <div>) with CSS class "translation".
    
    Block. Defined by a DOM element (e.g. <div>) inside a Translation with CSS class "block".
       A block might be a paragraph, or a verse of a song, or a function definition in a programming language.
       
    Line. A sequence of items and other text which constitute part of a block.
       A line could be a sentence, or an actual line within a paragraph, or a line of a song, or a line of code in a program.
       Sometimes a line might be displayed as two or more actual lines on the page. A line is defined by a DOM element
       inside a Block with an ID attribute "data-line-id". (Division of Blocks into Lines is optional.)
    
    Item. Defined by a DOM element inside a Block (and maybe inside a Line inside a Block) with an ID attribute "data-id".
    
    Within a Block, Items with the same ID are considered "siblings".
       A single Item with a unique ID, or a group of Items with the same ID, constitute a "unit of meaning" that can be translated.
    
    Within a translation, Items with the same ID but not in the same block are considered "cousins".
    
    There is no relationship between Items in different translations - i.e. any translation should be regarded
    as independent of any other translation.
    
    The default user interaction is as follows:
    
    * At any one time, there is at most one "selected" Item.
    * When the user mouses over an Item, that Item becomes "selected", and any current selected Item gets de-selected.
    * When an Item is selected, the state of it's siblings and cousins changes:
    * Siblings enter a "match" state.
    * Cousins enter a "match" state. (The default interaction does not treat siblings different from cousins, 
    but alternative interactions could treat them differently.)
    * In the default interaction, an Item remains selected until another Item is selected (i.e. it is not deselected when 
    the user mouses out of the Item).
    * The current selected Item can also be de-selected by clicking anywhere outside an Item.
    * Associated siblings and cousins are un-match when the selected Item becomes de-selected.
    
    The "match" and "selected" states are managed by changing an Item's CSS classes. This happens as follows:
    * An Item has a "primary" CSS class, which is the first CSS class in it's "class" attribute (if any).
    * In a given state, a CSS class for the state is added, and, if there is a primary CSS class, a CSS class is 
    added consisting of the primary class joined to the state class by a hyphen.
    * When exiting a state, the added CSS classes are removed.
    
    For example, an Item with no primary CSS class entering the "selected" state would have the 
    CSS class "selected" added.

    And an Item with primary CSS class "word" entereing the "match" state would add 
    two CSS classes: "match" and "word-match". (Note that dues to CSS application 
    rules, any properties in "word-match" will over-ride any identical properties in "match", 
    and both those classes will override any properties in the primary class, or
    in any other CSS classes that the Item has in its initial state.)
    
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
      Associated items in a translation have the same IDs, so each item is held in an array of items
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
  
  function Translation(translation) {
    this.translation = translation;
    this.initializeBlocks(this.translation);
  }
  
  var interleaveCheckboxId = 0;
  
  Translation.prototype = {
    
    setupInterleavingIfRelevant: function() {
      var blocksSelector = $(this.translation).find(".block");
      if(blocksSelector.length >= 1) {
        var firstBlock = blocksSelector[0];
        var firstBlockLinesSelector = $(firstBlock).find(".line");
        if (firstBlockLinesSelector.length > 1) {
          this.setupInterleaving(blocksSelector, firstBlockLinesSelector)
        }
      }
    }, 
    
    setupInterleaving: function(blocksSelector, firstBlockLinesSelector) {
      blocksSelector.detach();
      this.interleavingSetupErrors = [];
      interleaveCheckboxId++;
      var checkboxId = "interleave_" + interleaveCheckboxId;
      var checkbox = $('<input type="checkbox" id="' + checkboxId + '"/>');
      var label = $('<span class="interleaving-control"><label for="' + checkboxId + '">Interleaved</label></span>');
      var labelDiv = $('<div class="interleaving-control-wrapper"></div>');
      labelDiv.append(label);
      label.prepend(checkbox);
      $(this.translation).append(labelDiv);
      if ($(this.translation).children(".title").length == 0) {
        $(this.translation).css("padding-top", 0);
      }
      var $this = this;
      var blocksWrapperDiv = $('<div class="blocks-wrapper"></div>');
      blocksSelector.each(function(index, blockElement) {
        $(blocksWrapperDiv).append(blockElement);
      });
      this.blocksWrapperDiv = blocksWrapperDiv;
      $(this.translation).append(blocksWrapperDiv);
      this.setupInterleavingData(blocksSelector, firstBlockLinesSelector);
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
    
    setupInterleavingData: function(blocksSelector, firstBlockLinesSelector) {
      this.saveLanguageAnnotations(blocksSelector);
      this.setupInterleavingLineIds(firstBlockLinesSelector);
      this.setupInterleavingLineIdMaps(blocksSelector);
    }, 
    
    saveLanguageAnnotations: function(blocksSelector) {
      this.languageAnnotations = new Array(blocksSelector.length);
      for (var i=0; i<blocksSelector.length; i++) {
        var block = blocksSelector[i];
        this.languageAnnotations[i] = $(block).find(".language");
      }
    }, 
    
    setupInterleavingLineIds: function(firstBlockLinesSelector) {
      this.numLineIds = firstBlockLinesSelector.length;
      this.lineIds = new Array(this.numLineIds);
      for (var i=0; i<this.numLineIds; i++) {
        var lineId = $(firstBlockLinesSelector[i]).data("line-id");
        if(lineId == undefined) {
            $this.error((index+1) + "th line in 1st block has no line ID");
        }
        this.lineIds[i] = lineId;
      }
    }, 
      
    
    setupInterleavingLineIdMaps: function(blocksSelector) {
      this.numBlocks = blocksSelector.length;
      var lineMaps = new Array(this.numBlocks);
      this.lineMaps = lineMaps;
      var blockClassAttributes = new Array(this.numBlocks);
      this.blockClassAttributes = blockClassAttributes;
      var $this = this;
      for (var i=0; i<this.numBlocks; i++) {
        var block = blocksSelector[i];
        this.blockClassAttributes[i] = $(block).attr("class");
        lineMaps[i] = {};
        for (var j=0; j<this.numLineIds; j++) {
          lineMaps[i][this.lineIds[j]] = null;
        }
        $(block).find(".line").each(function(index, line) {
          var lineId = $(line).data("line-id");
          if(lineId == undefined) {
            $this.error((index+1) + "th line in " + (i+1) + "th block has no line ID");
          }
          if (!$.inArray(lineId, this.lineIds)) {
            $this.error((index+1) + "th line in " + (i+1) + "th block has line ID " + lineId + 
                        " which does not exist in first block");
          }
          if (lineMaps[i][lineId]) {
            $this.error((index+1) + "th line in " + (i+1) + 
                        "th block has two lines with line ID " + lineId);
          }
          lineMaps[i][lineId] = line;
        });
      }
    }, 
    
    interleave: function() {
      $(this.blocksWrapperDiv).find(".block").detach();
      var blocksWrapperDiv = this.blocksWrapperDiv;
      for (var i=0; i<this.numLineIds; i++) {
        var lineId = this.lineIds[i];
        var interleavedBlockDiv = $('<div class="interleaved-block"></div>');
        for (var j=0; j<this.numBlocks; j++) {
          var line = this.lineMaps[j][lineId];
          if (line != null) {
            var blockDiv = $('<div></div>');
            var $blockDiv = $(blockDiv);
            $blockDiv.attr("class", this.blockClassAttributes[j]);
            if(i == 0) {
              for (var k=0; k<this.languageAnnotations[j].length; k++) {
                $blockDiv.append(this.languageAnnotations[j][k]);
              }
            }
            $blockDiv.append(line);
            $(interleavedBlockDiv).append(blockDiv);
          }
        }
        $(blocksWrapperDiv).append(interleavedBlockDiv);
      }
    }, 
    
    uninterleave: function() {
      $(this.blocksWrapperDiv).find(".interleaved-block").detach();
      for (var i=0; i<this.numBlocks; i++) {
        var blockDiv = $('<div></div>');
        var $blockDiv = $(blockDiv);
        $blockDiv.attr("class", this.blockClassAttributes[i]);
        for (var k=0; k<this.languageAnnotations[i].length; k++) {
          $blockDiv.append(this.languageAnnotations[i][k]);
        }
        $(this.blocksWrapperDiv).append(blockDiv);
        for (var j=0; j<this.numLineIds; j++) {
          var lineId = this.lineIds[j];
          var line = this.lineMaps[i][lineId];
          if (line != null) {
            $blockDiv.append(line);
          }
        }
      }
    }, 
    
    /** Initialise the blocks and items in a given translation. */
    initializeBlocks: function() {
      // set "blockId" data value, and add each item to indexItemByItemId, initialize "siblings" & "cousins" data values
      var itemsByItemId = {}; // the items map for all items in this translation
      this.addBlockItemClassToItems();
      this.indexItemsByTheirId(itemsByItemId);
      this.linkSiblingsAndCousins(itemsByItemId);
    }, 
    
    /** Items are identified by "data-id" attribute, so they don't actually have any 
        specific CSS class. This method specifically adds in the "block-item" class. */
    addBlockItemClassToItems: function () {
      $(this.translation).find(".block").each( // for each block in this translation
        function(index, block) {
          $(block).find("[data-id]").each( // for each item in the block
            function(index, item) {
              var $item = $(item);
              $item.addClass("block-item unhighlighted");
            });
        });
    }, 
      
    indexItemsByTheirId: function (itemsByItemId) {
      $(this.translation).find(".block").each( // for each block in this translation
        function(index, block) {
          var blockId = index;
          $(block).find("[data-id]").each( // for each item in the block
            function(index, item) {
              var $item = $(item);
              var itemIdAttribute = $item.data("id");
              $item.data("blockId", blockId); // pointer to parent block
              $item.data("itemIds", parseItemIds(itemIdAttribute));
              $item.data("selectedStyleTarget", 
                         createStyleTarget(item, "selected", 
                                           "unhighlighted")); // style target for this item to become selected
              $item.data("siblings", []); // list of sibling style targets (yet to be populated)
              $item.data("cousins", []); // list of cousin style targets (yet to be populated)
              indexItemByItemIds(itemsByItemId, $item); // index this item within it's translation
            });
        });
    }, 
    
    linkSiblingsAndCousins: function (itemsByItemId) {
      /* For each item in translation, determine which other items are siblings (in the same block) 
         or cousins (in a different block) with the same id, and create the relevant style targets. */
      $(this.translation).find("[data-id]").each( // for each item in the translation
        function(index, item) {
          var $item = $(item);
          var itemIds = $item.data("itemIds");
          var blockId = $item.data("blockId"); // block ID of this item
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
                  var otherItemBlockId = $(otherItem).data("blockId"); // block ID of the other item
                  var otherItemIds = $(otherItem).data("itemIds");
                  var matchStyleClass = matchIsPartial(itemIds, otherItemIds) ? "partial-match" : "match";
                  if (blockId == otherItemBlockId) {
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

  /* Object representing all Translations on a web page.
     Translations are mostly independent of each other, except
     there is only one currently selected item in any translation.
   */
  function Translations(selector) {
    this.elementSelection = new ElementSelection();
    this.selector = selector;
    var $this = this;
    
    this.translations = []
    var $translations = this.translations;

    // For each translation DOM element, initialize the corresponding translation
    selector.each(
      function(index, translation) {
        $translations.push(new Translation(translation));
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

  Translations.prototype = {
    
    setupInterleaving: function() {
      for (var i=0; i<this.translations.length; i++) {
        this.translations[i].setupInterleavingIfRelevant();
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
  lib.Translations = Translations;
  
})(CORRESPONDENCE);
