/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "StopAutoUnread",
    description: 'Discordがチャンネルの通知設定を自動的に"すべてのメッセージ"に変更するのを防ぎます',
    tags: ["Notifications"],
    authors: [EquicordDevs.SobakinTech],
    patches: [
        {
            find: "}maybeAutoUpgradeChannel(",
            replacement: {
                match: /maybeAutoUpgradeChannel\(\i\){/,
                replace: "$&return !1;"
            }
        }
    ]
});
