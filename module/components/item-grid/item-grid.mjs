import { AmbersteelActor } from "../../documents/actor.mjs";
import { ActorEvents } from "../../documents/actor.mjs";
import InventoryIndex from "../../dto/inventory-index.mjs";
import AmbersteelBaseActorSheet from "../../sheets/subtypes/actor/ambersteel-base-actor-sheet.mjs";
import { TEXTURES } from "./texture-preloader.mjs";
import { ItemOnGrid } from "./item-on-grid.mjs";
import { DragIndicator } from "./drag-indicator.mjs";
import { off } from "gulp";

const WIDTH = 550; // This magic constant is based on the assumption that the actor sheet is about 560px wide. 
const MAX_COLUMNS = 4;
const TILE_SIZE = Math.floor(WIDTH / MAX_COLUMNS);

function MOCK_ACTOR_SHEET() { return {
  getActor() { return this.actor; },
  actor: {
    possessions: [
      { id: "Ab1", name: "Crowns", img: "icons/svg/item-bag.svg", data: { data: { description: "That which greases palms.", gmNotes: "", isCustom: false, quantity: 1, maxQuantity: 100, bulk: 1, shape: { width: 1, height: 1 }, isOnPerson: true } } },
      { id: "Ab2", name: "Longsword", img: "icons/svg/item-bag.svg", data: { data: { description: "This is a two-handed bladed weapon.", gmNotes: "", isCustom: false, quantity: 1, maxQuantity: undefined, bulk: 2, shape: { width: 1, height: 2 }, isOnPerson: true } } },
      { id: "Ab3", name: "Axe", img: "icons/svg/item-bag.svg", data: { data: { description: "This is a two-handed bladed weapon.", gmNotes: "", isCustom: false, quantity: 1, maxQuantity: undefined, bulk: 2, shape: { width: 1, height: 2 }, isOnPerson: true } } },
    ],
    maxBulk: 9,
    on() {},
    off() {},
    offAll() {},
    once() {},
    data: {
      data: {
        assets: {
          inventory: [
            new InventoryIndex({ x: 0, y: 0, w: 1, h: 1, id: "Ab1", orientation: game.ambersteel.config.itemOrientations.vertical }),
            new InventoryIndex({ x: 1, y: 0, w: 1, h: 2, id: "Ab2", orientation: game.ambersteel.config.itemOrientations.vertical }),
            new InventoryIndex({ x: 2, y: 0, w: 2, h: 1, id: "Ab3", orientation: game.ambersteel.config.itemOrientations.horizontal }),
          ]
        }
      }
    },
    updateProperty(propertyPath, newValue) {}
  }
}};

/**
 * Represents an item grid (of possessions). 
 */
export class ItemGrid {
  /**
   * List of registered event listeners.
   * @type {Object}
   * @private
   */
  _eventListeners = {};

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
   * @type {Array<InventoryIndex>}
   * @private
   */
  _indices = [];

  /**
   * @type {Array<AmbersteelItemItem>}
   * @private
   */
  _items = [];

  /**
   * @type {Array<Array<InventoryIndex | null>>}
   * @private
   */
  _grid = undefined;
  
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
   * @type {ItemOnGrid}
   * @private
   */
  _dragItem = undefined;

  /**
   * @type {DragIndicator}
   * @private
   */
  _dragIndicator = undefined;

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
   * @type {ItemOnGrid|undefined}
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

