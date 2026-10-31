/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import { Button } from "@components/Button";
import { HeadingSecondary } from "@components/Heading";
import { Notice } from "@components/Notice";
import { Paragraph } from "@components/Paragraph";
import { SettingsSection } from "@components/settings/tabs/plugins/components/Common";
import { useCspPermission } from "@utils/csp";
import { makeRange, OptionType } from "@utils/types";
import { MaskedLink, Select, showToast, TextInput } from "@webpack/common";

import hoverOnlyStyle from "./hoverOnly.css?managed";
import { clearLyricsCache, removeTranslations } from "./spotify/lyrics/api";
import languages from "./spotify/lyrics/providers/translator/languages";
import { Provider } from "./spotify/lyrics/providers/types";

const sliderOptions = {
    markers: makeRange(-2500, 2500, 250),
    stickToMarkers: true,
};

export function toggleHoverControls(value: boolean) {
    (value ? enableStyle : disableStyle)(hoverOnlyStyle);
}

function InstallInstructions() {
    return (
        <section>
            <HeadingSecondary>How to install</HeadingSecondary>
            <Paragraph>
                Install <MaskedLink href="https://github.com/Inrixia/TidaLuna#installation">TidaLuna</MaskedLink> from here, then go to TidalLuna settings &rarr; Plugin stores &rarr; Install <code>@vmohammad/api</code>
            </Paragraph>
        </section>
    );
}

function LyricsProviderSettings() {
    const { spotifyLyricsApiUrl } = settings.use(["spotifyLyricsApiUrl"]);
    const [isLyricsServerAllowed, allowLyricsServer] = useCspPermission(spotifyLyricsApiUrl.trim(), ["connect-src"], "MusicControls");

    return (
        <>
            <SettingsSection id="lyrics-provider" name="Lyrics Provider" description="Where lyrics are fetched from.">
                <Select
                    options={[
                        { value: Provider.Lrclib, label: "LRCLIB", default: true },
                        { value: Provider.Spotify, label: "Spotify (Musixmatch)" },
                    ]}
                    isSelected={v => v === settings.store.lyricsProvider}
                    select={v => { settings.store.lyricsProvider = v as Provider; }}
                    serialize={v => v}
                    placeholder="Select a lyrics provider"
                />
            </SettingsSection>

            {settings.store.lyricsProvider === Provider.Spotify && (
                <SettingsSection
                    id="spotify-lyrics-provider"
                    name="Spotify Lyrics API Base URL"
                    description="Custom instance base URL (for example: http://localhost:8080)."
                >
                    <TextInput
                        type="text"
                        value={settings.store.spotifyLyricsApiUrl}
                        onChange={v => {
                            settings.store.spotifyLyricsApiUrl = v;
                            void clearLyricsCache();
                            showToast({ text: "Lyrics cache purged", variant: "success" });
                        }}
                        placeholder="https://spotify-lyrics-api-pi.vercel.app"
                        maxLength={null}
                    />
                </SettingsSection>
            )}

            {!isLyricsServerAllowed && settings.store.lyricsProvider === Provider.Spotify && (
                <Notice variant="warning" action={<Button size="small" variant="secondary" onClick={allowLyricsServer}>Allow Host</Button>}>
                    Connections to {URL.parse(spotifyLyricsApiUrl.trim())?.host} are blocked. Allow this host if you trust it, then restart Discord.
                </Notice>
            )}
        </>
    );
}

