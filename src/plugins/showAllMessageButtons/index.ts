/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { MessageActions, PinActions } from "@webpack/common";

const settings = definePluginSettings({
    noShiftDelete: {
        type: OptionType.BOOLEAN,
        description: "メッセージを削除するときに Shift を押し続ける必要をなくす。",
        default: true,
    },
    noShiftPin: {
        type: OptionType.BOOLEAN,
        description: "メッセージをピン留めするときに Shift を押し続ける必要をなくす。",
        default: true,
    },
    noQuickReacts: {
        default: true,
        restartNeeded: true,
        type: OptionType.BOOLEAN,
        description: "クイックリアクトを非表示にする。デフォルトでは、フルメニューを表示するとクイックリアクトボタンは非表示になります。",
    },
});

export default definePlugin({
    name: "ShowAllMessageButtons",
    description: "Shiftキーを押しているかどうかに関係なく、すべてのメッセージボタンを常に表示します。",
    tags: ["Chat", "Utility"],
    authors: [Devs.Nuckyz],
    settings,

    patches: [
        {
            find: "#{intl::MESSAGE_UTILITIES_A11Y_LABEL}),children",
            replacement: [
                {
                    match: /isExpanded:\i&&(.+?),/,
                    replace: "isExpanded:$1,"
                },
                {
                    predicate: () => settings.store.noShiftDelete,
                    match: /onClick:.{10,20}(?=,dangerous:!0)/,
                    replace: "onClick:() => $self.deleteMessage(arguments[0].message)",
                },
                {
                    predicate: () => settings.store.noShiftPin,
                    match: /onClick:.{10,30}(?=\},"pin")/,
                    replace: "onClick:() => $self.toggleMessagePin(arguments[0]),"
                },
                {
                    predicate: () => !settings.store.noQuickReacts,
                    match: /\i(\?null:\(0,\i\.jsxs\).{0,100}message:\i\}\)),\(0,\i\.jsxs?\)\(\i\.\i,\{\}\)/,
                    replace: "false$1"
                },
            ]
        },
    ],

    deleteMessage({ channel_id, id }) {
        MessageActions.deleteMessage(channel_id, id);
    },
    toggleMessagePin({ channel, message }) {
        if (message.pinned) return PinActions.unpinMessage(channel, message.id);

        PinActions.pinMessage(channel, message.id);
    },
});
