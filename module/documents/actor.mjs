/**
 * @extends {Actor}
 */
export class AmbersteelActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.boilerplate || {};

    this._preparePCData(actorData);
  }

  /**
   * Prepare PC type specific data
   */
  _preparePCData(actorData) {
    if (actorData.type !== 'pc') return;

    // Make modifications to data here. For example:
    const data = actorData.data;

    // Ensure beliefs array has 3 items. 
    while (data.beliefSystem.beliefs.length < 3) {
      data.beliefSystem.beliefs.push("")
    }

    // Ensure instincts array has 3 items. 
    while (data.beliefSystem.instincts.length < 3) {
      data.beliefSystem.instincts.push("")
    }
  }

  // /**
  //  * Override getRollData() that's supplied to rolls.
  //  */
  // getRollData() {
  //   const data = super.getRollData();

  //   // Prepare character roll data.
  //   this._getCharacterRollData(data);

  //   return data;
  // }

  // /**
  //  * Prepare character roll data.
  //  */
  // _getCharacterRollData(data) {
  //   if (this.data.type !== 'character') return;

  //   // Copy the ability scores to the top level, so that rolls can use
  //   // formulas like `@str.mod + 4`.
  //   if (data.abilities) {
  //     for (let [k, v] of Object.entries(data.abilities)) {
  //       data[k] = foundry.utils.deepClone(v);
  //     }
  //   }

  //   // Add level for easier access, or fall back to 0.
  //   if (data.attributes.level) {
  //     data.lvl = data.attributes.level.value ?? 0;
  //   }
  // }
}