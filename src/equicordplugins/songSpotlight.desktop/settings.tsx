/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { makeRange, OptionType } from "@utils/types";

import { apiConstants } from "./lib/api";
import Settings from "./ui/settings";

export default definePluginSettings({
    collapseSongList: {
        type: OptionType.BOOLEAN,
        description: "ユーザープロフィールの曲リストを、別メニューを開くボタンに折りたたみます",
        default: false,
    },
    profileSongsLimit: {
        type: OptionType.SLIDER,
        description: "ユーザーを最初にクリックしたときに表示される曲の数",
        default: apiConstants.songLimit,
        markers: makeRange(1, 3),
    },
    previewVolume: {
        type: OptionType.SLIDER,
        description: "再生時の曲プレビューの音量",
        markers: [0, 25, 50, 100],
        default: 100,
        stickToMarkers: false
    },
    manager: {
        type: OptionType.COMPONENT,
        component: () => <Settings />,
    },
}, {
    profileSongsLimit: {
        disabled() {
            return this.store.collapseSongList;
        },
    },
});
