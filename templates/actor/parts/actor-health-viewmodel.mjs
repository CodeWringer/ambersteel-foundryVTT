import SheetViewModel from "../../../module/components/sheet-viewmodel.mjs";
import { TEMPLATES } from "../../../module/templatePreloader.mjs";
import { validateOrThrow } from "../../../module/utils/validation-utility.mjs";
import IllnessListItemViewModel from "../../item/illness/illness-list-item-viewmodel.mjs";
import InjuryListItemViewModel from "../../item/injury/injury-list-item-viewmodel.mjs";

export default class ActorHealthViewModel extends SheetViewModel {
  /** @override */
  static get TEMPLATE() { return TEMPLATES.ACTOR_HEALTH; }

  /**
   * @type {Actor}
   */
  actor = undefined;

  /**
   * @type {Number}
   * @readonly
   */
  get injuryCount() { return this.actor.injuries.length; }

  /**
   * @type {Number}
   * @readonly
   */
  get illnessCount() { return this.actor.illnesses.length; }

  /**
   * @type {Array<IllnessListItemViewModel>}
   * @readonly
   */
  illnesses = [];

  /**
   * @type {Array<InjuryViewModel>}
   * @readonly
   */
  injuries = [];

  /**
   * @param {String | undefined} args.id Optional. Id used for the HTML element's id and name attributes. 
   * @param {ViewModel | undefined} args.parent Optional. Parent ViewModel instance of this instance. 
   * If undefined, then this ViewModel instance may be seen as a "root" level instance. A root level instance 
   * is expected to be associated with an actor sheet or item sheet or journal entry or chat message and so on.
   * 
   * @param {Boolean | undefined} args.isEditable If true, the sheet is editable. 
   * @param {Boolean | undefined} args.isSendable If true, the document represented by the sheet can be sent to chat. 
   * @param {Boolean | undefined} args.isOwner If true, the current user is the owner of the represented document. 
   * @param {Boolean | undefined} args.isGM If true, the current user is a GM. 
   * 
   * @param {Actor} args.actor
   * 
   * @throws {Error} ArgumentException - Thrown, if any of the mandatory arguments aren't defined. 
   */
  constructor(args = {}) {
    super(args);
    validateOrThrow(args, ["actor"]);

    this.actor = args.actor;
    this.contextType = args.contextType ?? "actor-health";

    const thiz = this;

    this.vmNsMaxHp = this.createVmNumberSpinner({
      id: "vmNsMaxHp",
      propertyOwner: thiz.actor,
      propertyPath: "data.data.health.maxHP",
      isEditable: false,
    });
    this.vmNsHp = this.createVmNumberSpinner({
      id: "vmNsHp",
      propertyOwner: thiz.actor,
      propertyPath: "data.data.health.HP",
    });
    this.vmNsMaxExhaustion = this.createVmNumberSpinner({
      id: "vmNsMaxExhaustion",
      propertyOwner: thiz.actor,
      propertyPath: "data.data.health.maxExhaustion",
      isEditable: false,
    });
    this.vmNsExhaustion = this.createVmNumberSpinner({
      id: "vmNsExhaustion",
      propertyOwner: thiz.actor,
      propertyPath: "data.data.health.exhaustion",
      min: 0,
    });
    this.vmNsMagicStamina = this.createVmNumberSpinner({
      id: "vmNsMagicStamina",
      propertyOwner: thiz.actor,
      propertyPath: "data.data.health.magicStamina",
      min: 0,
    });
    this.vmNsMaxMagicStamina = this.createVmNumberSpinner({
      id: "vmNsMaxMagicStamina",
      propertyOwner: thiz.actor,
      propertyPath: "data.data.health.maxMagicStamina",
      isEditable: false,
    });
    this.vmNsMaxInjuries = this.createVmNumberSpinner({
      id: "vmNsMaxInjuries",
      propertyOwner: thiz.actor,
      propertyPath: "data.data.health.maxInjuries",
      isEditable: false,
      min: 1,
    });
    this.vmBtnAddInjury = this.createVmBtnAdd({
      id: "vmBtnAddInjury",
      target: thiz.actor,
      creationType: "injury",
      withDialog: true,
    });
    this.vmBtnAddIllness = this.createVmBtnAdd({
      id: "vmBtnAddIllness",
      target: thiz.actor,
      creationType: "illness",
      withDialog: true,
    });

    for (const illness of this.actor.illnesses) {
      const vm = new IllnessListItemViewModel({
        ...args,
        id: illness.id,
        parent: thiz,
        item: illness,
      });
      this.illnesses.push(vm);
    }

    for (const injury of this.actor.injuries) {
      const vm = new InjuryListItemViewModel({
        ...args,
        id: injury.id,
        parent: thiz,
        item: injury,
      });
      this.injuries.push(vm);
    }
  }
}
