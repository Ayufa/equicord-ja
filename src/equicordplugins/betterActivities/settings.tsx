/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { React } from "@webpack/common";

export const settings = definePluginSettings({
    memberList: {
        type: OptionType.BOOLEAN,
        description: "メンバーリストにアクティビティアイコンを表示します",
        default: true,
        restartNeeded: true,
    },
    iconSize: {
        type: OptionType.SLIDER,
        description: "アクティビティアイコンのサイズ",
        markers: [10, 15, 20],
        default: 15,
        stickToMarkers: false,
    },
    specialFirst: {
        type: OptionType.BOOLEAN,
        description: "特別なアクティビティを最初に表示します（現在は Spotify と Twitch）",
        default: true,
        restartNeeded: false,
    },
    renderGifs: {
        type: OptionType.BOOLEAN,
        description: "GIFの描画を許可します",
        default: true,
        restartNeeded: false,
    },
    removeGameActivityStatus: {
        type: OptionType.BOOLEAN,
        description: "ゲームアクティビティのアイコンとステータスを削除します",
        default: false,
        restartNeeded: true,
    },
    divider: {
        type: OptionType.COMPONENT,
        description: "",
        component: () => (
            <div style={{
                width: "100%",
                height: 1,
                borderTop: "thin solid var(--input-border-default, var(--input-border))",
                paddingTop: 5,
                paddingBottom: 5
            }} />
        ),
    },
    userPopout: {
        type: OptionType.BOOLEAN,
        description: "プロフィールのポップアウト/サイドバーにすべてのアクティビティを表示します",
        default: true,
        restartNeeded: true,
    },
    hideTooltip: {
        type: OptionType.BOOLEAN,
        description: "さまざまな場所でアクティビティを非表示にします",
        default: true,
    },
    allActivitiesStyle: {
        type: OptionType.SELECT,
        description: "すべてのアクティビティの表示スタイル",
        options: [
            {
                default: true,
                label: "カルーセル",
                value: "carousel",
            },
            {
                label: "リスト",
                value: "list",
            },
        ]
    }
});
