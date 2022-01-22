import { AmbersteelActor } from "../../documents/actor.mjs";
import InventoryIndex from "../../dto/inventory-index.mjs";
import AmbersteelBaseActorSheet from "../../sheets/subtypes/actor/ambersteel-base-actor-sheet.mjs";
import { TEXTURES } from "../../pixi/texture-preloader.mjs";
import { ItemOnGridView } from "./item-on-grid-view.mjs";
import { DragIndicator } from "./drag-indicator.mjs";
import { Button } from "../../pixi/button.mjs";
import { ItemGrid } from "./item-grid.mjs";

/**
 * Represents an item grid (of possessions). 
 */
export class ItemGridView {
  /**
   * @type {HTMLElement}
   * @private
   */
  _canvasElement = undefined;

  /**
   * @type {PIXI.App}
   * @private
   */
  _pixiApp = undefined;
  /**
   * @type {PIXI.Stage}
   * @private
   */
  _stage = undefined;
  /**
   * @type {PIXI.Container}
   * @private
   */
  _rootContainer = undefined;
  /**
   * Contains the sprites that represent the slot grid. 
   * @type {Array<PIXI.Sprite>}
   * @private
   */
  _spriteInstancesGrid = [];
  /**
   * Contains the item root containers. 
   * @type {Array<PIXI.Container>}
   * @private
   */
  _itemsOnGrid = [];

  /**
   * @type {Array<AmbersteelItemItem>}
   * @private
   */
  _items = [];

  /**
   * @type {ItemGrid}
   * @private
   */
  _itemGrid = undefined;
  
  /**
   * @type {AmbersteelBaseActorSheet}
   * @private
   */
  _actorSheet = undefined;
  /**
   * @type {AmbersteelActor}
   * @private
   */
  _actor = undefined;
  
  /**
   * @type {ItemOnGridView}
   * @private
   */
  _dragItem = undefined;

  /**
   * @type {DragIndicator}
   * @private
   */
  _dragIndicator = undefined;

  /**
   * If not undefined, this is the targtet orientation for a dragged item. 
   * @type {CONFIG.itemOrientations | undefined}
   * @private
   */
  _dragItemOrientation = undefined;

  /**
   * Width of the canvas element in pixels. 
   * @type {Number}
   * @private
   */
  _width = 0;

  /**
   * Maximum number of columns this item grid can hold. 
   * @type {Number}
   * @private
   */
  _columnCount = 0;

  /**
   * Size of a tile on the grid, in pixels. 
   * @type {Number}
   * @default 128
   * @private
   */
  _tileSize = 128;

  /**
   * Total number of tiles on grid. 
   * @type {Number}
   */
  tileCount = 0;

  /**
   * If set to true, will draw debug info. 
   * @type {Boolean}
   * @private
   */
  _drawDebug = false;
  get drawDebug() { return this._drawDebug; }
  set drawDebug(value) {
    this._drawDebug = value;
    for (const itemOnGrid of this._itemsOnGrid) {
      itemOnGrid.drawDebug = !itemOnGrid.drawDebug;
    }
  }
  
  /**
   * If not undefined, the currently being dragged item. 
   * @type {ItemOnGridView|undefined}
   * @private
   */
  _hoverItem = undefined;
  get hoverItem() { return this._hoverItem; }
  set hoverItem(value) {
    if (value != this.hoverItem) {
      if (this.hoverItem !== undefined) {
        this.hoverItem.tint = 0xFFFFFF; // Removes any highlighting. 
      }
    }

    this._hoverItem = value;

    if (this.hoverItem !== undefined) {
      this.hoverItem.tint = 0xfcecde; // Sets a highlight. TODO: Make prettier than a tint. 
    }
  }

  /**
   * @type {Button}
   * @private
   */
  _hoverButton = undefined;
  get hoverButton() { return this._hoverButton; }
  set hoverButton(value) {
    if (value != this._hoverButton) {
      if (this.hoverButton !== undefined) {
        this._hoverButton.showHover = false;
      }
    }
    
    this._hoverButton = value;
    
    if (this._hoverButton !== undefined) {
      this._hoverButton.showHover = true;
    }
  }

  _isEditable = true;
  get isEditable() { return this._isEditable; }
  set isEditable(value) {
    this._isEditable = value;
  }

