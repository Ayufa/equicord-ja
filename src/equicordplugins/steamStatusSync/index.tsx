/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";

enum SteamStatus {
    Online = "online",
    Away = "away",
    Invisible = "invisible",
    Offline = "offline",
    None = "none"
}

interface SettingsProto {
    settings: {
        proto: {
            status?: {
                status: {
                    value: String;
                },
                showCurrentGame: {
                    value: Boolean;
                },
            };
        };
    };
}

export const settings = definePluginSettings({
    onlineStatus: {
        type: OptionType.SELECT,
        description: "オンラインのときのSteamステータス",
        options: [
            { label: "オンライン", value: SteamStatus.Online, default: true },
            { label: "退席中", value: SteamStatus.Away },
            { label: "オンライン状態を隠す", value: SteamStatus.Invisible },
            { label: "オフライン（Steamチャットを切断）", value: SteamStatus.Offline },
            { label: "無効", value: SteamStatus.None }
        ],
    },
    idleStatus: {
        type: OptionType.SELECT,
        description: "退席中のときのSteamステータス",
        options: [
            { label: "オンライン", value: SteamStatus.Online },
            { label: "退席中", value: SteamStatus.Away, default: true },
            { label: "オンライン状態を隠す", value: SteamStatus.Invisible },
            { label: "オフライン（Steamチャットを切断）", value: SteamStatus.Offline },
            { label: "無効", value: SteamStatus.None }
        ],
    },
    dndStatus: {
        type: OptionType.SELECT,
        description: "取り込み中のときのSteamステータス",
        options: [
            { label: "オンライン", value: SteamStatus.Online },
            { label: "退席中", value: SteamStatus.Away },
            { label: "オンライン状態を隠す", value: SteamStatus.Invisible },
            { label: "オフライン（Steamチャットを切断）", value: SteamStatus.Offline },
            { label: "無効", value: SteamStatus.None, default: true }
        ],
    },
    invisibleStatus: {
        type: OptionType.SELECT,
        description: "オンライン状態を隠しているときのSteamステータス",
        options: [
            { label: "オンライン", value: SteamStatus.Online },
            { label: "退席中", value: SteamStatus.Away },
            { label: "オンライン状態を隠す", value: SteamStatus.Invisible, default: true },
            { label: "オフライン（Steamチャットを切断）", value: SteamStatus.Offline },
            { label: "無効", value: SteamStatus.None }
        ],
    },
    goInvisibleIfActivityIsHidden: {
        type: OptionType.BOOLEAN,
        description: "Discordでゲームアクティビティを隠している場合は常にオンライン状態を隠す"
    }
});

export default definePlugin({
    name: "SteamStatusSync",
    description: "ステータスをSteamに同期します！（オンライン、退席中、表示しない、オフライン）",
    tags: ["Activity", "Appearance", "Customisation"],
    authors: [EquicordDevs.niko],

    settings,

    flux: {
        USER_SETTINGS_PROTO_UPDATE(settingsUpdate: SettingsProto) {
            const protoStatus = settingsUpdate.settings.proto.status;

            if (protoStatus !== undefined) {
                const steamStatus: SteamStatus = settings.store[`${protoStatus.status.value}Status`];

                if (settings.store.goInvisibleIfActivityIsHidden && !protoStatus.showCurrentGame.value) {
                    open(`steam://friends/status/${SteamStatus.Invisible}`);

                    return;
                }
                if (steamStatus === SteamStatus.None) { return; }

                // Open steam protocol URI for status change
                open(`steam://friends/status/${steamStatus}`);
            }
        }
    }
});
