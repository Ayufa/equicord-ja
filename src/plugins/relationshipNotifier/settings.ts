/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2023 Vendicated and contributors
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
import { OptionType } from "@utils/types";

export default definePluginSettings({
    notices: {
        type: OptionType.BOOLEAN,
        description: "削除されたときに画面上部にも通知を表示します（通知を見逃したくない場合はこちらを使ってください）。",
        default: false
    },
    offlineRemovals: {
        type: OptionType.BOOLEAN,
        description: "オフラインの間に削除されていた場合、Discord 起動時に通知します。",
        default: true
    },
    friends: {
        type: OptionType.BOOLEAN,
        description: "フレンドがあなたを削除したときに通知します",
        default: true
    },
    friendRequestCancels: {
        type: OptionType.BOOLEAN,
        description: "フレンド申請がキャンセルされたときに通知します",
        default: true
    },
    servers: {
        type: OptionType.BOOLEAN,
        description: "サーバーから削除されたときに通知します",
        default: true
    },
    groups: {
        type: OptionType.BOOLEAN,
        description: "グループチャットから削除されたときに通知します",
        default: true
    }
});
