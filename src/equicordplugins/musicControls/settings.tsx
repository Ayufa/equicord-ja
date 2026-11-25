/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { disableStyle, enableStyle } from "@api/Styles";
import { Button } from "@components/Button";
import { Heading } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { makeRange, OptionType } from "@utils/types";
import { MaskedLink, showToast } from "@webpack/common";

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
            <Heading tag="h3" className={Margins.bottom8}>インストール方法</Heading>
            <Paragraph>
                <MaskedLink href="https://github.com/Inrixia/TidaLuna#installation">TidaLuna</MaskedLink> をこちらからインストールし、TidalLuna の設定 &rarr; Plugin stores &rarr; <code>@vmohammad/api</code> をインストールしてください
            </Paragraph>
        </section>
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
    translateTo: {
        description: "歌詞の翻訳先 - 変更すると既存の翻訳がクリアされます",
        type: OptionType.SELECT,
        options: languages,
        onChange: async () => {
            await removeTranslations();
            showToast({ text: "翻訳をクリアしました", variant: "success" });
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
                    showToast({ text: "歌詞キャッシュを消去しました", variant: "success" });
                }}
            >
                キャッシュを消去
            </Button>
        ),
    },
    spotifySectionTitle: {
        type: OptionType.COMPONENT,
        component: () => (
            <section>
                <Heading tag="h3" className={Margins.bottom8}>Spotify</Heading>
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
                <Heading tag="h3" className={Margins.bottom8}>Tidal</Heading>
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
