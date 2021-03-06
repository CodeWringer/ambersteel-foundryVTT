import VersionCode from "./version-code.mjs";
import WorldSystemVersion from "./world-system-version.mjs";
import { getActors } from "../utils/content-utility.mjs";

/**
 * @summary
 * Represents a world data migrator. 
 * 
 * @description
 * This type can migrate world data. The 'targetVersion' getter returns the version that the world system 
 * version **must be equal to**, in order for this migrator to be able to do its work. If the version is 
 * any different from the targeted one, **no work** can be done!
 * 
 * Once the migrator is done with its work, it will automatically update the world's system version to 
 * its defined migrated version. NOTE: In order for this to work, the migrator sets a world scope setting 
 * with which to track the world system version. 
 * 
 * Implementing migrators **must** provide implementations for 'targetVersion', 'migratedVersion' and 
 * '_doWork'!
 * 
 * @abstract
 */
export default class AbstractMigrator {
  /**
   * The world version must be **equal** to this, in order for this migrator to be able to do its work. 
   * 
   * Implementing types **must** override this and provide an actual version number!
   * @type {VersionCode}
   * @protected
   * @readonly
   * @virtual
   */
  get targetVersion() { throw new Error("NotImplementedException"); };
  
  /**
   * This is the system version that the world is set to, once this migrator's work is complete. 
   * 
   * Implementing types **must** override this and provide an actual version number!
   * @type {VersionCode}
   * @protected
   * @readonly
   * @virtual
   */
  get migratedVersion() { throw new Error("NotImplementedException"); };

  /**
   * Represents the world's system version. 
   * @type {WorldSystemVersion}
   * @private
   */
  _worldSystemVersion = new WorldSystemVersion();

  /**
   * Returns true, if this migrator can be applied to the current world system version. 
   * @returns {Boolean} True, if this migrator can be applied to the current world system version. 
   */
  isApplicable() {
    const version = this._worldSystemVersion.version;
    
    const majorApplies = version.major === this.targetVersion.major;
    const minorApplies = version.minor === this.targetVersion.minor;
    const patchApplies = version.patch === this.targetVersion.patch;

    if (majorApplies === true && minorApplies === true && patchApplies === true) {
      return true;
    }
    return false;
  }
  
  /**
   * Begins the migration process. 
   * @param {Object|undefined} args An optional arguments object. 
   * @async
   */
  async migrate(args = {}) {
    await this._doWork(args);
    
    // Update world system version. 
    this._worldSystemVersion.version = this.migratedVersion;
    this._worldSystemVersion.save();
  }
  
  /**
   * Does the migration work. 
   * 
   * Implementing types **must** override this and provide an implementation!
   * @param {Object|undefined} args An optional arguments object. 
   * @async
   * @abstract
   * @protected
   */
  async _doWork(args = {}) {
    throw new Error("NotImplementedException");
  }

  async updateSkills() {
    // Get all "skill" containing system compendia. 
    const packs = [
      game.packs.get("ambersteel.skills"),
    ];

    // Get all actors from world and compendia. 
    const actors = await getActors({ world: true, worldCompendia: true });

    // Prepare a map of the property names for the property values to keep. 
    const propertiesToKeep = new Map();
    propertiesToKeep.set("value", "value");
    propertiesToKeep.set("successes", "successes");
    propertiesToKeep.set("failures", "failures");

    // Do the replacement for every actor. 
    for (const actor of actors) {
      this.replaceMatchingDocumentsWithPackData(actor, "skill", packs, propertiesToKeep);
    }
  }

  async updateItems() {
    // Get all "item" containing system compendia. 
    const packs = [
      game.packs.get("ambersteel.armors"),
      game.packs.get("ambersteel.shields"),
      game.packs.get("ambersteel.supplies-and-stuff"),
      game.packs.get("ambersteel.valuables"),
      game.packs.get("ambersteel.weapons"),
    ];

    // Get all actors from world and compendia. 
    const actors = await getActors({ world: true, worldCompendia: true });

    // Prepare a map of the property names for the property values to keep. 
    const propertiesToKeep = new Map();
    propertiesToKeep.set("quantity", "quantity");

    // Do the replacement for every actor. 
    for (const actor of actors) {
      this.replaceMatchingDocumentsWithPackData(actor, "item", packs, propertiesToKeep);
    }
  }

