/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    defaultLayout: {
        type: OptionType.SELECT,
        options: [
            { label: "リスト", value: 1, default: true },
            { label: "ギャラリー", value: 2 }
        ],
        description: "デフォルトで使用するレイアウト"
    },
    defaultSortOrder: {
        type: OptionType.SELECT,
        options: [
            { label: "最近のアクティビティ", value: 0, default: true },
            { label: "投稿日", value: 1 }
        ],
        description: "デフォルトで使用する並び順"
    }
});

export default definePlugin({
    name: "OverrideForumDefaults",
    description: "フォーラムのデフォルトのレイアウト／並び順を上書きできるようにします。チャンネルごとに変更することも可能です",
    tags: ["Servers", "Organisation", "Customisation"],
    authors: [Devs.Inbestigator],
    patches: [
        {
            find: "getDefaultLayout(){",
            replacement: [
                {
                    match: /}getDefaultLayout\(\){/,
                    replace: "$&return $self.getLayout();"
                },
                {
                    match: /}getDefaultSortOrder\(\){/,
                    replace: "$&return $self.getSortOrder();"
                }
            ]
        }
    ],

    getLayout: () => settings.store.defaultLayout,
    getSortOrder: () => settings.store.defaultSortOrder,

    settings
});
