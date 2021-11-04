import BaseItem from "./base-item.mjs";

export default class FateCardItem extends BaseItem {
  /** @override */
  get img() { return "icons/svg/wing.svg"; }

  /**
   * Chat message template path. 
   * @type {String}
   */
  get chatMessageTemplate() { return "systems/ambersteel/templates/item/parts/fate-card.hbs"; }

  /** @override */
  prepareData() {
    this.parent.data.img = this.img;
  }

  /** @override */
  async getChatData() {
    const messageBase = super.getChatData();
    const renderedContent = await renderTemplate(this.chatMessageTemplate, {
      data: {
        _id: this.parent.id,
        name: this.parent.name,
        data: {
          description: this.parent.data.data.description,
        }
      },
      img: this.parent.img,
      isEditable: false,
      isSendable: false
    });

    return {
      ...messageBase,
      flavor: game.i18n.localize("ambersteel.fateSystem.fateCard"),
      renderedContent: renderedContent
    }
  }
}
