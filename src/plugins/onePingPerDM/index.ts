/*
 * Vencord, a Discord client mod
 * Copyright (c) 2023 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { MessageJSON } from "@vencord/discord-types";
import { ChannelType } from "@vencord/discord-types/enums";
import { ChannelStore, ReadStateStore, UserStore } from "@webpack/common";

const settings = definePluginSettings({
    channelToAffect: {
        type: OptionType.SELECT,
        description: "プラグインが影響を与える DM の種類を選択します",
        options: [
            { label: "両方", value: "both_dms", default: true },
            { label: "ユーザー DM", value: "user_dm" },
            { label: "グループ DM", value: "group_dm" },
        ]
    },
    allowMentions: {
        type: OptionType.BOOLEAN,
        description: "@メンションで音声通知を受け取ります",
        default: false,
    },
    allowEveryone: {
        type: OptionType.BOOLEAN,
        description: "グループ DM の @everyone と @here で音声通知を受け取ります",
        default: false,
    },
    ignoreUsers: {
        type: OptionType.STRING,
        description: "通知間隔の制限を絶対に受けないユーザー ID（カンマ + スペース区切り）",
        restartNeeded: true,
        default: ""
    },
    alwaysPlaySound: {
        type: OptionType.BOOLEAN,
        description: "メッセージ通知音が無効になっている場合でも再生します",
        restartNeeded: true,
        default: false
    }
});

export default definePlugin({
    name: "OnePingPerDM",
    description: "DMで同じユーザーから未読メッセージが複数回送られても、通知音は1回だけ鳴ります。メッセージを読むと制限がリセットされます",
    tags: ["Notifications", "Customisation"],
    authors: [Devs.ProffDea],
    isModified: true,
    settings,
    patches: [
        {
            find: '"NotificationStore"',
            replacement: [
                {
                    match: /\i\.\i\.getDesktopType\(\)===\i\.\i\.NEVER\)(?=.*?(\i\.\i\.playNotificationSound\(.{0,5}\)))/,
                    replace: "$&if(!$self.isPrivateChannelRead(arguments[0]?.message))return;else if($self.playSound())return $1;else "
                },
                {
                    match: /sound:(\i\?(\i):void 0,volume:\i,onClick)/,
                    replace: "sound:!$self.isPrivateChannelRead(arguments[0]?.message)?undefined:$self.playSound()?$2:$1"
                }
            ]
        }
    ],
    playSound() {
        return settings.store.alwaysPlaySound;
    },
    isPrivateChannelRead(message: MessageJSON) {
        const ignoreList = settings.store.ignoreUsers.split(", ").filter(Boolean);
        if (ignoreList.includes(message.author.id)) return true;
        const channelType = ChannelStore.getChannel(message.channel_id)?.type;
        if (
            (channelType !== ChannelType.DM && channelType !== ChannelType.GROUP_DM) ||
            (channelType === ChannelType.DM && settings.store.channelToAffect === "group_dm") ||
            (channelType === ChannelType.GROUP_DM && settings.store.channelToAffect === "user_dm") ||
            (settings.store.allowMentions && message.mentions.some(m => m.id === UserStore.getCurrentUser().id)) ||
            (settings.store.allowEveryone && message.mention_everyone)
        ) {
            return true;
        }
        return ReadStateStore.getOldestUnreadMessageId(message.channel_id) === message.id;
    },
});
