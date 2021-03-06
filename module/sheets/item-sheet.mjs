import AmbersteelBaseItemSheet from "./subtypes/item/ambersteel-base-item-sheet.mjs";
import AmbersteelSkillItemSheet from "./subtypes/item/ambersteel-skill-item-sheet.mjs";
import AmbersteelFateCardItemSheet from "./subtypes/item/ambersteel-fate-item-sheet.mjs";
import AmbersteelInjuryItemSheet from "./subtypes/item/ambersteel-injury-item-sheet.mjs";
import AmbersteelIllnessItemSheet from "./subtypes/item/ambersteel-illness-item-sheet.mjs";
import AmbersteelMutationItemSheet from "./subtypes/item/ambersteel-mutation-item-sheet.mjs";
import * as SheetUtil from "../utils/sheet-utility.mjs";

export class AmbersteelItemSheet extends ItemSheet {
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
      const type = data.item.type;

      // TODO: Refactor and somehow get rid of the explicit statements. 
      if (type === "skill") {
        this._subType = new AmbersteelSkillItemSheet(this);
      } else if (type === "fate-card") {
        this._subType = new AmbersteelFateCardItemSheet(this);
      } else if (type === "item") {
        this._subType = new AmbersteelBaseItemSheet(this);
      } else if (type === "injury") {
        this._subType = new AmbersteelInjuryItemSheet(this);
      } else if (type === "illness") {
        this._subType = new AmbersteelIllnessItemSheet(this);
      } else if (type === "mutation") {
        this._subType = new AmbersteelMutationItemSheet(this);
      } else {
        throw `ItemSheet subtype ${type} is unrecognized!`
      }
    }
    return this._subType;
  }

  /**
   * @returns {Object}
   * @override
   * @virtual
   * @see https://foundryvtt.com/api/ItemSheet.html#.defaultOptions
   */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["ambersteel", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
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

  // TODO: Refactor and make the subtype dictate the title. 
  /**
   * @override
   * @type {String}
   * @see https://foundryvtt.com/api/ItemSheet.html#title
   */
  get title() {
    if (this.item.type === "skill") {
      return `${game.i18n.localize("ambersteel.labels.skill")} - ${this.item.name}`;
    } else if (this.item.type === "fate-card") {
      return `${game.i18n.localize("ambersteel.fateSystem.fateCard")} - ${this.item.name}`;
    } else if (this.item.type === "item") {
      return `${game.i18n.localize("ambersteel.labels.item")} - ${this.item.name}`;
    } else if (this.item.type === "injury") {
      return `${game.i18n.localize("ambersteel.labels.injury")} - ${this.item.name}`;
    } else if (this.item.type === "illness") {
      return `${game.i18n.localize("ambersteel.labels.illness")} - ${this.item.name}`;
    } else if (this.item.type === "mutation") {
      return `${game.i18n.localize("ambersteel.labels.mutation")} - ${this.item.name}`;
    } else {
      return this.item.name;
    }
  }

  /**
   * @type {ViewModel}
   * @private
   */
  _viewModel = undefined;
  /**
   * @type {ViewModel}
   * @readonly
   */
  get viewModel() { return this._viewModel; }

  /** 
   * Returns an object that represents sheet and enriched item data. 
   * 
   * Enriched means, it contains derived data and convenience properties. 
   * 
   * This method is called *before* the sheet is rendered. 
   * @returns {Object} The enriched context object. 
   * @override 
   * @see https://foundryvtt.com/api/FormApplicatiocn.html#getData
   */
  getData() {
    const context = super.getData();
    SheetUtil.enrichData(context);

    // Whenever the sheet is re-rendered, its view model is completely disposed and re-instantiated. 
    // Dispose of the view model, if it exists. 
    this._tryDisposeViewModel();
    // Prepare a new view model instance. 
    this._viewModel = this.subType.getViewModel(context);
    this._viewModel.readViewState();
    context.viewModel = this._viewModel;
    
    this.subType.prepareDerivedData(context);

    return context;
  }

  /**
   * @override
   * @see https://foundryvtt.com/api/FormApplication.html#activateListeners
   * 
   * This method is called *after* the sheet is rendered. 
   */
  activateListeners(html) {
    super.activateListeners(html);

    const isOwner = (this.actor ?? this.item).isOwner;
    const isEditable = this.isEditable;

    // Activate view model bound event listeners. 
    this.viewModel.activateListeners(html, isOwner, isEditable);

    // -------------------------------------------------------------
    if (!isOwner) return;
    // -------------------------------------------------------------
    if (!isEditable) return;
  }

  /**
   * @override
   * @see https://foundryvtt.com/api/FormApplication.html#close
   */
  async close() {
    this._tryDisposeViewModel();

    return super.close();
  }

  /**
   * Disposes of the view model, if possible. 
   * 
   * Will silently return, if there is no view model instance to dispose. 
   * @private
   * @async
   */
  _tryDisposeViewModel() {
    if (this._viewModel !== undefined && this._viewModel !== null) {
      // Write out state to persist, before disposing the view model. 
      this._viewModel.writeViewState();
      try {
        this._viewModel.dispose();
      } catch (e) {
        game.ambersteel.logger.logWarn(e);
      }
    }
    this._viewModel = null;
  }
}
