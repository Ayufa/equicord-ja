/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { makeRange, OptionType } from "@utils/types";
import { Channel, Message } from "@vencord/discord-types";
import { UserNotificationSetting } from "@vencord/discord-types/enums";
import { findByPropsLazy } from "@webpack";
import { ChannelStore, IconUtils, MessageStore, NavigationRouter, PresenceStore, RelationshipStore, SelectedChannelStore, StreamerModeStore, UserGuildSettingsStore, UserStore } from "@webpack/common";

import { setContainerPosition, showNotification, teardownNotifications } from "./components/Notifications";

const SelectedChannelActionCreators = findByPropsLazy("selectPrivateChannel");
const ChannelRTCActions = findByPropsLazy("updateChatOpen", "toggleParticipants");

const ID_REGEX = /^\d{17,20}$/;

let ignoredUsers: string[] = [];
let notifyFor: string[] = [];

export const settings = definePluginSettings({
    position: {
        type: OptionType.SELECT,
        description: "トースト通知の表示位置。",
        options: [
            {
                label: "左下",
                value: "bottom-left",
                default: true
            },
            {
                label: "左上",
                value: "top-left"
            },
            {
                label: "右上",
                value: "top-right"
            },
            {
                label: "右下",
                value: "bottom-right"
            },
        ],
        onChange: value => setContainerPosition(value),
    },
    timeout: {
        type: OptionType.SLIDER,
        description: "通知が表示される時間（秒）。",
        default: 5,
        markers: makeRange(1, 15, 1)
    },
    opacity: {
        type: OptionType.SLIDER,
        description: "通知の不透明度。",
        default: 100,
        markers: makeRange(10, 100, 10)
    },
    maxNotifications: {
        type: OptionType.SLIDER,
        description: "同時に表示される通知の最大数。",
        default: 3,
        markers: makeRange(1, 5, 1)
    },
    disableInStreamerMode: {
        type: OptionType.BOOLEAN,
        description: "配信者モードが有効なときは通知を表示しない。",
        default: true
    },
    respectDoNotDisturb: {
        type: OptionType.BOOLEAN,
        description: "ステータスが取り込み中のときは通知を表示しない。",
        default: false
    },
    directMessages: {
        type: OptionType.BOOLEAN,
        description: "ダイレクトメッセージの通知を表示する。",
        default: true
    },
    groupMessages: {
        type: OptionType.BOOLEAN,
        description: "グループメッセージの通知を表示する。",
        default: true
    },
    friendServerNotifications: {
        type: OptionType.BOOLEAN,
        description: "フレンドが共通のサーバーでメッセージを送信したときに通知を表示する。",
        default: true
    },
    ignoreUsers: {
        type: OptionType.STRING,
        description: "通知を表示しないユーザーIDのリスト（カンマ区切り）。",
        onChange: () => { ignoredUsers = parseIdList(settings.store.ignoreUsers); },
        default: "",
        placeholder: "000000000000000000,111111111111111111,222222222222222222"
    },
    notifyFor: {
        type: OptionType.STRING,
        description: "常に通知を受け取るチャンネルIDのリスト（カンマ区切り）。",
        onChange: () => { notifyFor = parseIdList(settings.store.notifyFor); },
        default: "",
        placeholder: "000000000000000000,111111111111111111,222222222222222222"
    },
    exampleButton: {
        type: OptionType.COMPONENT,
        description: "サンプルのトースト通知を表示する。",
        component: () => <Button onClick={showExampleNotification}>Show Example Notification</Button>
    }
});