  /**
   * 
   * @param {HTMLElement} html 
   * @param {String} canvasElementId 
   * @param {AmbersteelBaseActorSheet} actorSheet 
   */
  constructor(html, canvasElementId, actorSheet, width, tileSize = 128) {
    this._width = width;
    this._tileSize = tileSize;

    const usedActorSheet = actorSheet;
    this._actorSheet = usedActorSheet;
    this._actor = this._actorSheet.getActor();

    this._itemGrid = this._actor.itemGrid;
    this._columnCount = this._itemGrid.columnCount;
    this.tileCount = this._actor.data.data.assets.maxBulk;

    // Setup HTML canvas element. 
    this._canvasElement = html.find("#" + canvasElementId)[0];
    const height = Math.ceil(this.tileCount / this._columnCount) * this._tileSize;
    this._canvasElement.style.height = height;
  
    // Setup Pixi app. 
    this._pixiApp = new PIXI.Application({
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundAlpha: 0,
      width: this._width,
      height: height
    });

    this._canvasElement.appendChild(this._pixiApp.view);
    this._stage = this._pixiApp.stage;
  
    this._rootContainer = new PIXI.Container();
    this._stage.addChild(this._rootContainer);
  
    // Setup drag indicator. 
    this._dragIndicator = new DragIndicator(this._pixiApp, this._tileSize);

    this._setupTiles(this._itemGrid.grid, this._tileSize);
  
    this._indices = this._actor.data.data.assets.gridIndices; // A list of {InventoryIndex}
    this._items = this._actor.possessions; // A list of {AmbersteelItemItem}
    this._setupItemsOnGrid(this._indices, this._items);
    
    this._setupInteractivity();
  }
  
  /**
   * Sets up the grid background tiles. 
   * @param {Array<Array<InventoryIndex | null>>} grid
   * @param {Number} tileSize Size of a tile, in pixels. 
   * @private
   */
  _setupTiles(grid, tileSize) {
    const columnCount = grid.length;
    for (let x = 0; x < columnCount; x++) {
      const rowCount = grid[x].length;
      for (let y = 0; y < rowCount; y++) {
        const spriteItemSlot = PIXI.Sprite.from(TEXTURES.ITEM_SLOT);
        spriteItemSlot.width = tileSize;
        spriteItemSlot.height = tileSize;
        spriteItemSlot.x = x * tileSize;
        spriteItemSlot.y = y * tileSize;
        spriteItemSlot.alpha = 0.5;
        this._spriteInstancesGrid.push(spriteItemSlot);
        this._rootContainer.addChild(spriteItemSlot);
      }
    }
  }
  
  /**
   * Sets up the initial set of items. 
   * @param {Array<InventoryIndex>} indices
   * @param {Array<InventoryIndex>} items
   * @private
   */
  _setupItemsOnGrid(indices, items) {
    for (const index of indices) {
      const item = items.find((element) => { return element.id === index.id; });
      const itemOnGrid = new ItemOnGridView(item, index, { width: this._tileSize, height: this._tileSize }, this._pixiApp, this);
      this._itemsOnGrid.push(itemOnGrid);

      this._rootContainer.addChild(itemOnGrid.rootContainer.wrapped);
      itemOnGrid.x = index.x * this._tileSize;
      itemOnGrid.y = index.y * this._tileSize;
    }
  }

