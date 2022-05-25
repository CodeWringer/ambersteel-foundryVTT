import AmbersteelBaseItem from "./ambersteel-base-item.mjs";
import SkillAbility from "../../../dto/skill-ability.mjs";
import { TEMPLATES } from "../../../templatePreloader.mjs";
import { createUUID } from "../../../utils/uuid-utility.mjs";
import SkillChatMessageViewModel from "../../../../templates/item/skill/skill-chat-message-viewmodel.mjs";
import { SummedData, SummedDataComponent } from "../../../dto/summed-data.mjs";
import DamageAndType from "../../../dto/damage-and-type.mjs";
import * as ValUtil from "../../../utils/validation-utility.mjs";
import { DiceOutcomeTypes } from "../../../dto/dice-outcome-types.mjs";

export default class AmbersteelSkillItem extends AmbersteelBaseItem {
  /**
   * @param parent {Item} The owning Item. 
   */
  constructor(parent) {
    super(parent);
    
    this.parent.chatMessageTemplate = this.chatMessageTemplate;
    this.parent.getChatData = this.getChatData.bind(this);
    this.parent.setLevel = this.setLevel.bind(this);
    this.parent.addProgress = this.addProgress.bind(this);
    this.parent.createSkillAbility = this.createSkillAbility.bind(this);
    this.parent.deleteSkillAbilityAt = this.deleteSkillAbilityAt.bind(this);
    this.parent.advanceSkillBasedOnRollResult = this.advanceSkillBasedOnRollResult.bind(this);
  }

  /** @override */
  get defaultImg() { return "icons/svg/book.svg"; }

  /**
   * Chat message template path. 
   * @type {String}
   */
  get chatMessageTemplate() { return TEMPLATES.SKILL_ITEM_CHAT_MESSAGE; }

  /** @override */
  prepareData(context) {
    context.data.data.relatedAttribute = context.data.data.relatedAttribute ?? "agility";
  }
  
  /** @override */
  prepareDerivedData(context) {
    context.getRollData = this._getRollData.bind(this);
    this._ensureSkillAbilityObjects(context);
  }

  /** @override */
  async getChatData() {
    const chatData = super.getChatData();
    chatData.flavor = game.i18n.localize("ambersteel.labels.skill");

    return chatData;
  }

  /** @override */
  getChatViewModel(overrides = {}) {
    const base = super.getChatViewModel();
    return new SkillChatMessageViewModel({
      id: base.id,
      isEditable: base.isEditable,
      isSendable: base.isSendable,
      isOwner: base.isOwner,
      isGM: base.isGM,
      item: this.parent,
      actor: this.parent.parent,
      visGroupId: createUUID(),
      ...overrides,
    });
  }

  /**
   * Sets the given level of the skill. 
   * 
   * @param newLevel {Number} Value to set the skill to, e.g. 0. Default 0
   * @param resetProgress {Boolean} If true, will also reset successes and failures. Default true
   * @async
   */
  async setLevel(newLevel = 0, resetProgress = true) {
    const req = game.ambersteel.getSkillAdvancementRequirements(newLevel);

    await this.parent.update({
      data: {
        value: newLevel,
        requiredSuccessses: req.requiredSuccessses,
        requiredFailures: req.requiredFailures,
        successes: resetProgress ? 0 : this.parent.data.data.successes,
        failures: resetProgress ? 0 : this.parent.data.data.failures
      }
    });
  };

