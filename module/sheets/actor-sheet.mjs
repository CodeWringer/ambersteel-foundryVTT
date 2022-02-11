import SheetViewModelCollection from "./sheet-viewmodel-collection.mjs";
import AmbersteelNpcActorSheet from "./subtypes/actor/ambersteel-npc-actor-sheet.mjs";
import AmbersteelPcActorSheet from "./subtypes/actor/ambersteel-pc-actor-sheet.mjs";
import * as SheetUtil from "../utils/sheet-utility.mjs";

export class AmbersteelActorSheet extends ActorSheet {
  /**
   * @private
   */
  _subType = undefined;
  /**
   * Type-dependent object which pseudo-extends the logic of this object. 
   */
  get subType() {
    if (!this._subType) {
      const data = super.getData();
      const type = data.actor.type;

      if (type === "pc") {
        this._subType = new AmbersteelPcActorSheet(this);
      } else if (type === "npc") {
        this._subType = new AmbersteelNpcActorSheet(this);
      } else {
        throw `Actor subtype ${type} is unrecognized!`
      }
    }
    return this._subType;
  }

  /**
   * @returns {Object}
   * @override
   * @virtual
   * @see https://foundryvtt.com/api/ActorSheet.html#.defaultOptions
   */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ambersteel", "sheet", "actor"],
      width: 600,
      height: 700,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "attributes" }]
    });
  }

  /**
   * Returns the template path. 
   * @returns {String} Path to the template. 
   * @virtual
   * @override
   * @see https://foundryvtt.com/api/DocumentSheet.html#template
   */
  get template() {
    return this.subType.template;
  }

  /**
   * @type {SheetViewModelCollection}
   * @private
   */
  _viewModels = undefined;
  /**
   * @returns {SheetViewModelCollection}
   */
  get viewModels() { return this._viewModels; }

  constructor() {
    this.viewModels = new SheetViewModelCollection(this);
  }

  /** 
   * Returns an object that represents sheet and enriched actor data. 
   * 
   * Enriched means, it contains derived data and convenience properties. 
   * @returns {Object} The enriched context object. 
   * @override 
   * @see https://foundryvtt.com/api/FormApplication.html#getData
   */
  getData() {
    const context = super.getData();

    // Add the config to the context object as a convenience property. 
    context.CONFIG = CONFIG.ambersteel;
    // Add the game to the context object as a convenience property. 
    context.game = game;
    // In templates that implement it, this flag indicates whether the current user is the owner of the sheet. 
    context.isOwner = context.owner;
    // In templates that implement it, this flag indicates whether the current user is a GM. 
    context.isGM = game.user.isGM;
    // In templates that implement it, this flag determines whether data on the sheet 
    // can be edited. 
    context.isEditable = ((context.actor.data.data.isCustom && context.isOwner) || context.isGM) && context.editable;
    // In templates that implement it, this flag determines whether the sheet data can be 
    // sent to the chat. 
    context.isSendable = true;

    this.subType.prepareDerivedData(context);

    return context;
  }

  /**
   * @override
   * @see https://foundryvtt.com/api/FormApplication.html#activateListeners
   */
  activateListeners(html) {
    super.activateListeners(html);

    // Activate view model bound event listeners. 
    SheetUtil.activateListeners(html, this);

    // TOOD: Remove?
    // Subtype listeners. 
    // this.subType.activateListeners(html, isOwner, isEditable, isSendable);
  }

  /**
   * @param force 
   * @param options 
   * @override
   * @see https://foundryvtt.com/api/ActorSheet.html#render
   */
  render(force, options) {
    super.render(force, options);
  }

  /**
   * @override
   * @see https://foundryvtt.com/api/FormApplication.html#close
   */
  async close() {
    this.viewModels.clear();
    return super.close();
  }
}
