/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 nin0
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./misc/style.css";

import { showNotification } from "@api/Notifications";
import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Notice } from "@components/Notice";
import plSettings from "@plugins/_core/settings";
import { Devs } from "@utils/constants";
import { relaunch } from "@utils/native";
import definePlugin, { OptionType, PluginNative } from "@utils/types";
import { findByPropsLazy, findComponentByCodeLazy } from "@webpack";
import { Alerts } from "@webpack/common";

import SettingsTab from "./components/SettingsTab";
import UserpluginInstallButton from "./components/UserpluginInstallButton";
import { VariableWithCallbacks } from "./VariableWithCallbacks";

// @ts-ignore
export const Native = VencordNative.pluginHelpers.UserpluginInstaller as PluginNative<typeof import("./native")>;
export const OpenSettingsModule = findByPropsLazy("openUserSettings");
const AppsIcon = findComponentByCodeLazy("2.95H20a2 2 0");

export const settings = definePluginSettings({
    allowlistedChannels: {
        type: OptionType.STRING,
        description: "「プラグインをインストール」ボタンを表示するチャンネルのカンマ区切りリスト。Vencordのユーザープラグインチャンネルでは常に表示されます"
    },
    notifyIfUpdate: {
        type: OptionType.BOOLEAN,
        description: "ユーザープラグインの更新が必要なときにVencordの通知を表示する",
        default: true
    },
    neverNotifyForPlugins: {
        type: OptionType.STRING,
        description: "これらのプラグインについては更新通知を表示しない（ユーザープラグインタブからは更新できます）",
        default: ""
    },
    setGitPath: {
        type: OptionType.COMPONENT,
        component: () => <Button onClick={() => {
            Native.openGitPathModal();
        }} variant="secondary">
            Gitのパスを設定
        </Button>
    }
});

export default definePlugin({
    name: "UserpluginInstaller",
    description: "ボタンひとつでユーザープラグインをインストールできます",
    tags: ["Developers"],
    settingsAboutComponent: () => (
        <Notice.Warning>
            Equicordはユーザープラグインを審査しておらず、インストールによって生じた結果について一切の責任を負いません。
            信頼できる開発者のユーザープラグインだけをインストールしてください。インストールは完全に自己責任です。
        </Notice.Warning>
    ),
    async checkPluginUpdates() {
        for (const p of this.plugins.value()) {
            if (await Native.isUpdateAvailableForPlugin(p.directory!)) {
                const t = this.pluginsWithUpdates.value().plugins;
                t.push(p.directory!);
                this.pluginsWithUpdates.value({
                    finished: false,
                    plugins: t
                });
            }
        }
        const t = this.pluginsWithUpdates.value().plugins;
        this.pluginsWithUpdates.value({
            finished: true,
            plugins: t
        });
    },
    section: {
        key: "vencord_userplugins",
        title: "ユーザープラグイン",
        panelTitle: "ユーザープラグイン",
        Component: SettingsTab,
        Icon: AppsIcon
    },
    async start() {
        if (!VencordNative.pluginHelpers.UserpluginInstaller) return void Alerts.show({
            title: "UserpluginInstallerが完全に読み込まれていません",
            body: "ネイティブを読み込むには再起動が必要です :)",
            confirmText: "今すぐ再起動",
            onConfirm() {
                relaunch();
            },
            cancelText: "後で"
        });

        await Native.ensurePluginsDirectory();

        plSettings.customEntries.push(this.section);

        this.pluginsWithUpdates.registerCallback((value, id) => {
            if (value.plugins.length === 0) return;
            if (settings.store.neverNotifyForPlugins.split(",").map(t => t.trim().toLowerCase()).includes(value.plugins[value.plugins.length - 1].toLowerCase()))
                return;
            this.pluginsWithUpdates.deregisterCallback(id);
            if (settings.store.notifyIfUpdate)
                showNotification({
                    title: "一部のユーザープラグインが古くなっています！",
                    body: "クリックしてユーザープラグインアップデーターを開く",
                    noPersist: true,
                    permanent: true,
                    onClick() {
                        OpenSettingsModule.openUserSettings("vencord_userplugins_panel");
                    },
                });
        });
        const pls = await Native.getUserplugins();
        // @ts-ignore :trolley:
        this.plugins.value(pls);
        await this.checkPluginUpdates();
    },
    stop() {
        // @ts-ignore
        plSettings.customEntries.splice(plSettings.customEntries.indexOf(this.section), 1);
    },
    plugins: new VariableWithCallbacks<{
        name: string;
        description: string;
        usesPreSend: boolean;
        usesNative: boolean;
        directory: string;
        remote: string;
    }[]>([]),
    pluginsWithUpdates: new VariableWithCallbacks<{
        finished: boolean;
        plugins: string[];
    }>({
        finished: false,
        plugins: []
    }),
    settings,
    authors: [Devs.nin0dev],
    renderMessageAccessory: props => {
        return <UserpluginInstallButton props={props} />;
    }
});
