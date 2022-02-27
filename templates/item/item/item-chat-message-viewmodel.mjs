import { TEMPLATES } from "../../../module/templatePreloader.mjs";
import ItemViewModel from "./item-viewmodel.mjs";

export default class ItemChatMessageViewModel extends ItemViewModel {
  /** @override */
  static get TEMPLATE() { return TEMPLATES.ITEM_CHAT_MESSAGE; }

  /**
   * @type {Boolean}
   * @readonly
   */
  allowPickup = false;
  
  /**
   * @type {String}
   * @readonly
   */
  sourceType = undefined;
  
  /**
   * @type {String}
   * @readonly
   */
  sourceId = undefined;

  /**
   * @param {String | undefined} args.id Optional. Id used for the HTML element's id and name attributes. 
   * @param {ViewModel | undefined} args.parent Optional. Parent ViewModel instance of this instance. 
   * If undefined, then this ViewModel instance may be seen as a "root" level instance. A root level instance 
   * is expected to be associated with an actor sheet or item sheet or journal entry or chat message and so on.
   * 
   * @param {Boolean} isEditable If true, the sheet is editable. 
   * @param {Boolean} isSendable If true, the document represented by the sheet can be sent to chat. 
   * @param {Boolean} isOwner If true, the current user is the owner of the represented document. 
   * @param {Boolean} isGM If true, the current user is a GM. 
   * 
   * @param {Item} item
   * 
   * @param {Boolean} allowPickup
   * @param {String} sourceType
   * @param {String} sourceId
   */
  constructor(args = {}) {
    super(args);
    this.allowPickup = args.allowPickup;
    this.sourceType = args.sourceType;
    this.sourceId = args.sourceId;
  }
}
