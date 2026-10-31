/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { definePluginSettings } from "@api/Settings";
import { InfoIcon } from "@components/Icons";
import { Devs, EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { Guild } from "@vencord/discord-types";
import { Menu } from "@webpack/common";

import { openGuildInfoModal } from "./GuildInfoModal";

const makePatch: (showIcon: boolean) => NavContextMenuPatchCallback = showIcon => (children, { guild }: { guild: Guild; }) => {
    const group = findGroupChildrenByChildId("privacy", children);

    group?.push(
        <Menu.MenuItem
            id="vc-server-info"
            label="サーバー情報"
            leadingAccessory={showIcon ? { type: "icon", icon: InfoIcon } : undefined}
            action={() => openGuildInfoModal(guild)}
        />
    );
};

export const settings = definePluginSettings({
    sorting: {
        type: OptionType.SELECT,
        description: "ユーザー名、または該当する場合は表示名",
        options: [
            {
                label: "ユーザー名",
                value: "username"
            },
            {
                label: "表示名",
                value: "displayname",
                default: true
            },
            {
                label: "並べ替えない",
                value: "none",
            }
        ]
    }
});

export default definePlugin({
    name: "ServerInfo",
    description: "サーバーの情報を表示できるようにします",
    tags: ["Servers", "Utility"],
    authors: [Devs.Ven, Devs.Nuckyz, EquicordDevs.Z1xus],
    dependencies: ["DynamicImageModalAPI"],
    searchTerms: ["guild", "info", "ServerProfile"],
    isModified: true,
    settings,
    contextMenus: {
        "guild-context": makePatch(false),
        "guild-header-popout": makePatch(true)
    }
});
