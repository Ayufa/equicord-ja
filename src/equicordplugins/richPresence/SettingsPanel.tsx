/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { Notice } from "@components/Notice";
import { SettingsSection } from "@components/settings/tabs/plugins/components/Common";
import { Switch } from "@components/Switch";
import { useCspPermission } from "@utils/csp";
import { Margins } from "@utils/margins";
import { classes } from "@utils/misc";
import { Select, Slider, TabBar, TextInput, useState } from "@webpack/common";

import { settings, SettingsStore } from "./settings";
import { NameFormat, ServiceTab } from "./types";

type SettingsKey = keyof SettingsStore;

function SwitchSetting({ name, description, settingsKey }: { name: string; description: string; settingsKey: SettingsKey; }) {
    const [value, setValue] = useState(settings.store[settingsKey] ?? false);
    return (
        <SettingsSection tag="label" inlineSetting id={name} name={name} description={description}>
            <Switch
                checked={Boolean(value)}
                onChange={v => { setValue(v); (settings.store[settingsKey] as boolean) = v; }}
            />
        </SettingsSection>
    );
}

function TextSetting({ name, description, settingsKey, placeholder }: { name: string; description: string; settingsKey: SettingsKey; placeholder?: string; }) {
    const [value, setValue] = useState(settings.store[settingsKey] ?? "");
    return (
        <SettingsSection id={name} name={name} description={description}>
            <TextInput
                type="text"
                value={String(value)}
                onChange={v => { setValue(v); (settings.store[settingsKey] as string) = v; }}
                placeholder={placeholder ?? "値を入力"}
            />
        </SettingsSection>
    );
}

