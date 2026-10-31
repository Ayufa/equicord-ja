/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { playAudio } from "@api/AudioPlayer";
import { type NavContextMenuPatchCallback } from "@api/ContextMenu";
import { Notifications } from "@api/index";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import { getCurrentChannel } from "@utils/discord";
import { Logger } from "@utils/Logger";
import definePlugin, { OptionType } from "@utils/types";
import type { Message } from "@vencord/discord-types";
import { ChannelActionCreators, ChannelStore, Menu, MessageStore, NavigationRouter, PresenceStore, UserStore, WindowStore } from "@webpack/common";
import { JSX } from "react";

interface IMessageCreate {
    channelId: string;
    guildId: string;
    message: Message;
}

const SILENT_PING_FLAG = 1 << 12;

function DisabledIcon(): JSX.Element {
    return (
        <svg
            width="18"
            height="18"
        >
            <circle cx="9" cy="9" r="8" fill="var(--status-danger)" />
            <circle cx="9" cy="9" r="3.75" fill="white" />
        </svg>
    );
}

function EnabledIcon(): JSX.Element {
    return (
        <svg
            width="18"
            height="18"
        >
            <circle cx="9" cy="9" r="8" fill="currentColor" />
            <circle cx="9" cy="9" r="3.75" fill="black" />
        </svg>
    );
}

function processIds(value: string): string {
    return value.replace(/\s/g, "").split(",").filter(id => id.trim() !== "").join(", ");
}

async function showNotification(message: Message, guildId: string | undefined): Promise<void> {
    try {
        const channel = ChannelStore.getChannel(message.channel_id);
        const channelRegex = /<#(\d{19})>/g;
        const userRegex = /<@(\d{18})>/g;

        message.content = message.content.replace(channelRegex, (match: any, channelId: string) => {
            return `#${ChannelStore.getChannel(channelId)?.name}`;
        });

        message.content = message.content.replace(userRegex, (match: any, userId: string) => {
            return `@${(UserStore.getUser(userId) as any).globalName}`;
        });

        await Notifications.showNotification({
            title: `${(message.author as any).globalName} ${guildId ? `(#${channel?.name}, ${ChannelStore.getChannel(channel?.parent_id)?.name})` : ""}`,
            body: message.content,
            icon: UserStore.getUser(message.author.id).getAvatarURL(undefined, undefined, false),
            onClick: function (): void {
                NavigationRouter.transitionTo(`/channels/${guildId ?? "@me"}/${message.channel_id}/${message.id}`);
            }
        });

        if (settings.store.notificationSound) {
            playAudio("message1");
        }
    } catch (error) {
        new Logger("BypassStatus").error("Failed to notify user: ", error);
    }
}

function ContextCallback(name: "guild" | "user" | "channel"): NavContextMenuPatchCallback {
    return (children, props) => {
        const type = props[name];
        if (!type) return;
        const enabled = settings.store[`${name}s`].split(", ").includes(type.id);
        if (name === "user" && type.id === UserStore.getCurrentUser().id) return;
        children.splice(-1, 0, (
            <Menu.MenuGroup>
                <Menu.MenuItem
                    id={`status-${name}-bypass`}
                    label={`${enabled ? "Remove" : "Add"} Status Bypass`}
                    icon={enabled ? EnabledIcon : DisabledIcon}
                    leadingAccessory={{ type: "icon", icon: enabled ? EnabledIcon : DisabledIcon }}
                    action={() => {
                        let bypasses: string[] = settings.store[`${name}s`].split(", ");
                        if (enabled) bypasses = bypasses.filter(id => id !== type.id);
                        else bypasses.push(type.id);
                        settings.store[`${name}s`] = bypasses.filter(id => id.trim() !== "").join(", ");
                    }}
                />
            </Menu.MenuGroup>
        ));
    };
}

const settings = definePluginSettings({
    guilds: {
        type: OptionType.STRING,
        description: "バイパス対象のサーバー（サーバー内のどこでメンションされても通知されます）",
        default: "",
        placeholder: "カンマで区切って入力",
        onChange: value => settings.store.guilds = processIds(value)
    },
    channels: {
        type: OptionType.STRING,
        description: "バイパス対象のチャンネル（そのチャンネルでメンションされたら通知されます）",
        default: "",
        placeholder: "カンマで区切って入力",
        onChange: value => settings.store.channels = processIds(value)
    },
    users: {
        type: OptionType.STRING,
        description: "バイパス対象のユーザー（DMで送られたすべてのメッセージを通知します）",
        default: "",
        placeholder: "カンマで区切って入力",
        onChange: value => settings.store.users = processIds(value)
    },
    allowOutsideOfDms: {
        type: OptionType.BOOLEAN,
        description: "選択したユーザーがDM以外でもステータスをバイパスできるようにします（チャンネル/サーバーのバイパスと同様ですが、選択したユーザーが送信したすべてのメッセージが対象です）"
    },
    notificationSound: {
        type: OptionType.BOOLEAN,
        description: "通知音を鳴らすかどうか",
        default: true,
    },
    respectSilentPings: {
        type: OptionType.BOOLEAN,
        description: "サイレントメンション（@silent / 通知を抑制）を尊重します",
        default: true
    },
    statusToUse: {
        type: OptionType.SELECT,
        description: "ホワイトリストに使用するステータス",
        options: [
            {
                label: "オンライン",
                value: "online",
            },
            {
                label: "退席中",
                value: "idle",
            },
            {
                label: "取り込み中",
                value: "dnd",
                default: true
            },
            {
                label: "表示しない",
                value: "invisible",
            }
        ]
    }
});

export default definePlugin({
    name: "BypassStatus",
    description: "おやすみモード中でも特定の相手からの通知を受け取れるようにします。ユーザー / チャンネル / サーバーを右クリックして、おやすみモードのバイパス対象に設定できます。",
    tags: ["Activity", "Customisation", "Notifications", "Servers"],
    authors: [Devs.Inbestigator],
    dependencies: ["AudioPlayerAPI"],
    flux: {
        async MESSAGE_CREATE({ message, guildId, channelId }: IMessageCreate): Promise<void> {
            try {
                const currentUser = UserStore.getCurrentUser();
                const userStatus = await PresenceStore.getStatus(currentUser.id);
                const currentChannelId = getCurrentChannel()?.id ?? "0";
                if (message.state === "SENDING" || message.content === "" || message.author.id === currentUser.id || (channelId === currentChannelId && WindowStore.isFocused()) || userStatus !== settings.store.statusToUse) {
                    return;
                }
                if (settings.store.respectSilentPings && (message.flags & SILENT_PING_FLAG)) { return; }
                const mentioned = MessageStore.getMessage(channelId, message.id)?.mentioned;
                if ((settings.store.guilds.split(", ").includes(guildId) || settings.store.channels.split(", ").includes(channelId)) && mentioned) {
                    await showNotification(message, guildId);
                } else if (settings.store.users.split(", ").includes(message.author.id)) {
                    const userChannelId = await ChannelActionCreators.getOrEnsurePrivateChannel(message.author.id);
                    if (channelId === userChannelId || (mentioned && settings.store.allowOutsideOfDms === true)) {
                        await showNotification(message, guildId);
                    }
                }
            } catch (error) {
                new Logger("BypassStatus").error("Failed to handle message: ", error);
            }
        }
    },
    settings,
    contextMenus: {
        "guild-context": ContextCallback("guild"),
        "channel-context": ContextCallback("channel"),
        "user-context": ContextCallback("user"),
    }
});
