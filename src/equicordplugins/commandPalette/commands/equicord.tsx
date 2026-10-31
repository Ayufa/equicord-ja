/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import type { PaletteCommand } from "../api/types";
import { BoltIcon, GearIcon, PaintIcon, RestartIcon } from "../ui/icons";
import { openSettingsPage } from "./openSettings";

const SECTION = "Equicord";

export const equicordCommands: PaletteCommand[] = [
    {
        id: "equicord.settings",
        title: "Equicord 設定を開く",
        section: SECTION,
        keywords: ["equicord", "vencord", "settings"],
        icon: GearIcon,
        actions: [{
            id: "run",
            label: "Equicord 設定を開く",
            run: () => void openSettingsPage("equicord_main")
        }]
    },
    {
        id: "equicord.quickCss",
        title: "QuickCSS を開く",
        section: SECTION,
        keywords: ["css", "quickcss", "editor", "style"],
        icon: PaintIcon,
        actions: [{
            id: "run",
            label: "QuickCSS を開く",
            run: () => VencordNative.quickCss.openEditor()
        }]
    },
    {
        id: "equicord.updater",
        title: "アップデーターを開く",
        section: SECTION,
        keywords: ["update", "updater", "version"],
        icon: BoltIcon,
        predicate: () => !IS_UPDATER_DISABLED,
        actions: [{
            id: "run",
            label: "アップデーターを開く",
            run: () => void openSettingsPage("equicord_updater")
        }]
    },
    {
        id: "equicord.changelog",
        title: "変更履歴を開く",
        section: SECTION,
        keywords: ["changelog", "news", "whats new"],
        icon: BoltIcon,
        actions: [{
            id: "run",
            label: "変更履歴を開く",
            run: () => void openSettingsPage("equicord_changelog")
        }]
    },
    {
        id: "equicord.restart",
        title: "Discord を再起動",
        section: SECTION,
        keywords: ["restart", "reload", "refresh"],
        icon: RestartIcon,
        actions: [{
            id: "run",
            label: "Discord を再起動",
            run: () => window.location.reload()
        }]
    }
];
