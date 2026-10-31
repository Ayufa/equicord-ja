/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { FormatSetting } from ".";

export const settings = definePluginSettings({
    format: {
        component: ({ setValue }) => FormatSetting(setValue),
        type: OptionType.COMPONENT,
        default: "{equicordIcon} Equicord {equicordVersion} ({equicordHash})",
        restartNeeded: true
    }
});

export const names: Record<string, string> = {
    stable: "Stable",
    ptb: "PTB",
    canary: "Canary",
    staging: "Staging"
};

export const settingVariables = [
    "Discord の変数:",
    "{discordIcon} - Discord のアイコン",
    "{devbannerIcon} - 開発バナーのアイコン",
    "{buildChannel} - Discord のビルドチャンネル（例: Stable）",
    "{buildNumber} - Discord のビルド番号（例: 123456）",
    "{buildHash} - Discord のビルドハッシュ（例: 123456789）",
    "",
    "Equicord の変数:",
    "{equicordIcon} - Equicord のアイコン",
    "{equicordVersion} - Equicord のバージョン（例: 1.0.0）",
    "{equicordHash} - Equicord のビルドハッシュ（例: 123456789）",
    "{equicordPlatform} - Equicord が動作しているプラットフォーム（例: Dev Build）",
    "",
    "Equibop 固有の変数:",
    "{equibopHash} - Equibop のビルドハッシュ（例: 123456789）",
    "{equibopPlatform} - Equibop が動作しているプラットフォーム（例: Dev Build）",
    "",
    "クライアントの変数:",
    "{clientIcon} - デスクトップのアイコン",
    "{clientName} - 現在のクライアント名",
    "{clientVersion} - クライアントのバージョン（例: 1.0.0）",
    "",
    "Electron の変数:",
    "{electronIcon} - Electron のアイコン",
    "{electronVersion} - Electron ランタイムのバージョン（例: 25.0.0）",
    "",
    "Chromium の変数:",
    "{chromiumIcon} - Chromium のアイコン",
    "{chromiumVersion} - Chromium エンジンのバージョン（例: 125.0.0.0）",
    "",
    "その他の変数:",
    "{newline} or \\n - 改行文字",
    "",
];
