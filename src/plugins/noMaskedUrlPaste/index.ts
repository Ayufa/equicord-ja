/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs } from "@utils/constants.js";
import definePlugin from "@utils/types";

export default definePlugin({
    name: "NoMaskedUrlPaste",
    authors: [Devs.CatNoir],
    description: "テキストを選択した状態でリンクを貼り付けても、マスク付きURLとして貼り付けられなくなります",
    tags: ["Chat", "Utility"],
    patches: [
        {
            find: ".selection,preventEmojiSurrogates:",
            replacement: {
                match: /if\(null!=\i.selection&&\i.\i.isExpanded\(\i.selection\)\)/,
                replace: "if(false)"
            }
        }
    ],
});
