/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { showNotification } from "@api/Notifications";
import { Settings } from "@api/Settings";
import { gitHashShort } from "@shared/vencordUserAgent";
import { copyToClipboard } from "@utils/clipboard";
import { relaunch, showItemInFolder } from "@utils/native";
import { checkForUpdates, getRepo } from "@utils/updater";
import { GuildStore, NavigationRouter, SettingsRouter, showToast } from "@webpack/common";

import gitRemote from "~git-remote";
import Plugins from "~plugins";

import { openMultipleChoice } from "./components/MultipleChoice";
import { openSimpleTextInput } from "./components/TextInput";

export interface ButtonAction {
    id: string;
    label: string;
    callback?: () => void;
    registrar?: string;
}

export const actions: ButtonAction[] = [
    { id: "openEquicordSettings", label: "Equicordタブを開く", callback: async () => await SettingsRouter.openUserSettings("equicord_main_panel"), registrar: "Equicord" },
    { id: "openPluginSettings", label: "プラグインタブを開く", callback: () => SettingsRouter.openUserSettings("equicord_plugins_panel"), registrar: "Equicord" },
    { id: "openThemesSettings", label: "テーマタブを開く", callback: () => SettingsRouter.openUserSettings("equicord_themes_panel"), registrar: "Equicord" },
    { id: "openUpdaterSettings", label: "アップデータータブを開く", callback: () => SettingsRouter.openUserSettings("equicord_updater_panel"), registrar: "Equicord" },
    { id: "openEquicordCloudSettings", label: "クラウドタブを開く", callback: () => SettingsRouter.openUserSettings("equicord_cloud_panel"), registrar: "Equicord" },
    { id: "openBackupSettings", label: "バックアップと復元タブを開く", callback: () => SettingsRouter.openUserSettings("equicord_backup_restore_panel"), registrar: "Equicord" },
    { id: "restartClient", label: "クライアントを再起動", callback: () => relaunch(), registrar: "Equicord" },
    { id: "openQuickCSSFile", label: "QuickCSSファイルを開く", callback: () => VencordNative.quickCss.openEditor(), registrar: "Equicord" },
    { id: "openSettingsFolder", label: "設定フォルダーを開く", callback: async () => showItemInFolder(await VencordNative.settings.getSettingsDir()), registrar: "Equicord" },
    { id: "openInGithub", label: "GitHubで開く", callback: async () => VencordNative.native.openExternal(await getRepo()), registrar: "Equicord" },

    {
        id: "openInBrowser", label: "ブラウザで開く", callback: async () => {
            const url = await openSimpleTextInput("URLを入力");
            const newUrl = url.replace(/(https?:\/\/)?([a-zA-Z0-9-]+)\.([a-zA-Z0-9-]+)/, "https://$2.$3");

            try {
                new URL(newUrl); // Throws if invalid
                VencordNative.native.openExternal(newUrl);
            } catch {
                showToast({
                    text: "無効なURL",
                    variant: "critical",
                    position: "bottom"
                });
            }
        }, registrar: "Equicord"
    },

    {
        id: "togglePlugin", label: "プラグインを切り替え", callback: async () => {
            const plugins = Object.keys(Plugins);
            const options: ButtonAction[] = [];

            for (const plugin of plugins) {
                options.push({
                    id: plugin,
                    label: plugin
                });
            }

            const choice = await openMultipleChoice(options);

            const enabled = await openMultipleChoice([
                { id: "enable", label: "有効化" },
                { id: "disable", label: "無効化" }
            ]);

            if (choice && enabled) {
                return togglePlugin(choice, enabled.id === "enable");
            }
        }, registrar: "Equicord"
    },

    {
        id: "quickFetch", label: "クイックフェッチ", callback: async () => {
            try {
                const url = await openSimpleTextInput("取得するURLを入力（GETのみ）");
                const newUrl = url.replace(/(https?:\/\/)?([a-zA-Z0-9-]+)\.([a-zA-Z0-9-]+)/, "https://$2.$3");
                const res = (await fetch(newUrl));
                const text = await res.text();
                copyToClipboard(text);

                showToast({
                    text: "レスポンスをクリップボードにコピーしました！",
                    variant: "success",
                    position: "bottom"
                });

            } catch (e) {
                showToast({
                    text: "URLの取得で問題が発生しました",
                    variant: "critical",
                    position: "bottom"
                });
            }
        }, registrar: "Equicord"
    },

    {
        id: "copyGitInfo", label: "Git情報をコピー", callback: async () => {
            copyToClipboard(`gitHash: ${gitHashShort}\ngitRemote: ${gitRemote}`);

            showToast({
                text: "Git情報をクリップボードにコピーしました！",
                variant: "success",
                position: "bottom"
            });
        }, registrar: "Equicord"
    },

    {
        id: "checkForUpdates", label: "アップデートを確認", callback: async () => {
            const isOutdated = await checkForUpdates();

            if (isOutdated) {
                setTimeout(() => showNotification({
                    title: "Equicordのアップデートが利用可能です！",
                    body: "クリックしてアップデートを表示",
                    permanent: true,
                    noPersist: true,
                    onClick() {
                        SettingsRouter.openUserSettings("equicord_updater_panel");
                    }
                }), 10_000);
            } else {
                showToast({
                    text: "利用可能なアップデートはありません",
                    position: "bottom"
                });
            }
        }, registrar: "Equicord"
    },

    {
        id: "navToServer", label: "サーバーへ移動", callback: async () => {
            const allServers = Object.values(GuildStore.getGuilds());
            const options: ButtonAction[] = [];

            for (const server of allServers) {
                options.push({
                    id: server.id,
                    label: server.name
                });
            }

            const choice = await openMultipleChoice(options);

            if (choice) {
                NavigationRouter.transitionToGuild(choice.id);
            }
        }, registrar: "Equicord"
    }
];

function togglePlugin(plugin: ButtonAction, enabled: boolean) {

    Settings.plugins[plugin.id].enabled = enabled;

    showToast({
        text: `${plugin.id} を${enabled ? "有効化" : "無効化"}しました`,
        variant: "success",
        position: "bottom"
    });
}

export function registerAction(action: ButtonAction) {
    actions.push(action);
}