  /**
   * Replaces data any documents on the given actor, whose type and name matches with the given type and 
   * definition's name and which isn't a 'custom' document. 
   * 
   * Also replaces the `name` and `img` properties. 
   * 
   * The document's id is preserved. 
   * @param {Actor} actor The actor whose matching documents' data will be updated. 
   * @param {Document} docType The type of document. E. g. "skill" or "item". 
   * @param {Array<Object>} packs An array of compendium packs that contain the definitions to use. 
   * @param {Map} propertiesToKeep A map of properties whose value will be preserved. 
   * * The key is the name of a property within `data.data` on the document to update. 
   * This is the value to copy. 
   * * The value is the name of a property within `data.data` on the definition document. 
   * This is the name of a (potenially new) property the original value will be copied into. 
   * @param {Array<String>} propertiesToDelete An array of property names to delete. 
   * @private
   */
  async replaceMatchingDocumentsWithPackData(actor, docType, packs, propertyNames, propertiesToDelete) {
    for (const pack of packs) {
      // Load definitions from pack. 
      const definitions = [];
      for (const index of pack.index) {
        const loadedDocument = await pack.getDocument(index._id ?? index.id);
        definitions.push(loadedDocument);
      }

      for (const definition of definitions) {
        this.replaceMatchingDocumentsData(actor, docType, definition, propertyNames, propertiesToDelete);
      }
    }
  }

  /**
   * Replaces data any documents on the given actor, whose type and name matches with the given type and 
   * definition's name and which isn't a 'custom' document. 
   * 
   * Also replaces the `name` and `img` properties. 
   * 
   * The document's id is preserved. 
   * @param {Actor} actor The actor whose matching documents' data will be updated. 
   * @param {Document} docType The type of document. E. g. "skill" or "item". 
   * @param {Document} definition The document whose data will be used. 
   * @param {Map} propertiesToKeep A map of properties whose value will be preserved. 
   * * The key is the name of a property within `data.data` on the document to update. 
   * This is the value to copy. 
   * * The value is the name of a property within `data.data` on the definition document. 
   * This is the name of a (potenially new) property the original value will be copied into. 
   * @param {Array<String>} propertiesToDelete An array of property names to delete. 
   * @private
   */
  async replaceMatchingDocumentsData(actor, docType, definition, propertyNames, propertiesToDelete) {
    const documents = actor.items.filter(it => it.type === docType && it.name === definition.name && it.data.data.isCustom === false);

    if (documents === undefined || (documents.length > 0) !== true) {
      return;
    }

    for (const document of documents) {
      await this.replaceDocumentData(document, definition, propertyNames, propertiesToDelete);
    }
  }

  /**
   * Replaces data of the given `toReplace` document with the given `replaceWith` document's data. 
   * 
   * Also replaces the `name` and `img` properties. 
   * 
   * The document's id is preserved. 
   * @param {Document} toReplace The document whose data is to be replaced. 
   * @param {Document} replaceWith The document whose data will be used. 
   * @param {Map} propertiesToKeep A map of properties whose value will be preserved. 
   * * The key is the name of a property within `data.data` on the document to update. 
   * This is the value to copy. 
   * * The value is the name of a property within `data.data` on the definition document. 
   * This is the name of a (potenially new) property the original value will be copied into. 
   * @param {Array<String>} propertiesToDelete An array of property names to delete. 
   * @private
   */
  async replaceDocumentData(toReplace, replaceWith, propertiesToKeep = new Map(), propertiesToDelete = []) {
    const dto = {
      name: replaceWith.name,
      img: replaceWith.img,
      data: replaceWith.data.data
    }

    // Map values. 
    for (const entry of propertiesToKeep.entries()) {
      dto.data[entry[1]] = toReplace.data.data[entry[0]];
    }

    // Add property removals. 
    for (const propertyName of propertiesToDelete) {
      dto.data[`-=${propertyName}`] = null;
    }

    await toReplace.update(dto);
  }
}
