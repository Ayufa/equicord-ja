/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { isPluginEnabled, pluginRequiresRestart, plugins, startDependenciesRecursive, startPlugin, stopPlugin } from "@api/PluginManager";
import { Settings } from "@api/Settings";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import type { Plugin } from "@utils/types";
import { showToast } from "@webpack/common";

import type { PaletteCommand, PaletteListItem } from "../api/types";
import { GearIcon, PlugIcon } from "../ui/icons";

function togglePlugin(plugin: Plugin) {
    const wasEnabled = isPluginEnabled(plugin.name);
    const pluginSettings = Settings.plugins[plugin.name];

    if (!wasEnabled) {
        const { restartNeeded, failures } = startDependenciesRecursive(plugin);
        if (failures.length) {
            showToast({ text: `依存プラグインの起動に失敗しました: ${failures.join(", ")}`, variant: "critical" });
            return;
        }
        if (restartNeeded) {
            pluginSettings.enabled = true;
            showToast({ text: `${plugin.name} enabled. Restart to apply.` });
            return;
        }
    }

    if (pluginRequiresRestart(plugin)) {
        pluginSettings.enabled = !wasEnabled;
        showToast({ text: `${plugin.name} を${wasEnabled ? "無効化" : "有効化"}しました。再起動すると適用されます。` });
        return;
    }

    if (wasEnabled && !plugin.started) {
        pluginSettings.enabled = false;
        showToast({ text: `${plugin.name} を無効化しました。`, variant: "success" });
        return;
    }

    const result = wasEnabled ? stopPlugin(plugin) : startPlugin(plugin);
    if (!result) {
        pluginSettings.enabled = false;
        showToast({ text: `${plugin.name} の${wasEnabled ? "停止" : "起動"}中にエラーが発生しました。`, variant: "critical" });
        return;
    }

    pluginSettings.enabled = !wasEnabled;
    showToast({ text: `${plugin.name} を${wasEnabled ? "無効化" : "有効化"}しました。`, variant: "success" });
}

function pluginItems(): PaletteListItem[] {
    return Object.values(plugins)
        .filter(plugin => !plugin.required && !plugin.hidden)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(plugin => {
            const enabled = isPluginEnabled(plugin.name);
            return {
                id: plugin.name,
                label: plugin.name,
                sublabel: enabled ? "有効" : "無効",
                icon: PlugIcon,
                actions: [
                    {
                        id: "toggle",
                        label: enabled ? "プラグインを無効化" : "プラグインを有効化",
                        keepOpen: true,
                        run: () => togglePlugin(plugin)
                    },
                    {
                        id: "settings",
                        label: "プラグイン設定を開く",
                        icon: GearIcon,
                        run: () => openPluginModal(plugin)
                    }
                ]
            };
        });
}

export const pluginCommands: PaletteCommand[] = [
    {
        id: "plugins.manage",
        title: "プラグインを管理",
        section: "プラグイン",
        keywords: ["plugins", "enable", "disable", "toggle"],
        icon: PlugIcon,
        page: () => ({
            title: "プラグインを管理",
            icon: PlugIcon,
            spec: { type: "list", placeholder: "プラグインを検索...", items: pluginItems }
        })
    }
];