  /**
   * Adds success/failure progress to the skill. 
   * 
   * Also auto-levels up the skill, if 'autoLevel' is set to true. 
   * @param {DiceOutcomeTypes} outcomeType The test outcome to work with. 
   * @param {Boolean | undefined} autoLevel Optional. If true, will auto-level up. Default false
   * @param {Boolean | undefined} resetProgress Optional. If true, will also reset successes and failures,
   * if 'autoLevel' is also true and a level automatically incremented. Default true
   * @async
   */
  async addProgress(outcomeType, autoLevel = false, resetProgress = true) {
    if (outcomeType === undefined) {
      game.ambersteel.logger.logWarn("outcomeType is undefined");
      return;
    }

    const skillData = this.parent.data.data;

    let successes = parseInt(skillData.successes);
    let failures = parseInt(skillData.failures);
    const requiredSuccessses = parseInt(skillData.requiredSuccessses);
    const requiredFailures = parseInt(skillData.requiredFailures);

    if (outcomeType === DiceOutcomeTypes.SUCCESS) {
      successes++;
      await this.parent.updateProperty("data.successes", successes);
    } else if (outcomeType === DiceOutcomeTypes.FAILURE || outcomeType === DiceOutcomeTypes.PARTIAL) {
      failures++;
      await this.parent.updateProperty("data.failures", failures);
    }

    if (autoLevel) {
      if (successes >= requiredSuccessses
        && failures >= requiredFailures) {
        const nextSkillValue = parseInt(skillData.value) + 1;
        await this.setLevel(nextSkillValue, resetProgress);
      }
    }

    // Progress associated attribute. 
    const attName = skillData.relatedAttribute;
    this.parent.parent.addAttributeProgress(outcomeType, attName, autoLevel)
  }

  /**
   * Adds a new skill ability. 
   * @param {Object} creationData Additional data to set on creation. 
   */
  async createSkillAbility(creationData) {
    const newAbility = new SkillAbility({
      parent: this,
      index: this.parent.data.data.abilities.length,
    });
    
    for (const propertyName in creationData) {
      newAbility[propertyName] = creationData[propertyName];
    }

    const abilities = this.parent.data.data.abilities.concat(
      [newAbility]
    );
    await this.parent.updateProperty("data.abilities", abilities);
  }

  /**
   * Deletes the skill ability at the given index. 
   * @param index Index of the skill ability to delete. 
   */
  async deleteSkillAbilityAt(index) {
    const dataAbilities = this.parent.data.data.abilities;
    const abilities = dataAbilities.slice(0, index).concat(dataAbilities.slice(index + 1));
    await this.parent.updateProperty("data.abilities", abilities);
  }
  
  /**
   * Advances the skill, based on the given {DicePoolResult}. 
   * @param {DicePoolResult} rollResult 
   * @async
   */
  async advanceSkillBasedOnRollResult(rollResult) {
    if (rollResult === undefined) {
      game.ambersteel.logger.logWarn("rollResult is undefined");
      return;
    }
    this.parent.addProgress(rollResult.outcomeType, false);
  }

  /**
   * @private
   * @returns {SummedData}
   */
  _getRollData() {
    const relatedAttributeName = this.parent.data.data.relatedAttribute;
    const attGroupName = game.ambersteel.getAttributeGroupName(relatedAttributeName);
    
    const actor = this.parent.parent;
    const relatedAttributeLevel = actor ? actor.data.data.attributes[attGroupName][relatedAttributeName].value : 0;

    const skillLevel = this.parent.data.data.value;

    const compositionObj = game.ambersteel.getSkillTestNumberOfDice(skillLevel, relatedAttributeLevel);

    return new SummedData(compositionObj.totalDiceCount, [
      new SummedDataComponent(relatedAttributeName, `ambersteel.attributes.${relatedAttributeName}`, compositionObj.attributeDiceCount),
      new SummedDataComponent(this.parent.name, this.parent.name, compositionObj.skillDiceCount),
    ]);
  }

  /**
   * Ensures that all objects under context.data.data.abilities are 'proper' SkillAbility type objects. 
   * @param {AmbersteelItem} context 
   * @private
   */
  _ensureSkillAbilityObjects(context) {
    const skillAbilities = [];
    for (let i = 0; i < context.data.data.abilities.length; i++) {
      const abilityObject = context.data.data.abilities[i];

      const damage = [];
      for (const propertyName in abilityObject.damage) {
        if (abilityObject.damage.hasOwnProperty(propertyName) !== true) continue;

        const plainDamageObject = abilityObject.damage[propertyName];

        damage.push(new DamageAndType({
          damage: plainDamageObject.damage ?? "",
          damageType: plainDamageObject.damageType ?? game.ambersteel.config.damageTypes.none.name,
        }));
      }

      const skillAbility = new SkillAbility({
        ...abilityObject,
        parent: context,
        index: i,
        damage: damage,
      });

      skillAbilities.push(skillAbility);
    }
    context.data.data.abilities = skillAbilities;
  }
}