  /**
   * Sets up interactivity. 
   * @private
   */
  _setupInteractivity() {
    window.addEventListener('keypress', (e) => {
      if (e.code != "KeyR") return; // TODO: Add this to FoundryVTT's key map somehow. 

      if (this._dragItem !== undefined) {
        this._dragIndicator.rotate();
        if (this._dragItemOrientation === game.ambersteel.config.itemOrientations.vertical) {
          this._dragItemOrientation = game.ambersteel.config.itemOrientations.horizontal;
        } else if (this._dragItemOrientation === game.ambersteel.config.itemOrientations.horizontal) {
          this._dragItemOrientation = game.ambersteel.config.itemOrientations.vertical;
        }
        this._dragIndicator.valid = this._canItemBeMovedTo(this._dragItem, this._dragIndicator.targetOnGrid.x, this._dragIndicator.targetOnGrid.y, this._dragItemOrientation).result;
      }
    });

    // Make PIXI stage capture pointer (mouse or touch) events. 
    this._stage.interactive = true;
    this._stage.interactiveChildren = true;

    this._stage.on("pointerdown", (event) => {
      const coords = { x: event.data.global.x, y: event.data.global.y };
      const itemOnGrid = this._getItemAt(coords.x, coords.y);
      const button = this._getButtonAt(coords.x, coords.y);

      if (button !== undefined) {
        if (button.requiresEditPermission === true && this.isEditable !== true) return;
        button.callback();
      } else if (itemOnGrid !== undefined) {
        if (this.isEditable !== true) return;

        // Start dragging. 
        this._canvasElement.style.cursor = "grabbing";

        this.hoverItem = itemOnGrid;
        this._dragItem = itemOnGrid;

        this._dragItemOrientation = this._dragItem.index.orientation;

        this._dragIndicator.setSize(itemOnGrid.index.w, itemOnGrid.index.h);
        this._dragIndicator.setInitialTo(itemOnGrid.index.x, itemOnGrid.index.y);
        this._dragIndicator.setTargetTo(itemOnGrid.index.x, itemOnGrid.index.y);
        this._dragIndicator.show = true;
        this._dragIndicator.valid = this._canItemBeMovedTo(itemOnGrid, itemOnGrid.index.x, itemOnGrid.index.y, this._dragItemOrientation).result;
      }
    });

    this._stage.on("pointerup", (event) => {
      if (this.isEditable !== true) return;

      const coords = { x: event.data.global.x, y: event.data.global.y };

      if (this._dragItem !== undefined) {
        const gridCoords = this._getGridCoordsAt(coords.x, coords.y);

        // Either apply or reject item move and rotation change. 
        const canItemBeMovedTo = this._canItemBeMovedTo(this._dragItem, gridCoords.x, gridCoords.y, this._dragItemOrientation);
        if (canItemBeMovedTo.result === true) {
          const gridIndices = this._actor.data.data.assets.gridIndices;
          const index = gridIndices.find((element) => { return element.id === this._dragItem.item.id; });

          if (canItemBeMovedTo.itemsToSwitch.length > 0) {
            // Swap items.
            for (const itemToSwitch of canItemBeMovedTo.itemsToSwitch) {
              const indexItemToSwitch = gridIndices.find((element) => { return element.id === itemToSwitch.item.item.id; })
              const offset = {
                x: gridCoords.x - indexItemToSwitch.x,
                y: gridCoords.y - indexItemToSwitch.y,
              };
              indexItemToSwitch.x = index.x + offset.x;
              indexItemToSwitch.y = index.y + offset.y;
            }
          }
          
          index.x = gridCoords.x;
          index.y = gridCoords.y;
          index.orientation = this._dragItemOrientation;
          if (index.orientation === game.ambersteel.config.itemOrientations.vertical) {
            index.w = this._dragItem.shape.width;
            index.h = this._dragItem.shape.height;
          } else if (index.orientation === game.ambersteel.config.itemOrientations.horizontal) {
            index.w = this._dragItem.shape.height;
            index.h = this._dragItem.shape.width;
          }

          this._actor.updateProperty("data.assets.gridIndices", gridIndices);
        }

        // Unset currently dragged item. 
        this._dragItem = undefined;
        this._dragIndicator.show = false;
      }
      
      this._determineCursor(coords.x, coords.y);
    });

    this._captureCursor = false;
    
    this._stage.on("pointerover", (event) => {
      this._captureCursor = true;
    });

    this._stage.on("pointerout", (event) => {
      this._captureCursor = false;

      if (this._dragItem === undefined) {
        // Unset current hover item. 
        this.hoverItem = undefined;
        // Unset current hover button. 
        this.hoverButton = undefined;
      }
    });

    this._stage.on("pointermove", (event) => {
      if (this._captureCursor !== true) return;
      const coords = { x: event.data.global.x, y: event.data.global.y };

      if (this._dragItem === undefined) {
        const itemOnGrid = this._getItemAt(coords.x, coords.y);
        const button = this._getButtonAt(coords.x, coords.y);
        
        this.hoverItem = itemOnGrid;
        this.hoverButton = button;
        
        this._determineCursor(coords.x, coords.y);
      } else {
        const gridCoords = this._getGridCoordsAt(coords.x, coords.y);
        const canItemBeMovedTo = this._canItemBeMovedTo(this._dragItem, gridCoords.x, gridCoords.y, this._dragItemOrientation).result;

        if (canItemBeMovedTo === true) {
          this._dragIndicator.valid = true;
        } else {
          this._dragIndicator.valid = false;
        }
        
        this._dragIndicator.setTargetTo(gridCoords.x, gridCoords.y);
      }
    });
  }

  /**
   * Clean-up of the item grid. 
   */
  tearDown() {
    // Tear down pixiApp
    this._stage = undefined;
    this._pixiApp.destroy();
    this._pixiApp = undefined;
    this._rootContainer = undefined;

    // Unset variables (probably unnecessary, but better to be on the safe side). 
    this._actorSheet = undefined;
    this._actor = undefined;
    this._spriteInstancesGrid = [];
    this._itemsOnGrid = [];

    this._dragIndicator.destroy();
  }
  
