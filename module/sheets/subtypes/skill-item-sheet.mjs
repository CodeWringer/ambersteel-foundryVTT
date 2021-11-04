import { getAttributeGroupName } from '../../utils/attribute-utility.mjs';
import SkillAbility from "../../dto/skill-ability.mjs";
import BaseItemSheet from "./base-item-sheet.mjs";

export default class SkillItemSheet extends BaseItemSheet {
  /** @override */
  get template() {
    return "systems/ambersteel/templates/item/skill-item-sheet.hbs";
  }

  /** @override */
  prepareDerivedData(context) {
    super.prepareDerivedData(context);

    const itemData = context.data;

    itemData.isExpanded = itemData.isExpanded ?? false;
    itemData.isExpandable = itemData.isExpandable ?? true;

    itemData.groupName = getAttributeGroupName(itemData.relatedAttribute);
  }

  /** @override */
  activateListeners(html, isOwner, isEditable) {
    super.activateListeners(html, isOwner, isEditable);

    // Show skill abilities. 
    html.find(".ambersteel-expand-skill-ability-list").click(this._onExpandSkillAbilityList(event));

    if (!isOwner) return;
    if (!isEditable) return;

    // Add skill ability. 
    html.find(".ambersteel-skill-ability-create").click(this._onCreateSkillAbility(event));

    // Delete skill ability.
    html.find(".ambersteel-skill-ability-delete").click(this._onDeleteSkillAbility(event));
  }

  /**
 * @param event 
 * @private
 * @async
 */
  async _onExpandSkillAbilityList(event) {
    event.preventDefault();

    const skillItem = this.getItem();
    await skillItem.updateProperty({ ["data.isExpanded"]: !skillItem.data.data.isExpanded });

    this.render();
  }

  /**
   * @param event 
   * @private
   * @async
   */
  async _onCreateSkillAbility(event) {
    event.preventDefault();
    
    const skillItem = this.getItem();
    const abilities = skillItem.data.data.abilities.concat(
      [new SkillAbility("New Skill Ability", "", 0, 0, "")]
    );
    await skillItem.updateProperty({ ["data.abilities"]: abilities });

    this.render();
  }

  /**
   * @param event 
   * @private
   * @async
   */
  async _onDeleteSkillAbility(event) {
    event.preventDefault();

    const element = event.currentTarget;
    const index = parseInt(element.dataset.index);
    const skillItem = this.getItem();
    const dataAbilities = skillItem.data.data.abilities;

    const abilities = dataAbilities.slice(0, index).concat(dataAbilities.slice(index + 1));
    await skillItem.updateProperty({ ["data.abilities"]: abilities });

    this.render();
  }
}