/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import type { Channel, Emoji } from "@vencord/discord-types";

const settings = definePluginSettings({
    shownEmojis: {
        description: "自動補完メニューに表示する絵文字の種類。",
        type: OptionType.SELECT,
        default: "onlyUnicode",
        options: [
            { label: "Unicode 絵文字のみ", value: "onlyUnicode" },
            { label: "Unicode 絵文字と現在のサーバーのサーバー絵文字", value: "currentServer" },
            { label: "Unicode 絵文字とすべてのサーバー絵文字（Discord のデフォルト）", value: "all" }
        ]
    }
});

export default definePlugin({
    name: "NoServerEmojis",
    authors: [Devs.UlyssesZhan],
    description: "オートコンプリートメニューにサーバー絵文字を表示しません。",
    tags: ["Emotes", "Servers"],
    settings,

    patches: [
        {
            find: "}searchWithoutFetchingLatest(",
            replacement: {
                match: /\.nameMatchesChain\(\i\)\.reduce\(\((\i),(\i)\)=>\{(?<=channel:(\i).+?)/,
                replace: "$&if($self.shouldSkip($3,$2))return $1;"
            }
        }
    ],

    shouldSkip(channel: Channel | undefined | null, emoji: Emoji) {
        if (emoji.type !== 1) {
            return false;
        }

        if (settings.store.shownEmojis === "onlyUnicode") {
            return true;
        }

        if (settings.store.shownEmojis === "currentServer") {
            return emoji.guildId !== (channel != null ? channel.getGuildId() : null);
        }

        return false;
    }
});
