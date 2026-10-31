/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const settings = definePluginSettings({
    onlySnow: {
        type: OptionType.BOOLEAN,
        description: "Only play the Snow Halation Theme",
        default: false,
        restartNeeded: true
    }
});

export default definePlugin({
    name: "SecretRingToneEnabler",
    description: "Discordの着信音のシークレットバージョンを常に再生します（特別な着信音イベント時を除く）",
    tags: ["Notifications", "Fun"],
    authors: [Devs.AndrewDLO, Devs.FieryFlames, Devs.RamziAH],
    settings,
    patches: [
        {
            find: '"call_ringing_beat"',
            replacement: [
                {
                    match: /500!==\i\(\)\.random\(1,1e3\)/,
                    replace: "false"
                },
                {
                    predicate: () => settings.store.onlySnow,
                    match: /"call_ringing_beat",/,
                    replace: ""
                }
            ]
        }
    ]
});