export default definePlugin({
    name: "ToastNotifications",
    description: "ポップアップのトースト通知を表示します。DM、グループ、フレンド、サーバーチャンネルごとに設定できます。",
    tags: ["Appearance", "Customisation", "Notifications"],
    authors: [EquicordDevs.Skully, EquicordDevs.Ethan, EquicordDevs.Buzzy],
    settings,
    flux: {
        MESSAGE_CREATE({ message }: { message: Message; }) {
            const channel: Channel = ChannelStore.getChannel(message.channel_id);
            if (!channel) return;

            const currentUser = UserStore.getCurrentUser();

            // Check global conditions for all message types.
            if (
                (message.author.id === currentUser.id) // If message is from the user.
                || (channel.id === SelectedChannelStore.getChannelId()) // If the user is currently in the channel.
                || (ignoredUsers.includes(message.author.id)) // If the user is ignored.
                || (settings.store.respectDoNotDisturb && PresenceStore.getStatus(currentUser.id) === "dnd") // If notifications are disabled while in DND.
                || (settings.store.disableInStreamerMode && StreamerModeStore.enabled) // If notifications are disabled in streamer mode.
            ) return;

            // Channel type checks.
            if (channel.guild_id) {
                if (!shouldNotifyForGuildMessage(message, channel)) return;
            } else {
                if (
                    (!settings.store.directMessages && channel.isDM()) // If DM notifications are disabled.
                    || (!settings.store.groupMessages && channel.isGroupDM()) // If group DM notifications are disabled.
                    || UserGuildSettingsStore.isChannelMuted(null, channel.id) // If the user has muted the DM/group channel.
                ) return;
            }

            // Retrieve the message component for the message.
            const mockedMessage: Message | undefined = MessageStore.getMessages(message.channel_id)?.receiveMessage(message)?.get(message.id);
            if (!mockedMessage) return console.error(`[ToastNotifications] Failed to retrieve mocked message from MessageStore for message ID ${message.id}!`);

            showNotification({
                message,
                mockedMessage,
                channel,
                onClick: () => channel.guild_id
                    ? navigateToChannel(channel)
                    : SelectedChannelActionCreators.selectPrivateChannel(channel.id)
            });
        }
    },

    start() {
        ignoredUsers = parseIdList(settings.store.ignoreUsers);
        notifyFor = parseIdList(settings.store.notifyFor);
    },

    stop() {
        teardownNotifications();
        ignoredUsers = [];
        notifyFor = [];
    }
});

/**
 * Splits a comma-separated string into a list of valid Discord snowflake IDs.
 */
function parseIdList(str: string): string[] {
    if (!str) return [];
    return str.replace(/\s/g, "").split(",").filter(id => ID_REGEX.test(id));
}

/**
 * Navigates the client to the given channel, opening the chat panel for voice channels.
 */
function navigateToChannel(channel: Channel) {
    if (!ChannelStore.hasChannel(channel.id)) return;
    NavigationRouter.transitionTo(`/channels/${channel.guild_id ?? "@me"}/${channel.id}/`);
    if (channel.isGuildVocal?.()) ChannelRTCActions.updateChatOpen(channel.id, true);
}

/**
 * Decides whether a guild message should trigger a notification based on the
 * channel allowlist, friend-server-notifications setting, channel/guild mutes,
 * and the user's configured notification level for the channel/guild.
 */
function shouldNotifyForGuildMessage(message: Message, channel: Channel): boolean {
    // Allowlist always wins.
    if (notifyFor.includes(channel.id)) return true;

    // Friend-in-server toggle.
    if (settings.store.friendServerNotifications && RelationshipStore.isFriend(message.author.id)) return true;

    // Respect the user's mute state for the guild/category/channel.
    if (UserGuildSettingsStore.isGuildOrCategoryOrChannelMuted(channel.guild_id, channel.id)) return false;

    // Resolve the user's configured notification level for the channel/guild.
    const userGuildSettings = UserGuildSettingsStore.getAllSettings().userGuildSettings[channel.guild_id];
    if (!userGuildSettings) return false;

    const channelOverride = userGuildSettings.channel_overrides?.[channel.id];
    const level: UserNotificationSetting = (channelOverride && typeof channelOverride === "object" && "message_notifications" in channelOverride)
        ? channelOverride.message_notifications
        : (typeof userGuildSettings.message_notifications === "number" ? userGuildSettings.message_notifications : UserNotificationSetting.NO_MESSAGES);

    if (level === UserNotificationSetting.NO_MESSAGES) return false;
    if (level === UserNotificationSetting.ALL_MESSAGES) return true;

    // Otherwise we only notify if the user was mentioned.
    return message.content.includes(`<@${UserStore.getCurrentUser().id}>`);
}

function showExampleNotification(): Promise<void> {
    return showNotification({
        title: "Example Notification",
        body: "This is an example toast notification!",
        icon: IconUtils.getUserAvatarURL(UserStore.getCurrentUser()),
        permanent: false
    });
}
