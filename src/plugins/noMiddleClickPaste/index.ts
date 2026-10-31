/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Devs, IS_LINUX } from "@utils/constants";
import definePlugin from "@utils/types";

function preventMiddleClick(e: MouseEvent) {
    if (e.button === 1) {
        e.preventDefault();
    }
}

export default definePlugin({
    name: "NoMiddleClickPaste",
    description: "Linuxの中クリック貼り付けを無効化します（Linuxのみ）",
    authors: [Devs.Darxoon],
    tags: ["Accessibility"],
    hidden: !IS_LINUX,

    start() {
        window.addEventListener("mouseup", preventMiddleClick);
    },

    stop() {
        window.removeEventListener("mouseup", preventMiddleClick);
    },
});
