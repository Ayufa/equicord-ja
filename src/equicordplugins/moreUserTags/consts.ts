/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Channel, Guild, Message, RC, User } from "@vencord/discord-types";
import { findByCodeLazy, findLazy } from "@webpack";
import { GuildStore } from "@webpack/common";

import { settings } from "./settings";
import type { ITag } from "./types";

export const isWebhook = (message: Message, user: User) => {
    const isFollowed = message?.type === 0 && !!message?.messageReference && !settings.store.showWebhookTagFully;
    return !!message?.webhookId && user.isNonUserBot() && !isFollowed;
};

export const tags = [
    {
        name: "WEBHOOK",
        displayName: "ウェブフック",
        description: "ウェブフックから送信されたメッセージ",
        condition: isWebhook
    }, {
        name: "OWNER",
        displayName: "所有者",
        description: "サーバーの所有者",
        condition: (_, user, channel) => GuildStore.getGuild(channel?.guild_id)?.ownerId === user.id
    }, {
        name: "ADMINISTRATOR",
        displayName: "管理者",
        description: "管理者権限を持っています",
        permissions: ["ADMINISTRATOR"]
    }, {
        name: "MODERATOR_STAFF",
        displayName: "スタッフ",
        description: "サーバー、チャンネル、ロールを管理できます",
        permissions: ["MANAGE_GUILD", "MANAGE_CHANNELS", "MANAGE_ROLES"]
    }, {
        name: "MODERATOR",
        displayName: "モデレーター",
        description: "メッセージの管理や、キック/BAN ができます",
        permissions: ["MANAGE_MESSAGES", "KICK_MEMBERS", "BAN_MEMBERS"]
    }, {
        name: "VOICE_MODERATOR",
        displayName: "VCモデレーター",
        description: "ボイスチャットを管理できます",
        permissions: ["MOVE_MEMBERS", "MUTE_MEMBERS", "DEAFEN_MEMBERS"]
    }, {
        name: "CHAT_MODERATOR",
        displayName: "チャットモデレーター",
        description: "ユーザーをタイムアウトできます",
        permissions: ["MODERATE_MEMBERS"]
    }
] as const satisfies ITag[];

export const Tag = findLazy(m => m.Types?.[0] === "BOT") as RC<{ type?: number | null, className?: string, useRemSizes?: boolean; }> & { Types: Record<string, number>; };

// PermissionStore.computePermissions will not work here since it only gets permissions for the current user
export const computePermissions: (options: {
    user?: { id: string; } | string | null;
    context?: Guild | Channel | null;
    overwrites?: Channel["permissionOverwrites"] | null;
    checkElevated?: boolean /* = true */;
    excludeGuildPermissions?: boolean /* = false */;
}) => bigint = findByCodeLazy(".getCurrentUser()", ".computeLurkerPermissionsAllowList()");
