/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

const settings = definePluginSettings({
    logJoinLeave: {
        type: OptionType.BOOLEAN,
        description: "ユーザーがボイスチャンネルに参加、退出、移動したときに記録します。",
        default: true
    },
    logSoundboard: {
        type: OptionType.BOOLEAN,
        description: "ユーザーがサウンドボードのサウンドを再生したときに記録します。",
        default: true
    },
    logMuteDeafen: {
        type: OptionType.BOOLEAN,
        description: "ユーザーがサーバーミュートまたはスピーカーミュートされたときに記録します。",
        default: true
    },
    logVideo: {
        type: OptionType.BOOLEAN,
        description: "ユーザーがカメラをオン/オフしたときに記録します。",
        default: true
    },
    logStream: {
        type: OptionType.BOOLEAN,
        description: "ユーザーが画面共有を開始または停止したときに記録します。",
        default: true
    },
    logActivity: {
        type: OptionType.BOOLEAN,
        description: "ユーザーが埋め込みアクティビティを開始したときに記録します。",
        default: true
    },
    ignoreBlockedUsers: {
        type: OptionType.BOOLEAN,
        description: "ブロックしたユーザーは記録しません。",
        default: false
    },
    soundboardFileType: {
        type: OptionType.SELECT,
        description: "サウンドボードのサウンドをダウンロードする際のファイル形式。",
        options: [
            { label: ".ogg", value: ".ogg", default: true },
            { label: ".mp3", value: ".mp3" },
            { label: ".wav", value: ".wav" },
        ],
    },
    soundboardVolume: {
        type: OptionType.SLIDER,
        description: "サウンドボードのサウンドのプレビュー音量（0で無効）。",
        default: 0.5,
        markers: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
    },
});

export default settings;
