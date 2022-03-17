import { createUUID } from "../../../module/utils/uuid-utility.mjs";
import { validateOrThrow } from "../../../module/utils/validation-utility.mjs";
import SheetViewModel from "../../sheet-viewmodel.mjs";

export default class SkillViewModel extends SheetViewModel {
  /**
   * @type {Item}
   * @readonly
   */
  item = undefined;

  /**
   * @type {String}
   * @readonly
   */
  visGroupId = undefined;

  /**
   * @param {String | undefined} args.id Optional. Id used for the HTML element's id and name attributes. 
   * @param {ViewModel | undefined} args.parent Optional. Parent ViewModel instance of this instance. 
   * If undefined, then this ViewModel instance may be seen as a "root" level instance. A root level instance 
   * is expected to be associated with an actor sheet or item sheet or journal entry or chat message and so on.
   * 
   * @param {Boolean | undefined} isEditable If true, the sheet is editable. 
   * @param {Boolean | undefined} isSendable If true, the document represented by the sheet can be sent to chat. 
   * @param {Boolean | undefined} isOwner If true, the current user is the owner of the represented document. 
   * @param {Boolean | undefined} isGM If true, the current user is a GM. 
   * 
   * @param {Item} item
   * @param {Actor | undefined} actor If not undefined, this is the actor that owns the item. 
   * @param {String | undefined} visGroupId
   */
  constructor(args = {}) {
    super(args);
    validateOrThrow(args, ["item"]);

    // Own properties.
    this.item = args.item;
    this.actor = args.actor;
    this.visGroupId = args.visGroupId ?? createUUID();
  }
}
