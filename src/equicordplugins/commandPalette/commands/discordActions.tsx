/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getUserSettingLazy } from "@api/UserSettings";
import type { Theme } from "@vencord/discord-types";
import { findByCodeLazy } from "@webpack";
import { showToast, ThemeStore, VoiceActions } from "@webpack/common";

import type { PaletteCommand } from "../api/types";
import { CircleIcon, HeadphonesIcon, MicIcon, MoonIcon } from "../ui/icons";

const SECTION = "Discord";

const StatusSetting = getUserSettingLazy<string>("status", "status");
const updateDiscordTheme = findByCodeLazy('type:"UNSYNCED_USER_SETTINGS_UPDATE', '"system"===');

const THEMES = [
    { value: "light", label: "ライト" },
    { value: "darker", label: "アッシュ" },
    { value: "dark", label: "ダーク" },
    { value: "midnight", label: "オニキス" }
] as const satisfies ReadonlyArray<{ value: Theme; label: string; }>;

const STATUSES = [
    { value: "online", label: "オンライン" },
    { value: "idle", label: "退席中" },
    { value: "dnd", label: "取り込み中" },
    { value: "invisible", label: "オンライン状態を隠す" }
];

export const discordCommands: PaletteCommand[] = [
    {
        id: "discord.toggleMute",
        title: "ミュートを切り替え",
        section: SECTION,
        keywords: ["mute", "microphone", "voice"],
        icon: MicIcon,
        actions: [{
            id: "run",
            label: "ミュートを切り替え",
            run: () => VoiceActions.toggleSelfMute()
        }]
    },
    {
        id: "discord.toggleDeafen",
        title: "スピーカーミュートを切り替え",
        section: SECTION,
        keywords: ["deafen", "audio", "voice"],
        icon: HeadphonesIcon,
        actions: [{
            id: "run",
            label: "スピーカーミュートを切り替え",
            run: () => VoiceActions.toggleSelfDeaf()
        }]
    },
    {
        id: "discord.setStatus",
        title: "ステータスを設定",
        section: SECTION,
        keywords: ["status", "online", "idle", "dnd", "invisible", "presence"],
        icon: CircleIcon,
        page: () => ({
            title: "ステータスを設定",
            icon: CircleIcon,
            spec: {
                type: "list",
                placeholder: "ステータスを検索...",
                items: () => STATUSES.map(status => ({
                    id: status.value,
                    label: status.label,
                    sublabel: StatusSetting?.getSetting() === status.value ? "現在の設定" : undefined,
                    icon: CircleIcon,
                    actions: [{
                        id: "set",
                        label: `Set ${status.label}`,
                        run() {
                            StatusSetting?.updateSetting(status.value);
                            showToast({ text: `ステータスを ${status.label} に設定しました。`, variant: "success" });
                        }
                    }]
                }))
            }
        })
    },
    {
        id: "discord.toggleTheme",
        title: "テーマを切り替え",
        section: SECTION,
        keywords: ["theme", "light", "ash", "dark", "onyx", "appearance"],
        icon: MoonIcon,
        actions: [{
            id: "run",
            label: "テーマを切り替え",
            run() {
                const currentIdx = THEMES.findIndex(theme => theme.value === ThemeStore.theme);
                const next = THEMES[(currentIdx + 1) % THEMES.length];
                updateDiscordTheme({ theme: next.value });
                showToast({ text: `テーマを ${next.label} に設定しました。`, variant: "success" });
            }
        }]
    }
];