  /**
   * Returns the item whose bounding rectangle contains the given pixel coordinates. 
   * @param {Number} pixelX X pixel coordinate. 
   * @param {Number} pixelY Y pixel coordinate. 
   * @returns {ItemOnGridView}
   */
  _getItemAt(pixelX, pixelY) {
    for (const itemOnGrid of this._itemsOnGrid) {
      if (itemOnGrid.rectangle.contains(pixelX, pixelY) === true) {
        return itemOnGrid;
      }
    }
    return undefined;
  }

  /**
   * Returns the button whose bounding rectangle contains the given pixel coordinates. 
   * @param {Number} pixelX X pixel coordinate. 
   * @param {Number} pixelY Y pixel coordinate. 
   * @returns 
   */
  _getButtonAt(pixelX, pixelY) {
    for (const itemOnGrid of this._itemsOnGrid) {
      const button = itemOnGrid.getButtonAt(pixelX, pixelY);
      if (button !== undefined) {
        return button;
      }
    }
    return undefined;
  }

  /**
   * Returns the grid coordinates containing the given pixel coordinates. 
   * @param {Number} pixelX X coordinate, in pixels. 
   * @param {Number} pixelY Y coordinate, in pixels. 
   * @returns {Object} { x: {Number}, y: {Number} } Grid coordinates
   */
  _getGridCoordsAt(pixelX, pixelY) {
    return {
      x: Math.floor(pixelX / this._tileSize),
      y: Math.floor(pixelY / this._tileSize)
    }
  }

  /**
   * Tests if the given item could be moved to the given index on the item grid. 
   * 
   * Takes item slot (grid) coordinates, **not** pixel coordinates!
   * @param {ItemOnGridView} itemOnGrid The item to test. 
   * @param {Number} gridX X coordinate, in grid coordinates. 
   * @param {Number} gridY Y coordinate, in grid coordinates. 
   * @param {CONFIG.itemOrientations} orientation The desired (target) orientation at the given coordinates. 
   * @returns {Object} { result: {Boolean}, itemsToSwitch: {Array<ItemOnGridView>} }
   */
  _canItemBeMovedTo(itemOnGrid, gridX, gridY, orientation) {
    // Consider rotation during checks. 
    const sizeOnGrid = orientation === game.ambersteel.config.itemOrientations.vertical ? 
    { width: itemOnGrid.shape.width, height: itemOnGrid.shape.height } : 
    { width: itemOnGrid.shape.height, height: itemOnGrid.shape.width };

    const emptyFailure = { result: false, itemsToSwitch: [] };
    const emptySuccess = { result: true, itemsToSwitch: [] };
    // Test if over self and with unchanged orientation. 
    // If so, no need for further checks. The item can remain where it is currently at. 
    if (gridX === itemOnGrid.index.x 
      && gridY === itemOnGrid.index.y
      && orientation === itemOnGrid.orientation) {
      return emptySuccess;
    }

    // Test if target exceeds grid size. 
    for (let x = 0; x < sizeOnGrid.width; x++) {
      if (this._itemGrid.columnCount <= (gridX + x)) return emptyFailure;

      const bottom = gridY + (sizeOnGrid.height - 1);
      const rowCount = this._itemGrid.grid[gridX + x].length;
      if (bottom >= rowCount) return emptyFailure;
    }

    // Test if there is overlap with other items on grid. 
    const overlappedItems = this._itemGrid.getItemsOnGridWithin(gridX, gridY, sizeOnGrid.width, sizeOnGrid.height);
    // Test if the overlapping items can be swapped. 
    for (const overlappedItem of overlappedItems) {
      if (overlappedItem.item.id === itemOnGrid.item.id) continue;
      if (overlappedItem.isPartial === true) return emptyFailure;
    }

    return { result: true, itemsToSwitch: overlappedItems };
  }
  
  /**
   * Sets the cursor's appearance, based on the context-dependent interaction 
   * possible at the given pixel coordinates. 
   * @param {Number} pixelX X coordinate, in pixels. 
   * @param {Number} pixelY Y coordinate, in pixels. 
   */
  _determineCursor(pixelX, pixelY) {
    const itemOnGrid = this._getItemAt(pixelX, pixelY);
    const button = this._getButtonAt(pixelX, pixelY);
    
    if (button !== undefined) {
      // Show clicking is possible. 
      this._canvasElement.style.cursor = "pointer";
    } else if (itemOnGrid !== undefined) {
      // Show grabbing is possible. 
      this._canvasElement.style.cursor = "grab";
    } else {
      // No interaction possible at current pixel coordinates. 
      this._canvasElement.style.cursor = "default";
    }
  }
}