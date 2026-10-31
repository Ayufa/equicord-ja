/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import type { Message } from "@vencord/discord-types";
import { ChannelStore, GuildMemberStore } from "@webpack/common";

const settings = definePluginSettings({
    userList: {
        description:
            "メンションを許可または免除するユーザー ID のリスト（カンマまたはスペース区切り）",
        type: OptionType.STRING,
        default: "1234567890123445,1234567890123445",
        multiline: true
    },
    roleList: {
        description:
            "メンションを許可または免除するロール ID のリスト（カンマまたはスペース区切り）",
        type: OptionType.STRING,
        default: "1234567890123445,1234567890123445",
        multiline: true
    },
    shouldPingListed: {
        description: "動作",
        type: OptionType.SELECT,
        options: [
            {
                label: "リストにあるユーザー / ロールにはメンションしません",
                value: false,
            },
            {
                label: "リストにあるユーザー / ロールにのみメンションします",
                value: true,
                default: true,
            },
        ],
    },
    inverseShiftReply: {
        description: "Discord の Shift 返信の動作を反転します（有効にすると Shift 返信でユーザーにメンションします）",
        type: OptionType.BOOLEAN,
        default: false,
    }
});

export default definePlugin({
    name: "NoReplyMention",
    description: "返信時の通知（ping）をデフォルトで無効にします",
    tags: ["Chat", "Notifications"],
    authors: [Devs.DustyAngel47, Devs.rae, Devs.pylix, Devs.outfoxxed],
    settings,

    shouldMention(message: Message, isHoldingShift: boolean) {
        let isListed = settings.store.userList.includes(message.author.id);

        const channel = ChannelStore.getChannel(message.channel_id);
        if (channel?.guild_id && !isListed) {
            const roles = GuildMemberStore.getMember(channel.guild_id, message.author.id)?.roles;
            isListed = !!roles && roles.some(role => settings.store.roleList.includes(role));
        }

        const isExempt = settings.store.shouldPingListed ? isListed : !isListed;
        return settings.store.inverseShiftReply ? isHoldingShift !== isExempt : !isHoldingShift && isExempt;
    },

    patches: [
        {
            find: ",\"Message\")}function",
            replacement: {
                match: /:(\i),shouldMention:!(\i)\.shiftKey/,
                replace: ":$1,shouldMention:$self.shouldMention($1,$2.shiftKey)"
            }
        }
    ],
});