export const settings = definePluginSettings({
    hoverControls: {
        description: "ホバー時にコントロールを表示",
        type: OptionType.BOOLEAN,
        default: false,
        onChange: v => toggleHoverControls(v)
    },
    showMusicNoteOnNoLyrics: {
        description: "歌詞が見つからないときに音符アイコンを表示",
        type: OptionType.BOOLEAN,
        default: true,
    },
    lyricsPosition: {
        description: "歌詞の位置",
        type: OptionType.SELECT,
        options: [
            { value: "above", label: "プレイヤーの上" },
            { value: "below", label: "プレイヤーの下", default: true },
        ],
    },
    lyricsProvider: {
        description: "歌詞の取得元",
        type: OptionType.SELECT,
        options: [
            { value: Provider.Lrclib, label: "LRCLIB", default: true },
            { value: Provider.Spotify, label: "Spotify (Musixmatch)" },
        ],
        hidden: true,
    },
    spotifyLyricsApiUrl: {
        type: OptionType.STRING,
        description: "Spotify 歌詞 API のベース URL。",
        hidden: true,
        default: "https://spotify-lyrics-api-pi.vercel.app",
        onChange: async () => {
            await clearLyricsCache();
            showToast({ text: "Lyrics cache purged", variant: "success" });
        }
    },
    lyricsProviderSettings: {
        type: OptionType.COMPONENT,
        component: LyricsProviderSettings,
    },
    translateTo: {
        description: "歌詞の翻訳先 - 変更すると既存の翻訳がクリアされます",
        type: OptionType.SELECT,
        options: languages,
        onChange: async () => {
            await removeTranslations();
            showToast({ text: "Translations cleared", variant: "success" });
        }
    },
    lyricsConversion: {
        description: "歌詞を自動的に翻訳またはローマ字化",
        type: OptionType.SELECT,
        options: [
            { value: Provider.None, label: "なし", default: true },
            { value: Provider.Translated, label: "翻訳" },
            { value: Provider.Romanized, label: "ローマ字化" },
        ]
    },
    fallbackProvider: {
        description: "歌詞プロバイダーが失敗したら、他のプロバイダーを試す",
        type: OptionType.BOOLEAN,
        default: true,
    },
    showFailedToasts: {
        description: "歌詞の取得に失敗したときにトーストを隠す",
        type: OptionType.BOOLEAN,
        default: true,
    },
    lyricDelay: {
        description: "",
        type: OptionType.SLIDER,
        default: 0,
        ...sliderOptions
    },
    purgeLyricsCache: {
        description: "歌詞キャッシュを削除",
        type: OptionType.COMPONENT,
        component: () => (
            <Button
                variant="dangerPrimary"
                onClick={() => {
                    clearLyricsCache();
                    showToast({ text: "Lyrics cache purged", variant: "success" });
                }}
            >
                Purge Cache
            </Button>
        ),
    },
    spotifySectionTitle: {
        type: OptionType.COMPONENT,
        component: () => (
            <section>
                <HeadingSecondary>Spotify</HeadingSecondary>
            </section>
        )
    },
    showSpotifyControls: {
        description: "Spotify コントロールを表示",
        type: OptionType.BOOLEAN,
        default: false,
    },
    showSpotifyLyrics: {
        description: "Spotify の歌詞を表示",
        type: OptionType.BOOLEAN,
        default: false,
    },
    useSpotifyUris: {
        type: OptionType.BOOLEAN,
        description: "Spotify URL の代わりに Spotify URI を開きます。Spotify がインストールされている場合のみ動作し、プラットフォームによっては動作しないことがあります",
        default: false
    },
    previousButtonRestartsTrack: {
        type: OptionType.BOOLEAN,
        description: "再生時間が 3 秒を超えている場合に「前へ」ボタンを押すと、再生中のトラックを最初から再生し直す",
        default: true
    },

    tdalSectionTitle: {
        type: OptionType.COMPONENT,
        component: () => (
            <section>
                <HeadingSecondary>Tidal</HeadingSecondary>
            </section>
        )
    },
    installTidalWithWS: {
        type: OptionType.COMPONENT,
        component: () => <InstallInstructions />
    },
    showTidalControls: {
        description: "Tidal プレイヤーを表示",
        type: OptionType.BOOLEAN,
        default: false,
    },
    showTidalLyrics: {
        description: "Tidal コントロールを表示",
        type: OptionType.BOOLEAN,
        default: false,
    },
    websocketURL: {
        type: OptionType.STRING,
        description: "デフォルトは ws://localhost:24123",
        default: "ws://localhost:24123",
        restartNeeded: true,
    }
});
