/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Logger } from "@utils/Logger";
import { OptionType } from "@utils/types";

import { VoiceSettingSection } from "./VoiceSetting";

export const getDefaultVoice = () => window.speechSynthesis?.getVoices().find(v => v.default);

export function getCurrentVoice(voices = window.speechSynthesis?.getVoices()) {
    if (!voices) return undefined;

    if (settings.store.voice) {
        const voice = voices.find(v => v.voiceURI === settings.store.voice);
        if (voice) return voice;

        new Logger("VcNarrator").error(`Voice "${settings.store.voice}" not found. Resetting to default.`);
    }

    const voice = voices.find(v => v.default);
    settings.store.voice = voice?.voiceURI;
    return voice;
}

export const settings = definePluginSettings({
    voice: {
        type: OptionType.COMPONENT,
        component: VoiceSettingSection,
        get default() {
            return getDefaultVoice()?.voiceURI;
        }
    },
    volume: {
        type: OptionType.SLIDER,
        description: "ナレーターの音量",
        default: 1,
        markers: [0, 0.25, 0.5, 0.75, 1],
        stickToMarkers: false
    },
    rate: {
        type: OptionType.SLIDER,
        description: "ナレーターの速度",
        default: 1,
        markers: [0.1, 0.5, 1, 2, 5, 10],
        stickToMarkers: false
    },
    sayOwnName: {
        description: "自分の名前を読み上げる",
        type: OptionType.BOOLEAN,
        default: false
    },
    latinOnly: {
        description: "名前を読み上げる前に、ラテン文字以外を取り除く",
        type: OptionType.BOOLEAN,
        default: false
    },
    joinMessage: {
        type: OptionType.STRING,
        description: "参加時のメッセージ",
        default: "{{USER}} joined"
    },
    leaveMessage: {
        type: OptionType.STRING,
        description: "退出時のメッセージ",
        default: "{{USER}} left"
    },
    moveMessage: {
        type: OptionType.STRING,
        description: "移動時のメッセージ",
        default: "{{USER}} moved to {{CHANNEL}}"
    },
    muteMessage: {
        type: OptionType.STRING,
        description: "ミュート時のメッセージ（現在は自分のみ）",
        default: "{{USER}} muted"
    },
    unmuteMessage: {
        type: OptionType.STRING,
        description: "ミュート解除時のメッセージ（現在は自分のみ）",
        default: "{{USER}} unmuted"
    },
    deafenMessage: {
        type: OptionType.STRING,
        description: "スピーカーミュート時のメッセージ（現在は自分のみ）",
        default: "{{USER}} deafened"
    },
    undeafenMessage: {
        type: OptionType.STRING,
        description: "スピーカーミュート解除時のメッセージ（現在は自分のみ）",
        default: "{{USER}} undeafened"
    }
});
