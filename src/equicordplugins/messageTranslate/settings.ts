/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { makeRange, OptionType } from "@utils/types";

export const settings = definePluginSettings({
    targetLanguage: {
        type: OptionType.STRING,
        description: "翻訳先の言語コード（例: en、es、fr、de、ja）。",
        default: "en",
    },
    excludedLanguages: {
        type: OptionType.STRING,
        description: "翻訳から除外する言語コード（例: en、es、fr、de、ja）。",
        default: "en",
    },
    confidenceRequirement: {
        type: OptionType.SLIDER,
        description: "翻訳を表示するために必要な最小の信頼度（0 から 1）。",
        markers: makeRange(0, 1, 0.1),
        default: 0.8,
    },
    autoTranslate: {
        type: OptionType.BOOLEAN,
        description: "メッセージが表示されたら自動的に翻訳します。",
        default: true,
    },
    skipOwnMessages: {
        type: OptionType.BOOLEAN,
        description: "自分のメッセージは翻訳しません。",
        default: true,
    },
    skipBotMessages: {
        type: OptionType.BOOLEAN,
        description: "ボットのメッセージは翻訳しません。",
        default: false,
    },
    ignoredGuilds: {
        type: OptionType.STRING,
        description: "翻訳しないサーバー ID のカンマ区切りリスト。",
        default: "",
    },
    ignoredChannels: {
        type: OptionType.STRING,
        description: "翻訳しないチャンネル ID のカンマ区切りリスト。",
        default: "",
    },
    ignoredUsers: {
        type: OptionType.STRING,
        description: "翻訳しないユーザー ID のカンマ区切りリスト。",
        default: "",
    },
    showIndicator: {
        type: OptionType.BOOLEAN,
        description: "翻訳されたメッセージに小さな（翻訳済み）インジケーターを追加します。",
        default: true,
    },
    showOriginal: {
        type: OptionType.SELECT,
        description: "原文と翻訳文を表示します。",
        options: [
            {
                label: "原文を表示しない。",
                value: "no-orig",
                default: true,
            },
            {
                label: "原文をサブテキストで表示",
                value: "orig-in-subtext",
            },
            {
                label: "原文を表示し、翻訳をサブテキストで表示",
                value: "trans-in-subtext",
            },
        ]
    },
});

function parseList(value: string): Set<string> {
    return new Set(value.split(",").map(s => s.trim().toLowerCase()).filter(Boolean));
}

export function getExcludedLanguages(): Set<string> {
    return parseList(settings.store.excludedLanguages);
}

export function getIgnoredGuilds(): Set<string> {
    return parseList(settings.store.ignoredGuilds);
}

export function getIgnoredChannels(): Set<string> {
    return parseList(settings.store.ignoredChannels);
}

export function getIgnoredUsers(): Set<string> {
    return parseList(settings.store.ignoredUsers);
}
