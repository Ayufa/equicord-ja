/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { SettingsPanel } from "./SettingsPanel";
import { NameFormat } from "./types";

export let onServiceChange: (() => void) | null = null;
export function setOnServiceChange(fn: (() => void) | null) { onServiceChange = fn; }

export const settings = definePluginSettings({
    enabled: {
        description: "リッチプレゼンスサービスを有効にします。",
        type: OptionType.BOOLEAN,
        default: true,
        restartNeeded: false,
        onChange: () => onServiceChange?.(),
    },
    serviceSettings: {
        type: OptionType.COMPONENT,
        description: "サービスの設定。",
        component: SettingsPanel,
    },

    // Per-service enable toggles
    abs_enabled: {
        description: "AudioBookShelf のプレゼンスを有効にします。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
        onChange: () => onServiceChange?.(),
    },
    tosu_enabled: {
        description: "osu! (tosu) のプレゼンスを有効にします。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
        onChange: () => onServiceChange?.(),
    },
    sfm_enabled: {
        description: "stats.fm のプレゼンスを有効にします。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
        onChange: () => onServiceChange?.(),
    },
    jf_enabled: {
        description: "Jellyfin のプレゼンスを有効にします。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
        onChange: () => onServiceChange?.(),
    },
    gr_enabled: {
        description: "Gensokyo Radio のプレゼンスを有効にします。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
        onChange: () => onServiceChange?.(),
    },
    nd_enabled: {
        description: "Navidrome のプレゼンスを有効にします。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
        onChange: () => onServiceChange?.(),
    },

    // AudioBookShelf
    abs_serverUrl: {
        description: "AudioBookShelf のサーバー URL。",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },
    abs_username: {
        description: "AudioBookShelf のユーザー名。",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },
    abs_password: {
        description: "AudioBookShelf のパスワード。",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },

    // stats.fm
    sfm_username: {
        description: "stats.fm のユーザー名。",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },
    sfm_shareUsername: {
        description: "stats.fm プロフィールへのリンクを表示します。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
    },
    sfm_shareSong: {
        description: "stats.fm の曲へのリンクを表示します。",
        type: OptionType.BOOLEAN,
        default: true,
        hidden: true,
    },
    sfm_hideWithSpotify: {
        description: "Spotify が動作中の場合は stats.fm のプレゼンスを隠します。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
    },
    sfm_hideWithExternalRPC: {
        description: "外部 RPC が動作中の場合は stats.fm のプレゼンスを隠します。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
    },
    sfm_statusName: {
        description: "カスタムステータステキスト。",
        type: OptionType.STRING,
        default: "Stats.fm",
        hidden: true,
    },
    sfm_nameFormat: {
        description: "名前の形式。",
        type: OptionType.SELECT,
        options: [
            { label: "カスタムステータス名を使う", value: NameFormat.StatusName, default: true },
            { label: "'artist - song' 形式を使う", value: NameFormat.ArtistFirst },
            { label: "'song - artist' 形式を使う", value: NameFormat.SongFirst },
            { label: "アーティスト名のみ使う", value: NameFormat.ArtistOnly },
            { label: "曲名のみ使う", value: NameFormat.SongOnly },
            { label: "アルバム名を使う", value: NameFormat.AlbumName },
        ],
        hidden: true,
    },
    sfm_useListeningStatus: {
        description: "再生ステータスを表示します。",
        type: OptionType.BOOLEAN,
        default: true,
        hidden: true,
    },
    sfm_missingArt: {
        description: "アートがない場合のフォールバック。",
        type: OptionType.SELECT,
        options: [
            { label: "大きな Stats.fm ロゴを使う", value: "StatsFmLogo", default: true },
            { label: "汎用プレースホルダを使う", value: "placeholder" },
        ],
        hidden: true,
    },
    sfm_showLogo: {
        description: "アルバムアートの横に Stats.fm ロゴを表示します。",
        type: OptionType.BOOLEAN,
        default: true,
        hidden: true,
    },
    sfm_alwaysHideArt: {
        description: "アルバムアートのダウンロードを無効にします。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
    },

    // Jellyfin
    jf_serverUrl: {
        description: "Jellyfin のサーバー URL。",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },
    jf_apiKey: {
        description: "Jellyfin の API キー。",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },
    jf_userId: {
        description: "Jellyfin のユーザー ID。",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },
    jf_nameDisplay: {
        description: "名前の表示形式。",
        type: OptionType.SELECT,
        options: [
            { label: "シリーズ/映画名", value: "default", default: true },
            { label: "シリーズ - エピソード/トラック/映画名", value: "full" },
            { label: "カスタム", value: "custom" },
        ],
        hidden: true,
    },
    jf_customName: {
        description: "カスタム名テンプレート。",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },
    jf_coverType: {
        description: "TV 番組のカバータイプ。",
        type: OptionType.SELECT,
        options: [
            { label: "シリーズカバー", value: "series", default: true },
            { label: "エピソードカバー", value: "episode" },
        ],
        hidden: true,
    },
    jf_episodeFormat: {
        description: "エピソード番号の形式。",
        type: OptionType.SELECT,
        options: [
            { label: "S01E01", value: "long", default: true },
            { label: "1x01", value: "short" },
            { label: "シーズン1 エピソード1", value: "fulltext" },
        ],
        hidden: true,
    },
    jf_showEpisodeName: {
        description: "シーズン/エピソード情報の後にエピソード名を表示します。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
    },
    jf_overrideType: {
        description: "リッチプレゼンスのタイプを上書きします。",
        type: OptionType.SELECT,
        options: [
            { label: "オフ", value: "off", default: true },
            { label: "再生中", value: "2" },
            { label: "プレイ中", value: "0" },
            { label: "配信中", value: "1" },
            { label: "視聴中", value: "3" },
        ],
        hidden: true,
    },
    jf_showPausedState: {
        description: "メディアが一時停止中のときもプレゼンスを表示します。",
        type: OptionType.BOOLEAN,
        default: true,
        hidden: true,
    },
    jf_privacyMode: {
        description: "メディアの詳細を隠します。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
    },

    // Gensokyo Radio
    gr_refreshInterval: {
        description: "更新間隔（秒）。",
        type: OptionType.SLIDER,
        markers: [1, 2, 2.5, 3, 5, 10, 15],
        default: 15,
        hidden: true,
    },

    // Navidrome
    nd_serverUrl: {
        description: "Navidrome のサーバー URL（例: https://navidrome.example.com）",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },

    nd_username: {
        description: "Navidrome のユーザー名",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },
    nd_password: {
        description: "Navidrome のパスワード",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },
    nd_clientId: {
        description: "オプションの Discord アプリケーションクライアント ID",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },
    nd_showSmallImage: {
        description: "アルバムアートの右下に Navidrome ロゴを表示します。",
        type: OptionType.BOOLEAN,
        default: false,
        hidden: true,
    },
    nd_showAlbum: {
        description: "プレゼンスにアルバム名を表示します。",
        type: OptionType.BOOLEAN,
        default: true,
        hidden: true,
    },
    nd_albumArtMode: {
        description: "アルバムアートの取得方法。",
        type: OptionType.SELECT,
        options: [
            { label: "なし", value: "none", default: true },
            { label: "Navidrome インスタンス（サーバー URL が Discord に公開されます。認証情報は送信されません）", value: "instance" },
            { label: "Last.fm API（トラックのメタデータを Last.fm に送信します）", value: "lastfm" },
        ],
        hidden: true,
    },
    nd_lastfmApiKey: {
        description: "オプションの Last.fm API キー",
        type: OptionType.STRING,
        default: "",
        hidden: true,
    },
    nd_refreshInterval: {
        description: "更新間隔（秒）。",
        type: OptionType.SLIDER,
        markers: [1, 2, 5, 10, 15],
        default: 10,
        hidden: true,
    },
    nd_activityType: {
        type: OptionType.SELECT,
        description: "アクティビティのタイプ",
        options: [
            { label: "再生中", value: 2, default: true },
            { label: "プレイ中（隠れた行を修正）", value: 0 },
            { label: "視聴中", value: 3 }
        ],
        hidden: true,
    },
    nd_nameString: {
        type: OptionType.STRING,
        description: "アクティビティ名の形式文字列",
        default: "Navidrome",
        hidden: true,
    },
    nd_detailsString: {
        type: OptionType.STRING,
        description: "アクティビティ詳細の形式文字列",
        default: "{song}",
        hidden: true,
    },
    nd_stateString: {
        type: OptionType.STRING,
        description: "アクティビティ状態の形式文字列",
        default: "{artist}",
        hidden: true,
    },
    nd_largeTextString: {
        type: OptionType.STRING,
        description: "アクティビティの大きなテキストの形式文字列",
        default: "{album}",
        hidden: true,
    },
    nd_statusDisplayType: {
        description: "メンバーリストにトラック/アーティスト名を表示",
        type: OptionType.SELECT,
        options: [
            {
                label: "表示しない（汎用の再生中メッセージを表示）",
                value: "off"
            },
            {
                label: "アーティスト名を表示",
                value: "artist",
                default: true
            },
            {
                label: "トラック名を表示",
                value: "track"
            }
        ],
        hidden: true,
    },
    nd_hideOnPause: {
        description: "音楽が一時停止中はリッチプレゼンスを隠す",
        type: OptionType.BOOLEAN,
        default: true,
        hidden: true,
    }
});

export type SettingsStore = typeof settings["store"];
