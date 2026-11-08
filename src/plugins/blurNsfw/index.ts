/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { managedStyleRootNode } from "@api/Styles";
import { Devs } from "@utils/constants";
import { createAndAppendStyle } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";
import { Channel } from "@vencord/discord-types";

let style: HTMLStyleElement;

const settings = definePluginSettings({
    blurAmount: {
        type: OptionType.NUMBER,
        description: "ぼかしの量（ピクセル）",
        default: 10,
        min: 0,
        onChange: setCss
    },
    blurAllChannels: {
        type: OptionType.BOOLEAN,
        description: "すべてのチャンネルで添付ファイルをぼかす（NSFW チャンネル以外も）",
        default: false
    },
    ignoredChannels: {
        type: OptionType.STRING,
        description: "添付ファイルをぼかさないチャンネルIDのリスト（スペースまたはカンマ区切り）",
        default: "",
        multiline: true,
    }
});

function setCss() {
    style.textContent = `
        .vc-nsfw-img [class*=imageContainer] img,
        .vc-nsfw-img [class*=imageContainer] video,
        .vc-nsfw-img [class*=wrapperPaused] img,
        .vc-nsfw-img [class*=wrapperPaused] video {
            filter: blur(${settings.store.blurAmount}px);
            transition: filter 0.2s;
        }

        .vc-nsfw-img [class*=imageContainer]:hover img,
        .vc-nsfw-img [class*=imageContainer]:hover video,
        .vc-nsfw-img [class*=wrapperPaused]:hover img,
        .vc-nsfw-img [class*=wrapperPaused]:hover video {
            filter: blur(0);
        }
        `;
}

export default definePlugin({
    name: "BlurNSFW",
    description: "NSFW チャンネルの添付ファイルを、ホバーするまでぼかします",
    tags: ["Privacy", "Appearance"],
    authors: [Devs.Ven],
    isModified: true,
    settings,

    shouldBlur(channel?: Channel) {
        const { ignoredChannels, blurAllChannels } = settings.store;
        if (!channel || !channel.nsfw && !blurAllChannels) return false;
        return !ignoredChannels.includes(channel.id) && !ignoredChannels.includes(channel.parent_id);
    },

    patches: [
        {
            find: "}renderStickersAccessories(",
            replacement: [
                {
                    match: /(\.renderReactions\(\i\).+?className:)/,
                    replace: '$&($self.shouldBlur(this?.props?.channel)?"vc-nsfw-img ":"")+'
                }
            ]
        }
    ],

    start() {
        style = createAndAppendStyle("VcBlurNsfw", managedStyleRootNode);

        setCss();
    },

    stop() {
        style?.remove();
    }
});
