/**
 * Creates a new ChatMessage to display the given contents
 * @param chatData 
 */
export function sendToChat(chatData = { 
    speaker: undefined,
    renderedContent: "",
    flavor: undefined,
    actor: {},
    sound: "../sounds/notify.wav",
    visibilityMode: CONFIG.ambersteel.visibilityModes.public
    }) {
    const speaker = chatData.speaker ?? ChatMessage.getSpeaker({ actor: chatData.actor });
    
    if (chatData.visibilityMode === CONFIG.ambersteel.visibilityModes.self) {
        const self = game.user;

        ChatMessage.create({
            whisper: [self],
            speaker: speaker,
            flavor: chatData.flavor,
            content: chatData.renderedContent,
            sound: chatData.sound
        });
    } else if (chatData.visibilityMode === CONFIG.ambersteel.visibilityModes.gm) {
        const gms = ChatMessage.getWhisperRecipients("GM");
        for (const gm of gms) {
            ChatMessage.create({
                whisper: [gm],
                speaker: speaker,
                flavor: chatData.flavor,
                content: chatData.renderedContent,
                sound: chatData.sound
            });
        }
    } else { // Public message. 
        ChatMessage.create({
            speaker: speaker,
            flavor: chatData.flavor,
            content: chatData.renderedContent,
            sound: chatData.sound
        });
    }
}