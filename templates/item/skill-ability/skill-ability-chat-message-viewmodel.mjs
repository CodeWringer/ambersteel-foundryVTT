import ViewModel from "../../module/components/viewmodel.mjs";
import SheetViewModel from "../sheet-viewmodel.mjs";

export default class SkillAbilityChatMessageViewModel extends SheetViewModel {
  /** @override */
  static get TEMPLATE() { return TEMPLATES.SKILL_ABILITY_CHAT_MESSAGE; }

  /**
   * @type {Item}
   */
  item = undefined;

  /**
   * @type {SkillAbility}
   */
  skillAbility = undefined;

  /**
   * @type {Actor}
   */
  actor = undefined;

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
   * @param {SkillAbility} skillAbility
   * @param {Actor} actor
   */
  constructor(args = {}) {
    super(args);

    // Own properties.
    this.item = args.item;
    this.skillAbility = args.skillAbility;
    this.actor = args.actor;
  }
}
