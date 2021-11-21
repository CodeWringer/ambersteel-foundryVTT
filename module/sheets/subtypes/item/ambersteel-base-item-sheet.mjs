import * as SheetUtil from '../../../utils/sheet-utility.mjs';
import * as ButtonRoll from '../../../components/button-roll.mjs';
import * as ButtonDelete from '../../../components/button-delete.mjs';
import * as ButtonSendToChat from '../../../components/button-send-to-chat.mjs';

export default class AmbersteelBaseItemSheet {
  /**
   * The owning ItemSheet object. 
   * @type {ItemSheet}
   */
  parent = undefined;

  /**
   * @param parent {ItemSheet} The owning ItemSheet. 
   */
  constructor(parent) {
    if (!parent || parent === undefined) {
      throw "Argument 'owner' must not be null or undefined!"
    }
    this.parent = parent;
    this.parent.getActor = this.getActor.bind(this);
    this.parent.getItem = this.getItem.bind(this);
    this.parent.getContextEntity = this.getContextEntity.bind(this);
  }

  /**
   * Returns the template path. 
   * @returns {String} Path to the template. 
   * @virtual
   */
  get template() { 
    return "systems/ambersteel/templates/item/item-item-sheet.hbs"; 
  }

  /**
   * @returns {Actor}
   */
  getActor() {
    return this.getItem().parent;
  }

  /**
   * Returns the item object of the parent sheet. 
   * @returns {Item} The item object of the parent sheet. 
   */
  getItem() {
    return this.parent.item;
  }

  /**
   * Returns the current context object. 
   * @returns {Actor|Item} The current context object. 
   */
  getContextEntity() {
    return this.getItem();
  }

  /**
   * Extends the given context object with derived data. 
   * 
   * This is where any data should be added, which is only required to 
   * display the data via the parent sheet. 
   * @param context {Object} A context data object. Some noteworthy properties are 
   * 'item', 'CONFIG', 'isSendable' and 'isEditable'. 
   * @virtual
   */
  prepareDerivedData(context) {
  }

  /**
   * Registers events on elements of the given DOM. 
   * @param html {Object} DOM of the sheet for which to register listeners. 
   * @param isOwner {Boolean} If true, registers events that require owner permission. 
   * @param isEditable {Boolean} If true, registers events that require editing permission. 
   * @virtual
   */
  activateListeners(html, isOwner, isEditable) {
    ButtonRoll.activateListeners(html, this, isOwner, isEditable);
    ButtonDelete.activateListeners(html, this, isOwner, isEditable);
    ButtonSendToChat.activateListeners(html, this, isOwner, isEditable);
    
    // -------------------------------------------------------------
    if (!isOwner) return;

    // -------------------------------------------------------------
    if (!isEditable) return;

    // Add Item
    html.find('.ambersteel-item-create').click(this._onItemCreate.bind(this));

    // Edit item. 
    html.find(".ambersteel-item-edit").change(this._onItemEdit.bind(this));
  }

  /**
   * 
   * @param event 
   * @private
   * @async
   */
  async _onItemEdit(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const item = this.getItem();
    const propertyPath = element.dataset.field;
    const newValue = SheetUtil.getElementValue(element);

    await item.updateProperty(propertyPath, newValue);

    this.parent.render();
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   * @async
   */
  async _onItemCreate(event) {
    event.preventDefault();

    const header = event.currentTarget;
    const type = header.dataset.type;
    const data = duplicate(header.dataset);

    let imgPath = "icons/svg/item-bag.svg";
    if (type === "skill") {
      imgPath = "icons/svg/book.svg";
    } else if (type === "fate-card") {
      imgPath = "icons/svg/wing.svg";
    }

    const itemData = {
      name: `New ${type.capitalize()}`,
      type: type,
      data: data,
      img: imgPath
    };
    // Remove the type from the dataset since it's already in the 'itemData.type' property.
    delete itemData.data["type"];

    return await Item.create(itemData, { parent: this.parent });
  }
}