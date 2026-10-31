/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

const MIDDLE_CLICK = 1;
let lastMiddleClickUp = 0;

function updateListeners(refresh: boolean = true) {
    document.removeEventListener("mouseup", handleMouseUp, true);
    document.removeEventListener("auxclick", handleAuxClick, true);

    if (refresh) {
        document.addEventListener("mouseup", handleMouseUp, true);
        document.addEventListener("auxclick", handleAuxClick, true);
    }
}

function handleAuxClick(event: MouseEvent) {
    if (event.button !== MIDDLE_CLICK) return false;

    const { openScope } = settings.store;

    const target = event.target as HTMLElement | null;
    const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
    const media = target?.closest("a[href][data-role='img'], a[href][data-role='video']") as HTMLAnchorElement | null;
    const role = anchor?.dataset.role ?? "";

    const isMedia = !!media;
    const isLink = !isMedia && !!anchor?.href && anchor.getAttribute("href") !== "#" && !["img", "video", "button"].includes(role);

    if (isLink && ["links", "both"].includes(openScope)) {
        event.preventDefault();
        event.stopPropagation();
    } else if (isMedia && ["media", "both"].includes(openScope)) {
        event.preventDefault();
        event.stopPropagation();
    }
}

function handleMouseUp(event: MouseEvent) {
    if (event.button === MIDDLE_CLICK) lastMiddleClickUp = Date.now();
}

const settings = definePluginSettings({
    openScope: {
        type: OptionType.SELECT,
        description: "これらのコンテンツタイプを中クリックで開かないようにします。",
        options: [
            { label: "リンク", value: "links" },
            { label: "メディア", value: "media" },
            { label: "リンクとメディア", value: "both" },
            { label: "なし", value: "none", default: true },
        ],
        onChange(newValue) { updateListeners(newValue !== "none"); }
    },
    pasteScope: {
        type: OptionType.SELECT,
        description: "これらの状況で中クリックによる貼り付けを防止します。",
        options: [
            { label: "常に中クリック貼り付けを防止", value: "always", default: true },
            { label: "テキストエリアにフォーカスがないときだけ防止", value: "focus" },
        ]
    },
    pasteThreshold: {
        type: OptionType.NUMBER,
        description: "中クリック後に貼り付けが再び有効になるまでのミリ秒。",
        default: 100,
        onChange(newValue) { if (newValue < 1) { settings.store.pasteThreshold = 1; } }
    }
});

export default definePlugin({
    name: "MiddleClickTweaks",
    description: "貼り付けやリンクを開く動作など、中クリックに関するさまざまな調整を追加します。",
    authors: [EquicordDevs.Etorix, EquicordDevs.korzi],
    settings,

    tags: ["Utility"],
    searchTerms: ["LimitMiddleClickPaste"],

    isPastingDisabled(isInput: boolean) {
        const pasteBlocked = Date.now() - lastMiddleClickUp < Math.max(settings.store.pasteThreshold, 1);
        const { pasteScope } = settings.store;

        if (!pasteBlocked) return false;
        if (pasteScope === "always") return true;
        if (pasteScope === "focus" && !isInput) return true;

        return false;
    },

    start() { updateListeners(); },
    stop() { updateListeners(false); },

    patches: [
        {
            // Detects paste events triggered by the "browser" outside of input fields.
            find: 'document.addEventListener("paste",',
            replacement: {
                match: /(?<=APPLICATION_DIRECTORY}\)}\(\);return \i\.useEffect\(\(\)=>{function \i\((\i)\)\{)/,
                replace: "if($1.target.tagName===\"BUTTON\"||$self.isPastingDisabled(false)){$1.preventDefault?.();$1.stopPropagation?.();return;};"
            }
        },
        {
            // Detects paste events triggered inside of Discord's text inputs.
            find: ",origin:\"clipboard\"});",
            replacement: {
                match: /(?<=handlePaste=(\i)=>{)(?=let)/g,
                replace: "if($self.isPastingDisabled(true)){$1.preventDefault?.();$1.stopPropagation?.();return;}"
            }
        },
        {
            // Detects paste events triggered inside Discord's channel search editor.
            find: "onPasteCapture:function",
            replacement: {
                match: /(?<=onPasteCapture:function\((\i)\){)(?=\i\.insertData\(\1\.clipboardData\))/,
                replace: "if($self.isPastingDisabled(true)){$1.preventDefault?.();$1.stopPropagation?.();return;}"
            }
        }
    ],
});
