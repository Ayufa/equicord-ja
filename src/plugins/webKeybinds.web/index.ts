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
import { Devs, IS_MAC } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { SettingsRouter } from "@webpack/common";

const settings = definePluginSettings({
    showNavigationButtons: {
        type: OptionType.BOOLEAN,
        description: "タイトルバーに「戻る／進む」ナビゲーションボタンを表示する。",
        default: true,
        restartNeeded: true
    },
    overrideCommonKeybinds: {
        type: OptionType.BOOLEAN,
        description: "Discord が一般的なタブ操作のキーバインド（ctrl+t、ctrl+shift+t、ctrl+tab、ctrl+shift+tab、ctrl+n）を上書きできるようにする。ウェブサイトのキーバインドをネイティブより優先できる一部のブラウザでのみ動作します。",
        default: IS_VESKTOP || IS_EQUIBOP,
        restartNeeded: true,
    }
});

export default definePlugin({
    name: "WebKeybinds",
    description: "Web版Discordで欠けているキーバインドを再度追加します。ブラウザ内では完全には動作せず、Vesktop/Equibop/Legcordでのみ完全に動作します",
    tags: ["Shortcuts"],
    authors: [Devs.Ven, Devs.Davri],
    enabledByDefault: true,

    settings,

    patches: [
        {
            // Replace the list of blocked keybinds with our own.
            find: '"Duplicate keyboard shortcuts defined:"',
            replacement: {
                match: /\[\.\.\.\i\.\i\.binds,/,
                replace: "$self.getBlockedKeybinds()||$&"
            }
        },
        {
            find: '?"BACK_FORWARD_NAVIGATION":',
            replacement: {
                match: /\({showBackForwardButtons:(\i)/,
                replace: "({showBackForwardButtons:($1=true)"
            },
            predicate: () => settings.store.showNavigationButtons,
        }
    ],

    start() {
        document.addEventListener("keydown", this.onKey);
    },

    stop() {
        document.removeEventListener("keydown", this.onKey);
    },

    onKey(e: KeyboardEvent) {
        const hasCtrl = e.ctrlKey || (e.metaKey && IS_MAC);

        // Cmd+, is a native shortcut on macos (Vesktop/src/main/mainWindow.ts)
        const hasNativeShortcut = IS_VESKTOP && IS_MAC;

        if (hasCtrl && e.key === "," && !hasNativeShortcut) {
            e.preventDefault();
            SettingsRouter.openUserSettings();
        }
    },

    getBlockedKeybinds() {
        // Zoom shortcuts, allowing these would cause unpredictable zooming behavior on macos
        const blocked: string[] = ["mod+plus", "mod+minus", "mod+0"];

        if (!settings.store.overrideCommonKeybinds)
            blocked.push("ctrl+shift+tab", "ctrl+tab", "mod+n", "mod+t", "mod+shift+t");

        return blocked.map(k => k.replace("mod", IS_MAC ? "cmd" : "ctrl"));
    }
});
