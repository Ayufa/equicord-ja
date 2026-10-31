/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    inviteDuration: {
        type: OptionType.SELECT,
        description: "招待の有効期間",
        options: [
            { label: "30分", value: 1800 },
            { label: "1時間", value: 3600 },
            { label: "6時間", value: 21600 },
            { label: "12時間", value: 43200 },
            { label: "1日", value: 86400 },
            { label: "7日", value: 604800 },
            { label: "無期限", value: 0, default: true },
        ],
    },
    maxUses: {
        type: OptionType.SELECT,
        description: "招待の使用回数",
        options: [
            { label: "無限", value: 0, default: true },
            { label: "1", value: 1 },
            { label: "5", value: 5 },
            { label: "10", value: 10 },
            { label: "25", value: 25 },
            { label: "50", value: 50 },
            { label: "100", value: 100 },
        ],
    },
    temporaryMembership: {
        type: OptionType.BOOLEAN,
        default: false,
        description: "一時メンバーシップ",
    },
});

export default definePlugin({
    name: "InviteDefaults",
    description: "サーバー招待を作成する際のデフォルト値を編集できます。",
    tags: ["Servers"],
    authors: [EquicordDevs.VillainsRule],
    settings,
    patches: [
        {
            find: ".GUILD_CREATE_INVITE_SUGGESTION,defaultMaxAge",
            replacement: [
                {
                    match: /(?<=maxAge:)\i\?\?\i\?\?\i/,
                    replace: "$self.settings.store.inviteDuration"
                },
                {
                    match: /(?<=maxUses:)null!=\i&&0!==\i\?\i:\i.value/,
                    replace: "$self.settings.store.maxUses"
                },
                {
                    match: /(?<=temporary:)\i\?\?!1/,
                    replace: "$self.settings.store.temporaryMembership"
                }
            ]
        }
    ]
});