function AllowServerSetting({ settingsKey }: { settingsKey: SettingsKey; }) {
    const url = String(settings.use([settingsKey])[settingsKey] ?? "").trim();
    const fullUrl = url && (/^https?:\/\//.test(url) ? url : `https://${url}`);
    const [isAllowed, allow] = useCspPermission(fullUrl, ["connect-src"], "RichPresence");

    if (isAllowed) return null;

    return (
        <Notice variant="warning" action={<Button size="small" variant="secondary" onClick={allow}>ホストを許可</Button>}>
            {URL.parse(fullUrl)?.host} への接続がブロックされています。信頼できる場合はこのホストを許可し、Discord を再起動してください。
        </Notice>
    );
}

function SelectSetting({ name, description, settingsKey, options }: { name: string; description: string; settingsKey: SettingsKey; options: { label: string; value: string | number; }[]; }) {
    const [value, setValue] = useState(settings.store[settingsKey] ?? options[0]?.value);
    return (
        <SettingsSection id={name} name={name} description={description}>
            <Select
                options={options}
                isSelected={v => v === value}
                select={v => { setValue(v); (settings.store[settingsKey] as string) = v; }}
                serialize={String}
                closeOnSelect
                maxVisibleItems={5}
            />
        </SettingsSection>
    );
}

function AudioBookShelfSettings() {
    return (
        <>
            <SettingsSection id="audiobookshelf-settings" name="" description="再生中のオーディオブックを Discord の Rich Presence として表示します。AudioBookShelf のサーバー URL、ユーザー名、パスワードが必要です。" />
            <TextSetting name="サーバー URL" description="AudioBookShelf のサーバー URL。" settingsKey="abs_serverUrl" placeholder="https://abs.example.com" />
            <AllowServerSetting settingsKey="abs_serverUrl" />
            <TextSetting name="ユーザー名" description="AudioBookShelf のユーザー名。" settingsKey="abs_username" />
            <TextSetting name="パスワード" description="AudioBookShelf のパスワード。" settingsKey="abs_password" />
        </>
    );
}

function TosuSettings() {
    return (
        <SettingsSection id="tosu-settings" name="" description="ポート 24050 の WebSocket 経由で tosu に接続します。設定は不要で、osu! と一緒に tosu が起動していれば動作します。" />
    );
}

const nameFormatOptions = [
    { label: "カスタムステータス名を使う", value: NameFormat.StatusName },
    { label: "『アーティスト - 曲名』形式を使う", value: NameFormat.ArtistFirst },
    { label: "『曲名 - アーティスト』形式を使う", value: NameFormat.SongFirst },
    { label: "アーティスト名のみ使う", value: NameFormat.ArtistOnly },
    { label: "曲名のみ使う", value: NameFormat.SongOnly },
    { label: "アルバム名を使う", value: NameFormat.AlbumName },
];

function StatsFmSettings() {
    return (
        <>
            <SettingsSection id="statsfm-settings" name="" description="stats.fm 経由で現在聴いている曲を表示します。再生履歴を公開にしておく必要があります。" />
            <TextSetting name="ユーザー名" description="stats.fm のユーザー名。" settingsKey="sfm_username" placeholder="stats.fm のユーザー名" />
            <TextSetting name="カスタムステータステキスト" description="カスタムステータスのテキスト。" settingsKey="sfm_statusName" placeholder="Stats.fm" />
            <SelectSetting name="名前の形式" description="名前の表示形式。" settingsKey="sfm_nameFormat" options={nameFormatOptions} />
            <SelectSetting name="アート欠落時の代替表示" description="アートがない場合の代替表示。" settingsKey="sfm_missingArt" options={[
                { label: "Stats.fm の大きいロゴを使う", value: "StatsFmLogo" },
                { label: "汎用プレースホルダーを使う", value: "placeholder" },
            ]} />
            <SwitchSetting name="リスニングステータスを表示" description="リスニングステータスを表示します。" settingsKey="sfm_useListeningStatus" />
            <SwitchSetting name="Stats.fm ロゴを表示" description="アルバムアートの横に Stats.fm のロゴを表示します。" settingsKey="sfm_showLogo" />
            <SwitchSetting name="プロフィールリンクを表示" description="stats.fm プロフィールへのリンクを表示します。" settingsKey="sfm_shareUsername" />
            <SwitchSetting name="曲のリンクを表示" description="stats.fm の曲へのリンクを表示します。" settingsKey="sfm_shareSong" />
            <SwitchSetting name="Spotify 使用時は隠す" description="Spotify が動作中は stats.fm のプレゼンスを隠します。" settingsKey="sfm_hideWithSpotify" />
            <SwitchSetting name="外部 RPC 使用時は隠す" description="外部 RPC が動作中は stats.fm のプレゼンスを隠します。" settingsKey="sfm_hideWithExternalRPC" />
            <SwitchSetting name="アルバムアートを無効化" description="アルバムアートのダウンロードを無効化します。" settingsKey="sfm_alwaysHideArt" />
        </>
    );
}

function JellyfinSettings() {
    return (
        <>
            <SettingsSection id="jellyfin-settings" name="" description="Jellyfin で再生中のものを表示します。API キーの取得方法：Jellyfin の Web UI を開き、F12 で開発者ツールを開いて「ネットワーク」タブに移動し、サーバーへのリクエストを探して Authorization ヘッダー（Ctrl+F で検索）を見つけます。必要なのは Token='this' の部分です。ユーザー ID はプロフィールページの URL で確認できます。" />
            <TextSetting name="サーバー URL" description="Jellyfin のサーバー URL。" settingsKey="jf_serverUrl" placeholder="https://jellyfin.example.com" />
            <AllowServerSetting settingsKey="jf_serverUrl" />
            <TextSetting name="API キー" description="Jellyfin の API キー。" settingsKey="jf_apiKey" placeholder="Authorization" />
            <TextSetting name="ユーザー ID" description="Jellyfin のユーザー ID。" settingsKey="jf_userId" placeholder="プロフィール URL のユーザー ID" />
            <SelectSetting name="名前の表示" description="名前の表示形式。" settingsKey="jf_nameDisplay" options={[
                { label: "シリーズ/映画名", value: "default" },
                { label: "シリーズ - エピソード/曲/映画名", value: "full" },
                { label: "カスタム", value: "custom" },
            ]} />
            <TextSetting name="カスタム名テンプレート" description="カスタム名のテンプレート。" settingsKey="jf_customName" placeholder="{name} on Jellyfin" />
            <SelectSetting name="カバーの種類" description="TV 番組のカバーの種類。" settingsKey="jf_coverType" options={[
                { label: "シリーズのカバー", value: "series" },
                { label: "エピソードのカバー", value: "episode" },
            ]} />
            <SelectSetting name="エピソード形式" description="エピソード番号の形式。" settingsKey="jf_episodeFormat" options={[
                { label: "S01E01", value: "long" },
                { label: "1x01", value: "short" },
                { label: "シーズン1 エピソード1", value: "fulltext" },
            ]} />
            <SelectSetting name="プレゼンスタイプの上書き" description="Rich Presence のタイプを上書きします。" settingsKey="jf_overrideType" options={[
                { label: "オフ", value: "off" },
                { label: "リスニング中", value: "2" },
                { label: "プレイ中", value: "0" },
                { label: "配信中", value: "1" },
                { label: "視聴中", value: "3" },
            ]} />
            <SwitchSetting name="エピソード名を表示" description="シーズン/エピソード情報の後にエピソード名を表示します。" settingsKey="jf_showEpisodeName" />
            <SwitchSetting name="一時停止中も表示" description="メディアが一時停止中もプレゼンスを表示します。" settingsKey="jf_showPausedState" />
            <SwitchSetting name="プライバシーモード" description="メディアの詳細を隠します。" settingsKey="jf_privacyMode" />
        </>
    );
}

function GensokyoRadioSettings() {
    const [value, setValue] = useState(settings.store.gr_refreshInterval ?? 15);
    return (
        <>
            <SettingsSection id="gensokyoradio-settings" name="" description="Gensokyo Radio 向けの Discord Rich Presence です。有効にして聴くだけで動作します！" />
            <SettingsSection id="refresh-interval" name="更新間隔" description="更新間隔（秒）。">
                <Slider
                    markers={[1, 2, 2.5, 3, 5, 10, 15]}
                    initialValue={value}
                    onValueChange={v => { setValue(v); settings.store.gr_refreshInterval = v; }}
                    onValueRender={v => `${v}s`}
                    stickToMarkers
                />
            </SettingsSection>
        </>
    );
}

const ND_DYNAMIC_KEYS: SettingsKey[] = ["nd_activityType", "nd_albumArtMode"];

function NavidromeSettings() {
    const [refreshInterval, setRefreshInterval] = useState(settings.store.nd_refreshInterval ?? 10);
    const { nd_activityType, nd_albumArtMode } = settings.use(ND_DYNAMIC_KEYS);
    return (
        <>
            <SettingsSection id="navidrome-settings" name="" description="Navidrome 経由で現在聴いている曲を表示します。" />
            <TextSetting name="サーバー URL" description="Navidrome のサーバー URL（公開ドメインが必要。例: https://navidrome.example.com）。" settingsKey="nd_serverUrl" placeholder="https://navidrome.example.com" />
            <AllowServerSetting settingsKey="nd_serverUrl" />
            <TextSetting name="ユーザー名" description="Navidrome のユーザー名。" settingsKey="nd_username" />
            <TextSetting name="パスワード" description="Navidrome のパスワード。" settingsKey="nd_password" />
            <TextSetting name="クライアント ID" description="任意の Discord アプリケーションのクライアント ID。" settingsKey="nd_clientId" placeholder="1470554657506984069" />
            <SelectSetting name="アルバムアートの取得方法" description="アルバムアートの取得方法。" settingsKey="nd_albumArtMode" options={[
                { label: "なし", value: "none" },
                { label: "Navidrome インスタンス（サーバー URL が公開されます。一度だけ認証が送信されます）", value: "instance" },
                { label: "Last.fm API（メタデータを last.fm に送信）", value: "lastfm" },
            ]} />
            {nd_albumArtMode === "lastfm" && (
                <TextSetting name="Last.fm API キー" description="任意：自分の Last.fm API キーを指定（空欄の場合はデフォルトを使用）。" settingsKey="nd_lastfmApiKey" placeholder="feff915bf5987580c9dc354d523dc6b9" />
            )}
            <SwitchSetting name="小さい画像を表示" description="アルバムアートの右下に Navidrome のロゴを表示します。" settingsKey="nd_showSmallImage" />
            <SwitchSetting name="アルバムを表示" description="プレゼンスにアルバム名を表示します。" settingsKey="nd_showAlbum" />
            <SelectSetting name="アクティビティタイプ" description="表示するアクティビティの種類。" settingsKey="nd_activityType" options={[
                { label: "リスニング中", value: 2 },
                { label: "プレイ中", value: 0 },
                { label: "視聴中", value: 3 }
            ]} />
            <SelectSetting name="ステータス表示タイプ" description="メンバーリストに state / details 行の内容を表示します" settingsKey="nd_statusDisplayType" options={[
                { label: "表示しない（汎用のリスニングメッセージを表示）", value: "off" },
                { label: "state 行の内容を表示", value: "artist" },
                { label: "details 行の内容を表示", value: "track" }
            ]} />
            <SwitchSetting name="一時停止時に隠す" description="音楽が一時停止中は Rich Presence を隠します（ストップウォッチ表示の代わり）" settingsKey="nd_hideOnPause" />
            {Number(nd_activityType ?? 2) !== 0 && (
                <TextSetting name="アクティビティ名の形式" description="「Listening to」のテキスト（例: {artist}）" settingsKey="nd_nameString" placeholder="Navidrome" />
            )}
            <TextSetting name="詳細の形式" description="再生中の曲を示すメインの行（例: {song}）" settingsKey="nd_detailsString" placeholder="{song}" />
            <TextSetting name="状態の形式" description="曲名の下の行（例: {artist}）" settingsKey="nd_stateString" placeholder="{artist}" />
            <TextSetting name="大きいテキストの形式" description="アルバムの行（例: {album}）" settingsKey="nd_largeTextString" placeholder="{album}" />
            <SettingsSection id="nd-refresh-interval" name="更新間隔" description="更新間隔（秒）。">
                <Slider
                    markers={[1, 2, 5, 10, 15]}
                    initialValue={refreshInterval}
                    onValueChange={v => { setRefreshInterval(v); settings.store.nd_refreshInterval = v; }}
                    onValueRender={v => `${v}s`}
                    stickToMarkers
                />
            </SettingsSection>
        </>
    );
}

const TAB_COMPONENTS: Record<ServiceTab, React.ComponentType> = {
    [ServiceTab.AudioBookShelf]: AudioBookShelfSettings,
    [ServiceTab.Tosu]: TosuSettings,
    [ServiceTab.StatsFm]: StatsFmSettings,
    [ServiceTab.Jellyfin]: JellyfinSettings,
    [ServiceTab.GensokyoRadio]: GensokyoRadioSettings,
    [ServiceTab.Navidrome]: NavidromeSettings,
};

const TAB_LABELS: Record<ServiceTab, string> = {
    [ServiceTab.AudioBookShelf]: "AudioBookShelf",
    [ServiceTab.Tosu]: "osu!",
    [ServiceTab.StatsFm]: "stats.fm",
    [ServiceTab.Jellyfin]: "Jellyfin",
    [ServiceTab.GensokyoRadio]: "Gensokyo Radio",
    [ServiceTab.Navidrome]: "Navidrome",
};

const ENABLE_KEYS: Record<ServiceTab, SettingsKey> = {
    [ServiceTab.AudioBookShelf]: "abs_enabled",
    [ServiceTab.Tosu]: "tosu_enabled",
    [ServiceTab.StatsFm]: "sfm_enabled",
    [ServiceTab.Jellyfin]: "jf_enabled",
    [ServiceTab.GensokyoRadio]: "gr_enabled",
    [ServiceTab.Navidrome]: "nd_enabled",
};

const TABS = Object.values(ServiceTab);

export function SettingsPanel() {
    const [currentTab, setCurrentTab] = useState(ServiceTab.AudioBookShelf);
    const TabComponent = TAB_COMPONENTS[currentTab];

    return (
        <div className={classes("vc-plugins-settings", Margins.top16)}>
            <TabBar
                type="top"
                look="brand"
                selectedItem={currentTab}
                onItemSelect={setCurrentTab}
            >
                {TABS.map(tab => (
                    <TabBar.Item key={tab} id={tab}>
                        {TAB_LABELS[tab]}
                    </TabBar.Item>
                ))}
            </TabBar>
            <SwitchSetting key={currentTab} name="有効化" description={`${TAB_LABELS[currentTab]} のプレゼンスを有効化します。`} settingsKey={ENABLE_KEYS[currentTab]} />
            <TabComponent />
        </div>
    );
}
