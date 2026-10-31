/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { openPrivateChannel } from "@utils/discord";
import { ChannelRouter, GuildChannelStore, GuildStore, IconUtils, NavigationRouter, RelationshipStore, SelectedGuildStore, UserStore } from "@webpack/common";

import type { PaletteCommand, PaletteListItem } from "../api/types";
import { CompassIcon, GearIcon, HashIcon, HomeIcon, ServerIcon, UserIcon } from "../ui/icons";
import { DISCORD_SETTINGS_ROUTES, openSettingsPage } from "./openSettings";

const SECTION = "移動";

function guildItems(): PaletteListItem[] {
    return Object.values(GuildStore.getGuilds()).map(guild => ({
        id: guild.id,
        label: guild.name,
        icon: IconUtils.getGuildIconURL({ id: guild.id, icon: guild.icon, size: 64 }) ?? ServerIcon,
        actions: [{
            id: "open",
            label: "サーバーを開く",
            run: () => NavigationRouter.transitionToGuild(guild.id)
        }]
    }));
}

function channelItems(): PaletteListItem[] {
    const guildId = SelectedGuildStore.getGuildId();
    if (!guildId) return [];

    return GuildChannelStore.getSelectableChannels(guildId).map(({ channel }) => ({
        id: channel.id,
        label: `#${channel.name}`,
        icon: HashIcon,
        actions: [{
            id: "open",
            label: "チャンネルを開く",
            run: () => ChannelRouter.transitionToChannel(channel.id)
        }]
    }));
}

function friendItems(): PaletteListItem[] {
    const currentUserId = UserStore.getCurrentUser().id;

    return RelationshipStore.getFriendIDs()
        .filter(id => id !== currentUserId)
        .map(id => UserStore.getUser(id))
        .filter(user => user != null)
        .map(user => ({
            id: user.id,
            label: user.globalName || user.username,
            sublabel: user.username,
            icon: IconUtils.getUserAvatarURL(user, false, 64),
            actions: [{
                id: "open",
                label: "DMを開く",
                run: () => openPrivateChannel(user.id)
            }]
        }));
}

export const navigationCommands: PaletteCommand[] = [
    {
        id: "navigation.home",
        title: "ホームへ移動",
        section: SECTION,
        keywords: ["friends", "dms", "home"],
        icon: HomeIcon,
        actions: [{
            id: "run",
            label: "ホームへ移動",
            run: () => NavigationRouter.transitionTo("/channels/@me")
        }]
    },
    {
        id: "navigation.server",
        title: "サーバーへ移動",
        section: SECTION,
        keywords: ["guild", "server", "jump"],
        icon: ServerIcon,
        page: () => ({
            title: "サーバーへ移動",
            icon: ServerIcon,
            spec: { type: "list", placeholder: "サーバーを検索...", items: guildItems }
        })
    },
    {
        id: "navigation.channel",
        title: "チャンネルへ移動",
        section: SECTION,
        keywords: ["channel", "jump"],
        icon: HashIcon,
        predicate: () => SelectedGuildStore.getGuildId() != null,
        page: () => ({
            title: "チャンネルへ移動",
            icon: HashIcon,
            spec: { type: "list", placeholder: "チャンネルを検索...", items: channelItems }
        })
    },
    {
        id: "navigation.dm",
        title: "DMを開く",
        section: SECTION,
        keywords: ["dm", "message", "friend"],
        icon: UserIcon,
        page: () => ({
            title: "DMを開く",
            icon: UserIcon,
            spec: { type: "list", placeholder: "フレンドを検索...", items: friendItems }
        })
    },
    {
        id: "navigation.settings",
        title: "設定ページを開く",
        section: SECTION,
        keywords: ["settings", "preferences", "options"],
        icon: GearIcon,
        page: () => ({
            title: "設定ページを開く",
            icon: GearIcon,
            spec: {
                type: "list",
                placeholder: "設定ページを検索...",
                items: () => DISCORD_SETTINGS_ROUTES.map(entry => ({
                    id: entry.route,
                    label: entry.label,
                    keywords: entry.keywords,
                    icon: CompassIcon,
                    actions: [{
                        id: "open",
                        label: "設定ページを開く",
                        run: () => void openSettingsPage(entry.route, entry.label)
                    }]
                }))
            }
        })
    }
];
