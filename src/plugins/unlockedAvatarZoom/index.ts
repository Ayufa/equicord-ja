/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { makeRange, OptionType } from "@utils/types";

const settings = definePluginSettings({
    zoomMultiplier: {
        type: OptionType.SLIDER,
        description: "ズーム倍率",
        markers: makeRange(2, 16),
        default: 4,
    },
});

export default definePlugin({
    name: "UnlockedAvatarZoom",
    description: "アバター変更時の画像切り抜きツールで、さらに拡大できるようにします",
    tags: ["Media", "Utility"],
    authors: [Devs.nakoyasha],
    settings,
    patches: [
        {
            find: "#{intl::AVATAR_UPLOAD_EDIT_MEDIA}",
            replacement: {
                match: /maxValue:\d/,
                replace: "maxValue:$self.settings.store.zoomMultiplier",
            }
        }
    ]
});
