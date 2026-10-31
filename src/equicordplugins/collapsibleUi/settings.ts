/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

export const panelRegistry = {
    guildBar: {
        id: "guildBar",
        classId: "guild-bar",
        label: "ギルドバー",
        collapsedKey: "guildBarCollapsed",
    },
    channelList: {
        id: "channelList",
        classId: "channel-list",
        label: "チャンネルリスト",
        collapsedKey: "channelListCollapsed",
    },
    membersList: {
        id: "membersList",
        classId: "members-list",
        label: "メンバーリスト",
        collapsedKey: "membersListCollapsed",
    },
    chatButtons: {
        id: "chatButtons",
        classId: "chat-buttons",
        label: "メッセージボタン",
        collapsedKey: "chatButtonsCollapsed",
    },
    titleBar: {
        id: "titleBar",
        classId: "title-bar",
        label: "タイトルバー",
        collapsedKey: "titleBarCollapsed",
    },
    headerBar: {
        id: "headerBar",
        classId: "header-bar",
        label: "ヘッダーバー",
        collapsedKey: "headerBarCollapsed",
    },
    userArea: {
        id: "userArea",
        classId: "user-area",
        label: "ユーザーエリア",
        collapsedKey: "userAreaCollapsed",
    },
} as const;

export type PanelId = keyof typeof panelRegistry;

export const toolbarPanelOrder = ["guildBar", "channelList", "membersList", "chatButtons", "titleBar", "headerBar", "userArea"] as const satisfies readonly PanelId[];

export const collapseSettingKeys = toolbarPanelOrder.map(panelId => panelRegistry[panelId].collapsedKey);

type CollapseSettingChangeHandler = (panelId: PanelId, collapsed: boolean) => void;
type UserAreaDetachSettingChangeHandler = () => void;

let collapseSettingChangeHandler: CollapseSettingChangeHandler | undefined;
let userAreaDetachSettingChangeHandler: UserAreaDetachSettingChangeHandler | undefined;

export function setCollapseSettingChangeHandler(handler: CollapseSettingChangeHandler | undefined) {
    collapseSettingChangeHandler = handler;
}

export function setUserAreaDetachSettingChangeHandler(handler: UserAreaDetachSettingChangeHandler | undefined) {
    userAreaDetachSettingChangeHandler = handler;
}

function onCollapseSettingChanged(panelId: PanelId) {
    return (collapsed: boolean) => collapseSettingChangeHandler?.(panelId, collapsed);
}

export const settings = definePluginSettings({
    detachUserArea: {
        type: OptionType.BOOLEAN,
        description: "ユーザーエリアを切り離し、折りたたまれていないときに自由に移動できるようにします。",
        default: false,
        onChange: () => userAreaDetachSettingChangeHandler?.(),
    },
    detachedUserAreaX: {
        type: OptionType.NUMBER,
        description: "切り離したユーザーエリアのX座標を保持します。",
        default: -1,
        hidden: true,
        onChange: () => userAreaDetachSettingChangeHandler?.(),
    },
    detachedUserAreaY: {
        type: OptionType.NUMBER,
        description: "切り離したユーザーエリアのY座標を保持します。",
        default: -1,
        hidden: true,
        onChange: () => userAreaDetachSettingChangeHandler?.(),
    },
    guildBarCollapsed: {
        type: OptionType.BOOLEAN,
        description: "サーバーバーを折りたたんだ状態で保持します。",
        default: false,
        hidden: true,
        onChange: onCollapseSettingChanged("guildBar"),
    },
    channelListCollapsed: {
        type: OptionType.BOOLEAN,
        description: "チャンネルリストを折りたたんだ状態で保持します。",
        default: false,
        hidden: true,
        onChange: onCollapseSettingChanged("channelList"),
    },
    membersListCollapsed: {
        type: OptionType.BOOLEAN,
        description: "メンバーリストを折りたたんだ状態で保持します。",
        default: false,
        hidden: true,
        onChange: onCollapseSettingChanged("membersList"),
    },
    chatButtonsCollapsed: {
        type: OptionType.BOOLEAN,
        description: "メッセージボタンの行を折りたたんだ状態で保持します。",
        default: false,
        hidden: true,
        onChange: onCollapseSettingChanged("chatButtons"),
    },
    titleBarCollapsed: {
        type: OptionType.BOOLEAN,
        description: "タイトルバーを折りたたんだ状態で保持します。",
        default: false,
        hidden: true,
        onChange: onCollapseSettingChanged("titleBar"),
    },
    headerBarCollapsed: {
        type: OptionType.BOOLEAN,
        description: "ヘッダーバーを折りたたんだ状態で保持します。",
        default: false,
        hidden: true,
        onChange: onCollapseSettingChanged("headerBar"),
    },
    userAreaCollapsed: {
        type: OptionType.BOOLEAN,
        description: "ユーザーエリアを折りたたんだ状態で保持します。",
        default: false,
        hidden: true,
        onChange: onCollapseSettingChanged("userArea"),
    },
});
