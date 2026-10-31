/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Heading } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { IS_WINDOWS } from "@utils/constants";
import { Logger } from "@utils/Logger";
import { OptionType } from "@utils/types";
import { findByCodeLazy } from "@webpack";
import { MediaEngineStore, SearchableSelect, useEffect, useState } from "@webpack/common";

interface PickerProps {
    streamMediaSelection: any[];
    streamMedia: any[];
}

const getDesktopSources = findByCodeLazy("desktop sources");
const log = new Logger("InstantScreenShare");

export const settings = definePluginSettings({
    streamMedia: {
        type: OptionType.COMPONENT,
        component: SettingSection,
    },
    includeVideoDevices: {
        type: OptionType.BOOLEAN,
        description: "ビデオ入力デバイス（カメラ、キャプチャカード）をソースリストに含めます",
        default: false,
    },
    autoMute: {
        type: OptionType.BOOLEAN,
        description: "ボイスチャンネル参加時に自動でマイクをミュートします",
        default: false,
    },
    autoDeafen: {
        type: OptionType.BOOLEAN,
        description: "ボイスチャンネル参加時に自動でスピーカーミュートにします（マイクもミュートされます）",
        default: false,
    },
    instantScreenshare: {
        type: OptionType.BOOLEAN,
        description: "自動画面共有機能を有効化します",
        default: true,
    },
    keybindScreenshare: {
        type: OptionType.BOOLEAN,
        description: "Discordのキーバインド設定でのキーバインド画面共有",
        restartNeeded: true,
        default: false,
    },
    focusDiscord: {
        type: OptionType.BOOLEAN,
        description: "Discordにフォーカスがあるときだけキーバインドで画面共有を開始します",
        default: true,
    },
    toolboxManagement: {
        type: OptionType.BOOLEAN,
        description: "Instant Screenshareを有効化／無効化します",
        default: true,
        hidden: true,
    },
});

export async function getCurrentMedia() {
    const media = MediaEngineStore.getMediaEngine();
    const sources = await getDesktopSources(media, IS_WINDOWS, ["screen", "window"], null) ?? [];

    if (settings.store.includeVideoDevices) {
        try {
            const videoDevices = Object.values(MediaEngineStore.getVideoDevices() || {});
            const videoSources = videoDevices.map((device: any) => ({
                id: device.id,
                name: device.name,
                type: "video_device"
            }));
            sources.push(...videoSources);
        } catch (e) {
            new log.warn("Failed to get video devices:", e);
        }
    }

    const streamMedia = sources.find(screen => screen.id === settings.store.streamMedia);
    if (streamMedia) return streamMedia;

    log.error(`Stream Media "${settings.store.streamMedia}" not found. Resetting to default.`);

    settings.store.streamMedia = sources[0];
    return sources[0];
}

function StreamSimplePicker({ streamMediaSelection, streamMedia }: PickerProps) {
    const options = streamMediaSelection.map(screen => ({
        label: screen.name,
        value: screen.id,
        default: streamMediaSelection[0],
    }));

    return (
        <SearchableSelect
            placeholder="ストリーミングするメディアソースを選択 "
            maxVisibleItems={5}
            options={options}
            value={options.find(o => o.value === streamMedia)?.value}
            onChange={v => settings.store.streamMedia = v}
            closeOnSelect
        />
    );
}

function ScreenSetting() {
    const { streamMedia, includeVideoDevices } = settings.use(["streamMedia", "includeVideoDevices"]);
    const media = MediaEngineStore.getMediaEngine();
    const [streamMediaSelection, setStreamMediaSelection] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        async function fetchMedia() {
            setLoading(true);
            const sources = await getDesktopSources(media, IS_WINDOWS, ["screen", "window"], null) ?? [];

            if (includeVideoDevices) {
                try {
                    const videoDevices = Object.values(MediaEngineStore.getVideoDevices() || {});
                    const videoSources = videoDevices.map((device: any) => ({
                        id: device.id,
                        name: device.name,
                        type: "video_device"
                    }));
                    sources.push(...videoSources);
                } catch (e) {
                    log.warn("Failed to get video devices:", e);
                }
            }

            if (active) {
                setStreamMediaSelection(sources);
                setLoading(false);
            }
        }
        fetchMedia();
        return () => { active = false; };
    }, [includeVideoDevices]);

    if (loading) return <Paragraph>メディアソースを読み込み中...</Paragraph>;
    if (!streamMediaSelection.length) return <Paragraph>メディアが見つかりません。</Paragraph>;

    return <StreamSimplePicker streamMediaSelection={streamMediaSelection} streamMedia={streamMedia} />;
}

function SettingSection() {
    return (
        <section>
            <Heading>ストリーミングするメディアソース</Heading>
            <Paragraph className={Margins.bottom20}>見つからない場合はメイン画面にリセットされます</Paragraph>
            <ScreenSetting />
        </section>
    );
}
