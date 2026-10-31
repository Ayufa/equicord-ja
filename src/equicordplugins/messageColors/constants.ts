/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const enum RenderType {
    BLOCK,
    FOREGROUND,
    BACKGROUND,
}

export const enum BlockDisplayType {
    LEFT,
    RIGHT,
    BOTH
}

export const settings = definePluginSettings({
    renderType: {
        type: OptionType.SELECT,
        description: "色のレンダリング方法",
        options: [
            {
                label: "文字色",
                value: RenderType.FOREGROUND,
                default: true,
            },
            {
                label: "ブロックを隣に表示",
                value: RenderType.BLOCK,
            },
            {
                label: "背景色",
                value: RenderType.BACKGROUND
            },
        ]
    },
    enableShortHexCodes: {
        type: OptionType.BOOLEAN,
        description: "#39f のような3文字の16進コードを有効化します",
        default: true,
        // Regex are created on the start, so without restart nothing would change
        restartNeeded: true
    },
    blockView: {
        type: OptionType.SELECT,
        disabled: () => settings.store.renderType !== RenderType.BLOCK,
        description: "色付きブロックの表示位置",
        options: [
            {
                label: "右側",
                value: BlockDisplayType.RIGHT,
                default: true
            },
            {
                label: "左側",
                value: BlockDisplayType.LEFT
            },
            {
                label: "両側",
                value: BlockDisplayType.BOTH
            }
        ]
    }
});

export const enum ColorType {
    RGB,
    RGBA,
    HEX,
    HSL
}

// It's sooo hard to read regex without this, it makes it at least somewhat bearable
export const replaceRegexp = (reg: string) => {
    const n = new RegExp(reg
        // \c - 'comma'
        // \v - 'value'
        // \f - 'float'
        .replaceAll("\\f", "[+-]?([0-9]*[.])?[0-9]+")
        .replaceAll("\\c", "(?:,|\\s)")
        .replaceAll("\\v", "\\s*?\\d+?\\s*?"), "g");

    return n;
};

export const regex = [
    { reg: /rgb\(\v\c\v\c\v\)/g, type: ColorType.RGB },
    { reg: /rgba\(\v\c\v\c\v(\c|\/?)\s*\f\)/g, type: ColorType.RGBA },
    { reg: /hsl\(\v°?\c\s*?\d+%?\s*?\c\s*?\d+%?\s*?\)/g, type: ColorType.HSL },
].map(v => { v.reg = replaceRegexp(v.reg.source); return v; });
