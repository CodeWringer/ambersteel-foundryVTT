import ButtonSendToChatViewModel from "../../../module/components/button-send-to-chat/button-send-to-chat-viewmodel.mjs";
import InputTextareaViewModel from "../../../module/components/input-textarea/input-textarea-viewmodel.mjs";
import InputTextFieldViewModel from "../../../module/components/input-textfield/input-textfield-viewmodel.mjs";
import { TEMPLATES } from "../../../module/templatePreloader.mjs";
import InputRadioButtonGroupViewModel from "../../../module/components/input-radio-button-group/input-radio-button-group-viewmodel.mjs";
import ButtonDeleteViewModel from "../../../module/components/button-delete/button-delete-viewmodel.mjs";
import { validateOrThrow } from "../../../module/utils/validation-utility.mjs";
import SheetViewModel from "../../../module/components/sheet-viewmodel.mjs";

export default class IllnessListItemViewModel extends SheetViewModel {
  /** @override */
  static get TEMPLATE() { return TEMPLATES.ILLNESS_LIST_ITEM; }

  /**
   * @type {Array<ChoiceOption>}
   * @readonly
   */
  get stateOptions() { return game.ambersteel.getIllnessOptions(); }

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
   * @param {Item} args.item
   */
  constructor(args = {}) {
    super(args);
    validateOrThrow(args, ["item"]);

    this.item = args.item;
    this.contextTemplate = "illness-list-item";
    const thiz = this;

    this.vmTfName = new InputTextFieldViewModel({
      id: "tf-name",
      isEditable: thiz.isEditable,
      propertyOwner: thiz.item,
      propertyPath: "name",
      placeholder: "ambersteel.labels.name",
      contextTemplate: thiz.contextTemplate,
      parent: thiz,
    });
    this.vmRbgState = new InputRadioButtonGroupViewModel({
      id: "rbg-state",
      isEditable: thiz.isEditable,
      contextTemplate: thiz.contextTemplate,
      parent: thiz,
      propertyOwner: thiz.item,
      propertyPath: "data.data.state",
      options: thiz.stateOptions,
    })
    this.vmBtnSendToChat = new ButtonSendToChatViewModel({
      id: "btn-send-to-chat",
      parent: thiz,
      target: thiz.item,
    });
    this.vmBtnDelete = new ButtonDeleteViewModel({
      id: "btn-delete",
      parent: thiz,
      target: thiz.item,
      withDialog: true,
    })
    this.vmTfDuration = new InputTextFieldViewModel({
      id: "tf-duration",
      isEditable: thiz.isEditable,
      propertyOwner: thiz.item,
      propertyPath: "data.data.duration",
      contextTemplate: thiz.contextTemplate,
      parent: thiz,
    });
    this.vmTfTreatmentSkill = new InputTextFieldViewModel({
      id: "tf-treatment-skill",
      isEditable: thiz.isEditable,
      propertyOwner: thiz.item,
      propertyPath: "data.data.treatmentSkill",
      contextTemplate: thiz.contextTemplate,
      parent: thiz,
    });
    this.vmTfTreatment = new InputTextFieldViewModel({
      id: "tf-treatment",
      isEditable: thiz.isEditable,
      propertyOwner: thiz.item,
      propertyPath: "data.data.treatment",
      contextTemplate: thiz.contextTemplate,
      parent: thiz,
    });
    this.vmTaDescription = new InputTextareaViewModel({
      id: "ta-description",
      isEditable: thiz.isEditable,
      propertyPath: "data.data.description",
      propertyOwner: thiz.item,
      contextTemplate: thiz.contextTemplate,
      parent: thiz,
      placeholder: "ambersteel.labels.description",
      allowResize: true,
    });
  }
}
