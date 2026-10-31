/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const settings = definePluginSettings({
    showChatButton: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "チャットボタンを表示するかどうか",
        restartNeeded: true,
    },
    showMuteButton: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "ミュートボタンを表示するかどうか",
        restartNeeded: true,
    },
    showDeafenButton: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "スピーカーミュートボタンを表示するかどうか",
        restartNeeded: true,
    },
    muteSoundboard: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "スピーカーミュートボタンをクリックしたときに相手のサウンドボードを切り替えます。",
    },
    disableVideo: {
        type: OptionType.BOOLEAN,
        default: true,
        description: "スピーカーミュートボタンをクリックしたときに相手のビデオを切り替えます。",
    },
    useServer: {
        type: OptionType.BOOLEAN,
        description: "権限がある場合は、ローカルではなくサーバーのミュート/スピーカーミュートを使います。",
        default: false,
    },
    serverSelf: {
        type: OptionType.BOOLEAN,
        description: "ミュート/スピーカーミュート使用時にサーバー上でも自分をミュート/スピーカーミュートします。",
        default: false,
    },
    showButtonsSelf: {
        type: OptionType.SELECT,
        description: "自分のユーザーにもボタンを表示するかどうか。他のボタンと同じ機能ですが、クリックするとDMパネルが開き、自分をミュート/スピーカーミュートします。",
        restartNeeded: true,
        options: [
            { label: "表示", value: "display", default: true },
            { label: "非表示", value: "hide" },
            { label: "無効化", value: "disable" },
        ],
    },
    whichNameToShow: {
        type: OptionType.SELECT,
        description: "ツールチップにニックネームとユーザー名のどちらを表示するか選択します。",
        options: [
            { label: "両方", value: "both", default: true },
            { label: "グローバル名", value: "global" },
            { label: "ユーザー名", value: "username" },
        ],
    },
    buttonPosition: {
        type: OptionType.SELECT,
        description: "ボイスユーザーの行でボイスボタンを配置する場所を選択します。",
        options: [
            { label: "左", value: "left", default: true },
            { label: "右", value: "right" },
        ],
    }
}, {
    useServer: {
        disabled() {
            return !this.store.showMuteButton && !this.store.showDeafenButton;
        },
    },
    serverSelf: {
        disabled() {
            return !this.store.useServer && !this.store.showMuteButton && !this.store.showDeafenButton;
        },
    }
});
