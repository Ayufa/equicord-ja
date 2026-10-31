/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoPushToTalk",
    description: "プッシュトゥトークが強制されるチャンネルでも、その要件を回避してボイスアクティビティを使えるようにします。",
    tags: ["Servers", "Voice"],
    authors: [EquicordDevs.omaw],
    patches: [
        {
            find: "PermissionVADStore",
            replacement: [
                {
                    match: /\|\|\i\.\i\.can\(\i\.\i\.USE_VAD,\i\)\|\|/,
                    replace: "||true||"
                },
                {
                    match: /shouldShowWarning\(\)\{return!\i\}/,
                    replace: "shouldShowWarning(){return false}"
                },
                {
                    match: /canUseVoiceActivity\(\)\{return \i\}/,
                    replace: "canUseVoiceActivity(){return true}"
                },
            ]
        }
    ],
});
