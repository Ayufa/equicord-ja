/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { getUserSettingLazy } from "@api/UserSettings";
import { Heading } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { Devs, EquicordDevs } from "@utils/constants";
import definePlugin from "@utils/types";
import { VoiceState } from "@vencord/discord-types";
import { findByCodeLazy } from "@webpack";
import { ApplicationStreamingSettingsStore, ChannelStore, MediaEngineStore, PermissionsBits, PermissionStore, SelectedChannelStore, showToast, UserStore, VoiceActions, WindowStore } from "@webpack/common";

import { getCurrentMedia, settings } from "./utils";

let hasStreamed, isStreaming, streamKey;
const startStream = findByCodeLazy('type:"STREAM_START"');
const stopStream = findByCodeLazy('type:"STREAM_STOP"');
const StreamPreviewSettings = getUserSettingLazy("voiceAndVideo", "disableStreamPreviews")!;

async function autoStartStream(instant = true) {
    if (!instant && !WindowStore.isFocused() && settings.store.focusDiscord) return;
    const selected = SelectedChannelStore.getVoiceChannelId();
    if (!selected) return;

    const channel = ChannelStore.getChannel(selected);
    if (!channel) return;

    const isGuildChannel = !channel.isDM() && !channel.isGroupDM();

    if (channel.type === 13 || isGuildChannel && !PermissionStore.can(PermissionsBits.STREAM, channel)) return;

    if (settings.store.autoDeafen && !MediaEngineStore.isSelfDeaf() && instant) {
        VoiceActions.toggleSelfDeaf();
    } else if (settings.store.autoMute && !MediaEngineStore.isSelfMute() && instant) {
        VoiceActions.toggleSelfMute();
    }

    const streamMedia = await getCurrentMedia();
    const preview = StreamPreviewSettings.getSetting();
    const { soundshareEnabled } = ApplicationStreamingSettingsStore.getState();
    let sourceId = streamMedia.id;
    if (streamMedia.type === "video_device") sourceId = `camera:${streamMedia.id}`;

    if (isStreaming && streamKey.endsWith(UserStore.getCurrentUser().id)) {
        stopStream(streamKey);
    } else {
        startStream(channel.guild_id ?? null, selected, {
            "pid": null,
            "sourceId": sourceId,
            "sourceName": streamMedia.name,
            "audioSourceId": streamMedia.name,
            "sound": soundshareEnabled,
            "previewDisabled": preview
        });
    }
}

export default definePlugin({
    name: "InstantScreenshare",
    description: "ボイスチャンネルに参加した瞬間に画面共有を開始します。デスクトップソース、ウィンドウ、ビデオ入力デバイス（カメラ、キャプチャーボード）に対応しています",
    tags: ["Media", "Voice"],
    authors: [Devs.HAHALOSAH, Devs.thororen, EquicordDevs.mart],
    dependencies: ["EquicordToolbox"],
    searchTerms: ["ScreenshareKeybind"],
    autoStartStream,
    settings,

    settingsAboutComponent: () => (
        <>
            <Heading tag="h3" className={Margins.bottom8}>Linux向け</Heading>
            <Paragraph>
                Waylandでは画面共有の選択画面が表示されるだけです
                <br />
                X11では動作する場合としない場合があります :shrug:
            </Paragraph>
            <br />
            <Heading tag="h3" className={Margins.bottom8}>ビデオデバイス</Heading>
            <Paragraph>
                設定で有効にすると、カメラやキャプチャーボード（Elgato HD60Xなど）に対応します
            </Paragraph>
            <br />
            <Heading tag="h3" className={Margins.bottom8}>サウンドとプレビューの設定について</Heading>
            <Paragraph>
                ストリームのプレビューとサウンドを有効にするかどうかは、Discordで設定されている設定に基づいて判断します
            </Paragraph>
        </>
    ),

    patches: [
        {
            find: "DISCONNECT_FROM_VOICE_CHANNEL]",
            predicate: () => settings.store.keybindScreenshare,
            replacement: {
                match: /\[\i\.\i\.DISCONNECT_FROM_VOICE_CHANNEL/,
                replace: '["INSTANT_SCREEN_SHARE"]:{onTrigger(){$self.autoStartStream(false)},keyEvents:{keyUp:!1,keyDown:!0}},$&'
            },
        },
        {
            find: '"push-to-talk-priority"',
            predicate: () => settings.store.keybindScreenshare,
            replacement: {
                match: /=\[(\{id:.{0,25}value:\i\.\i\.UNASSIGNED)/,
                replace: '=[{id:"instant-screen-share",value:"INSTANT_SCREEN_SHARE",label:"Instant Screenshare"},$1'
            }
        }
    ],

    flux: {
        async VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: VoiceState[]; }) {
            if (!settings.store.toolboxManagement || !settings.store.instantScreenshare) return;
            const myId = UserStore.getCurrentUser().id;
            for (const state of voiceStates) {
                const { userId, channelId } = state;
                if (userId !== myId) continue;

                if (channelId && !hasStreamed) {
                    hasStreamed = true;
                    await autoStartStream();
                }

                if (!channelId) {
                    hasStreamed = false;
                }

                break;
            }
        },
        STREAM_CREATE: d => {
            streamKey = d;
            isStreaming = true;
        },
        STREAM_DELETE: d => {
            streamKey = d;
            isStreaming = false;
        }
    },

    toolboxActions: {
        "Instant Screenshare"() {
            settings.store.toolboxManagement = !settings.store.toolboxManagement;
            showToast({ text: `Instant Screenshareを${settings.store.toolboxManagement ? "有効化" : "無効化"}しました`, variant: "success" });
        }
    }
});
