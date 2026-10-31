/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { makeRange, OptionType } from "@utils/types";

const settings = definePluginSettings({
    volume: {
        type: OptionType.SLIDER,
        description: "Spotify 埋め込みに設定する音量 %。10% を超えると音がとても大きくなります",
        markers: makeRange(0, 100, 10),
        stickToMarkers: false,
        default: 10
    }
});

// The entire code of this plugin can be found in ipcPlugins
export default definePlugin({
    name: "FixSpotifyEmbeds",
    description: "音量をカスタマイズできるようにすることで、Spotify の埋め込みが異常に大きくなる問題を修正します",
    authors: [Devs.Ven],
    tags: ["Media", "Customisation"],
    settings,
});