    if (this.hoverItem != undefined) {
      this.hoverItem.tint = 0xfcecde; // Sets a highlight. TODO: Make prettier than a tint. 
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
   * @param {Boolean} mock
   */
  constructor(html, canvasElementId, actorSheet, mock = true) {
    const usedActorSheet = mock ? MOCK_ACTOR_SHEET() : actorSheet;

    this._actorSheet = usedActorSheet;
    this._actor = this._actorSheet.getActor();
    this.tileCount = this._actor.maxBulk;

    this._registerEvents(this._actor);
    
    // Setup HTML canvas element. 
    this._canvasElement = html.find("#" + canvasElementId)[0];
    const height = Math.ceil(this.tileCount / MAX_COLUMNS) * TILE_SIZE;
    this._canvasElement.style.height = height;
  
    // Setup Pixi app. 
    this._pixiApp = new PIXI.Application({
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundAlpha: 0,
      width: WIDTH,
      height: height
    });

    this._canvasElement.appendChild(this._pixiApp.view);
    this._stage = this._pixiApp.stage;
  
    this._rootContainer = new PIXI.Container();
    this._stage.addChild(this._rootContainer);
  
    // Setup drag indicator. 
    this._dragIndicator = new DragIndicator(this._pixiApp, TILE_SIZE);

    this._setupTiles();
  
    this._indices = this._actor.data.data.assets.inventory; // A list of {InventoryIndex}
    this._items = this._actor.possessions; // A list of {AmbersteelItemItem}
    this._setupItemsOnGrid(this._indices, this._items);
    
    this._setupInteractivity();
  }
  
  // TODO: Custom events might not be necessary, after all. Since adding or removing updates the 
  // actor in question, it re-renders the actor sheet and thus updates the item grid. 
  // Moving items around might also cause an automatic re-render. 
  /**
   * Registers event listeners. 
   * @private
   */
  _registerEvents() {
    this._eventListeners.possessionAdded = this._actor.on(ActorEvents.possessionAdded, (item) => {
      // TODO: Add to grid. 
    });
    this._eventListeners.possessionRemoved = this._actor.on(ActorEvents.possessionRemoved, (item) => {
      // TODO: Remove from grid. 
    });
    this._eventListeners.possessionUpdated = this._actor.on(ActorEvents.possessionUpdated, (item) => {
      /* TODO: Update item on grid.
      * If *any* of visble the properties of the item changed, 
      * that change has to be applied to the object on canvas, as well. 
      */
    });
  }
  
  /**
   * Sets up the grid background tiles. 
   * @private
   */
  _setupTiles() {
    let x = 0;
    let y = 0;

    this._grid = [];
  
    for (let i = 0; i < this.tileCount; i++) {
      const spriteItemSlot = PIXI.Sprite.from(TEXTURES.ITEM_SLOT);
      spriteItemSlot.width = TILE_SIZE;
      spriteItemSlot.height = TILE_SIZE;
      spriteItemSlot.x = x * TILE_SIZE;
      spriteItemSlot.y = y * TILE_SIZE;
      spriteItemSlot.alpha = 0.5;
      this._spriteInstancesGrid.push(spriteItemSlot);
      this._rootContainer.addChild(spriteItemSlot);

      while (this._grid.length <= x) {
        this._grid.push([]);
      }
      this._grid[x].push(null);
  
      x++;
      if (x == MAX_COLUMNS) {
        x = 0;
        y++;
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
      const itemOnGrid = new ItemOnGrid(item, index, { width: TILE_SIZE, height: TILE_SIZE }, this._pixiApp);
      this._itemsOnGrid.push(itemOnGrid);

      this._rootContainer.addChild(itemOnGrid.rootContainer.wrapped);
      itemOnGrid.x = index.x * TILE_SIZE;
      itemOnGrid.y = index.y * TILE_SIZE;
    }
  }

  /**
   * Sets up interactivity. 
   * @private
   */
  _setupInteractivity() {
    // TODO: Test events for items on grid. 
    // TODO: Item dragging on grid. 
    // TODO: Interactivity on item:
      // - sendToChat
      // - delete
      // - update property (this might be a bit too much work - probably requires 
      // custom implementation of input field, but as an object on canvas)

    this._stage.interactive = true;
    this._stage.interactiveChildren = true;
    this._stage.on("pointerdown", (event) => {
      const coords = { x: event.data.global.x, y: event.data.global.y };
      const itemOnGrid = this._getItemAt(coords.x, coords.y);
      const button = this._getButtonAt(coords.x, coords.y);

      if (button !== undefined) {
        if (button.requiresEditPermission === true && this.isEditable !== true) return;

        // TODO: Click button. 
      } else if (itemOnGrid !== undefined) {
        if (this.isEditable !== true) return;

        // Start dragging. 
        this._canvasElement.style.cursor = "grabbing";

        this.hoverItem = itemOnGrid;
        this._dragItem = itemOnGrid;
        this._dragIndicator.setSize(itemOnGrid.index.w, itemOnGrid.index.h);
        this._dragIndicator.setInitialTo(itemOnGrid.index.x, itemOnGrid.index.y);
        this._dragIndicator.setTargetTo(itemOnGrid.index.x, itemOnGrid.index.y);
        this._dragIndicator.show = true;
        this._dragIndicator.valid = this._canItemBeMovedTo(itemOnGrid, itemOnGrid.index.x, itemOnGrid.index.y).result;
      }
    });

    this._stage.on("pointerup", (event) => {
      if (this.isEditable !== true) return;

      const coords = { x: event.data.global.x, y: event.data.global.y };

      if (this._dragItem !== undefined) {
        const gridCoords = this._getGridCoordsAt(coords.x, coords.y);

        // Either apply or reject item move change. 
        const canItemBeMovedTo = this._canItemBeMovedTo(this._dragItem, gridCoords.x, gridCoords.y);1
        if (canItemBeMovedTo.result === true) {
          const inventory = this._actor.data.data.assets.inventory;
          const index = inventory.find((element) => { return element.id === this._dragItem.item.id; });

          if (canItemBeMovedTo.itemsToSwitch.length === 0) {
            index.x = gridCoords.x;
            index.y = gridCoords.y;
          } else {
            // Swap items.
            for (const itemToSwitch of canItemBeMovedTo.itemsToSwitch) {
              const indexItemToSwitch = inventory.find((element) => { return element.id === itemToSwitch.item.id; })
              const offset = {
                x: gridCoords.x - indexItemToSwitch.x,
                y: gridCoords.y - indexItemToSwitch.y,
              };
              indexItemToSwitch.x = index.x + offset.x;
              indexItemToSwitch.y = index.y + offset.y;
            }
            
            index.x = gridCoords.x;
            index.y = gridCoords.y;
          }
          this._actor.updateProperty("data.assets.inventory", inventory);
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
      }
    });

    this._stage.on("pointermove", (event) => {
      if (this._captureCursor !== true) return;
      const coords = { x: event.data.global.x, y: event.data.global.y };

      if (this._dragItem === undefined) {
        const itemOnGrid = this._getItemAt(coords.x, coords.y);
  
        this.hoverItem = itemOnGrid;
        this._determineCursor(coords.x, coords.y);
      } else {
        const gridCoords = this._getGridCoordsAt(coords.x, coords.y);
        const canItemBeMovedTo = this._canItemBeMovedTo(this._dragItem, gridCoords.x, gridCoords.y).result;

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
    this._unregisterEvents();
  
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
   * Un-registers all event listeners. 
   * @private
   */
  _unregisterEvents() {
    for (const eventListener in this._eventListeners) {
      this._actor.off(eventListener);
    }
  }

  /**
   * Returns the item whose bounding rectangle contains the given pixel coordinates. 
   * @param {Number} pixelX X pixel coordinate. 
   * @param {Number} pixelY Y pixel coordinate. 
   * @returns {ItemOnGrid}
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
    // TODO
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
      x: Math.floor(pixelX / TILE_SIZE),
      y: Math.floor(pixelY / TILE_SIZE)
    }
  }

  /**
   * Tests if the given item could be moved to the given index on the item grid. 
   * 
   * Takes item slot (grid) coordinates, **not** pixel coordinates!
   * @param {ItemOnGrid} itemOnGrid The item to test. 
   * @param {Number} gridX X coordinate, in grid coordinates. 
   * @param {Number} gridY Y coordinate, in grid coordinates. 
   * @returns {Object} { result: {Boolean}, itemsToSwitch: {Array<ItemOnGrid>} }
   */
  _canItemBeMovedTo(itemOnGrid, gridX, gridY) {
    const emptyResult = { result: false, itemsToSwitch: [] };
    // Test if over self. 
    // If so, no need for further checks. The item can remain where it is currently at. 
    if (gridX === itemOnGrid.index.x && gridY === itemOnGrid.index.y) return emptyResult;

    // Test if target exceeds grid size. 
    for (let x = 0; x < itemOnGrid.shape.width; x++) {
      if (this._grid.length <= (gridX + x)) return emptyResult;

      const bottom = gridY + (itemOnGrid.shape.height - 1);
      if (bottom >= this._grid[gridX + x].length) return emptyResult;
    }

    // Test if there is overlap with other items on grid. 
    const overlappedItems = this._getItemsOnGridWithin(gridX, gridY, itemOnGrid.shape.width, itemOnGrid.shape.height);
    // Test if the overlapping items can be swapped. 
    for (const overlappedItem of overlappedItems) {
      if (overlappedItem.isPartial === true) return emptyResult;
    }

    return { result: true, itemsToSwitch: overlappedItems };
  }
  
  /**
   * Returns all items on grid that can be at least partially contained by a 
   * rectangle spanning the given dimensions, at the given position. 
   * @param {Number} gridX In grid coordinates. 
   * @param {Number} gridY In grid coordinates. 
   * @param {Number} gridWidth In grid coordinates. 
   * @param {Number} gridHeight In grid coordinates. 
   * @returns {Object} { item: {ItemOnGrid}, isPartial: {Boolean} }
   */
  _getItemsOnGridWithin(gridX, gridY, gridWidth, gridHeight) {
    const result = [];
    const right = gridX + gridWidth - 1;
    const bottom = gridY + gridHeight - 1;

    for (const itemOnGrid of this._itemsOnGrid) {
      const itemRight = itemOnGrid.index.x + itemOnGrid.shape.width - 1;
      const itemBottom = itemOnGrid.index.y + itemOnGrid.shape.height - 1;

      if (itemOnGrid.index.x > right) continue;
      if (itemOnGrid.index.y > bottom) continue;
      if (itemRight < gridX) continue;
      if (itemBottom < gridY) continue;

      let isPartial = false;

      if (itemOnGrid.index.x < gridX || itemRight > right) {
        isPartial = true;
      }
      if (itemOnGrid.index.y < gridY || itemBottom > bottom) {
        isPartial = true;
      }

      result.push({ item: itemOnGrid, isPartial: isPartial });
    }

    return result;
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