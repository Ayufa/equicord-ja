/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Sofia Lima
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import { definePluginSettings, migratePluginSetting, migratePluginSettings } from "@api/Settings";
import { Button, LinkButton } from "@components/Button";
import { Card } from "@components/Card";
import { Heading } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { Devs } from "@utils/constants";
import { promptToRestart } from "@utils/promptToRestart";
import { useAwaiter, useForceUpdater } from "@utils/react";
import definePlugin, { OptionType } from "@utils/types";
import { Activity, ActivityAssets, ActivityButton } from "@vencord/discord-types";
import { ActivityFlags, ActivityStatusDisplayType, ActivityType } from "@vencord/discord-types/enums";
import { ApplicationAssetUtils, AuthenticationStore, FluxDispatcher, PresenceStore } from "@webpack/common";

import { LastFMScrobbler } from "./lastfm";
import { invalidateListenBrainzCache, ListenBrainzScrobbler } from "./listenbrainz";

export interface TrackData {
    name: string;
    album: string;
    artist: string;
    trackURL?: string;
    artistURL?: string;
    albumURL?: string;
    imageURL?: string;
    serviceName?: string;
}

export interface ScrobblerBackend {
    name: string,
    id: string,

    fetchTrackData(): Promise<TrackData | null>;
    getUserURL(username: string): string;
}

const enum NameFormat {
    StatusName = "status-name",
    ArtistFirst = "artist-first",
    SongFirst = "song-first",
    ArtistOnly = "artist",
    SongOnly = "song",
    AlbumName = "album",
    ServiceName = "service-name"
}

const DISCORD_APP_ID = "1108588077900898414";
const LASTFM_PLACEHOLDER_IMAGE_HASH = "2a96cbd8b46e442fc41c2b86b821562f";

async function getApplicationAsset(key: string): Promise<string> {
    return (await ApplicationAssetUtils.fetchAssetIds(DISCORD_APP_ID, [key]))[0];
}

function setActivity(activity: Activity | null) {
    FluxDispatcher.dispatch({
        type: "LOCAL_ACTIVITY_UPDATE",
        activity,
        socketId: "LastFM",
    });
}

export const settings = definePluginSettings({
    scrobblerBackend: {
        description: "使用するスクロブラーのバックエンド。",
        type: OptionType.SELECT,
        options: [
            {
                "label": "Last.FM",
                "value": "lastfm",
                "default": true
            },
            {
                "label": "ListenBrainz",
                "value": "listenbrainz"
            },
            {
                "label": "ListenBrainz Compatible (self-hosted)",
                "value": "listenbrainz-compatible"
            }
        ] as const
    },
    instanceBaseURL: {
        description: "ListenBrainz インスタンスのベース URL。",
        type: OptionType.STRING,
        placeholder: "https://example.org",
        onChange: invalidateListenBrainzCache
    },
    instanceAPIBaseUrl: {
        description: "ListenBrainz API のベース URL。",
        type: OptionType.STRING,
        placeholder: "https://api.example.org",
        onChange: invalidateListenBrainzCache
    },
    apiKey: {
        displayName: "APIキー",
        description: "Last.fm の API キー。必須ではありませんが、共有キーのレート制限を避けるため強く推奨します",
        type: OptionType.STRING,
    },
    username: {
        description: "ユーザー名",
        type: OptionType.STRING,
    },
    shareUsername: {
        description: "スクロブラーのプロフィールへのリンクを表示します",
        type: OptionType.BOOLEAN,
        default: false,
    },
    clickableLinks: {
        description: "曲名、アーティスト名、アルバム名をクリック可能なリンクにします",
        type: OptionType.BOOLEAN,
        default: true,
    },
    hideWithSpotify: {
        description: "Spotify が起動中の場合はプレゼンスを隠します",
        type: OptionType.BOOLEAN,
        default: true,
    },
    hideWithActivity: {
        description: "他のプレゼンスがある場合はプレゼンスを隠します",
        type: OptionType.BOOLEAN,
        default: false,
    },
    statusName: {
        description: "カスタムステータステキスト。次の変数が使えます: {artist} | {album} | {title}",
        type: OptionType.STRING,
        default: "some music",
    },
    statusDisplayType: {
        description: "メンバーリストに曲名 / アーティスト名を表示します",
        type: OptionType.SELECT,
        options: [
            {
                label: "表示しない（一般的なリスニングメッセージが表示されます）",
                value: "off"
            },
            {
                label: "アーティスト名を表示",
                value: "artist",
                default: true
            },
            {
                label: "曲名を表示",
                value: "track"
            }
        ]
    },
    nameFormat: {
        description: "ステータス名に曲名とアーティスト名を表示します",
        type: OptionType.SELECT,
        options: [
            {
                label: "カスタムステータス名を使用",
                value: NameFormat.StatusName,
                default: true
            },
            {
                label: "音楽サービス名を使用（カスタムステータステキストにフォールバックします）",
                value: NameFormat.ServiceName
            },
            {
                label: "「アーティスト - 曲名」の形式を使用",
                value: NameFormat.ArtistFirst
            },
            {
                label: "「曲名 - アーティスト」の形式を使用",
                value: NameFormat.SongFirst
            },
            {
                label: "アーティスト名のみを使用",
                value: NameFormat.ArtistOnly
            },
            {
                label: "曲名のみを使用",
                value: NameFormat.SongOnly
            },
            {
                label: "アルバム名を使用（曲にアルバムがない場合はカスタムステータステキストにフォールバックします）",
                value: NameFormat.AlbumName
            }
        ],
    },
    useListeningStatus: {
        description: '「Playing」ではなく「Listening to」ステータスを表示',
        type: OptionType.BOOLEAN,
        default: false,
    },
    missingArt: {
        description: "アルバムまたはアルバムアートがない場合",
        type: OptionType.SELECT,
        options: [
            {
                label: "大きなスクロブラーのロゴを使用",
                value: "logo",
                default: true
            },
            {
                label: "汎用のプレースホルダーを使用",
                value: "placeholder"
            }
        ],
    },
    showLogo: {
        displayName: "スクロブラーのロゴを表示",
        description: "アルバムカバーの横にスクロブラーサービスのロゴを表示します",
        type: OptionType.BOOLEAN,
        default: true,
    },
    showAlbumCover: {
        description: "アルバムカバーを表示します。無効にするとプレースホルダーが表示されます。音楽に不適切なアートがある場合に便利です",
        type: OptionType.BOOLEAN,
        default: true,
    }
}, {
    apiKey: { hidden() { return this.store.scrobblerBackend !== "lastfm"; } },
    instanceBaseURL: { hidden() { return this.store.scrobblerBackend !== "listenbrainz-compatible"; } },
    instanceAPIBaseUrl: { hidden() { return this.store.scrobblerBackend !== "listenbrainz-compatible"; } },
});

const hasInvalidCustomInstance = () => settings.store.scrobblerBackend === "listenbrainz-compatible" && (!settings.store.instanceAPIBaseUrl || !settings.store.instanceBaseURL);

function CustomInstanceAboutComponent() {
    const { instanceAPIBaseUrl, instanceBaseURL } = settings.store;

    const [signal, forceUpdate] = useForceUpdater(true);

    const [cspAllowed] = useAwaiter(async () => {
        if (!instanceAPIBaseUrl || !instanceBaseURL) return true;
        return await VencordNative.csp.isDomainAllowed(instanceAPIBaseUrl, ["connect-src"]) && await VencordNative.csp.isDomainAllowed(instanceBaseURL, ["connect-src"]);
    }, { fallbackValue: true, deps: [instanceAPIBaseUrl, instanceBaseURL, signal] });

    if (!instanceAPIBaseUrl || !instanceBaseURL)
        return (
            <Card variant="danger">
                <Heading>Invalid ListenBrainz compatible instance</Heading>
                <Paragraph>Provide both the <b>API Base URL</b> and the <b>Instance Base URL</b> for your custom ListenBrainz instance or switch back to ListenBrainz/Last.FM</Paragraph>
            </Card>
        );

    if (!cspAllowed)
        return (
            <Card variant="warning">
                <Heading>Allow Vencord to connect to ListenBrainz instance</Heading>
                <Paragraph>To use your custom ListenBrainz instance, you must first allow Vencord to connect to it.</Paragraph>
                <Button
                    size="small"
                    className={Margins.top8}
                    variant="secondary"
                    onClick={async () => {
                        for (const host of [instanceAPIBaseUrl, instanceBaseURL]) {
                            const res = await VencordNative.csp.requestAddOverride(host, ["connect-src"], "MusicRichPresence");
                            if (!res) return;
                        }
                        forceUpdate();
                        promptToRestart("relaunch");
                    }}
                >
                    Allow Instance
                </Button>
            </Card>
        );

    return null;
}

migratePluginSettings("MusicRichPresence", "LastFMRichPresence");
migratePluginSetting("MusicRichPresence", "showLastFmLogo", "showLogo");
export default definePlugin({
    name: "MusicRichPresence",
    description: "Last.FM/Listenbrainz向けのリッチプレゼンス",
    tags: ["Activity", "Media"],
    searchTerms: ["lastfm", "LastFMRichPresence"],
    authors: [Devs.Rini, Devs.Ven, Devs.angelcube, Devs.RuiNtD, Devs.blahajZip, Devs.archeruwu],

    settings,

    settingsAboutComponent() {
        if (settings.store.scrobblerBackend === "lastfm")
            return (
                <Card>
                    <Heading tag="h2">Last.FM</Heading>
                    <Heading>How to create an API key</Heading>
                    <Paragraph>Set <strong>Application name</strong> and <strong>Application description</strong> to anything and leave the rest blank.</Paragraph>
                    <LinkButton size="small" href="https://www.last.fm/api/account/create" className={Margins.top8}>Create API Key</LinkButton>
                </Card>
            );

        if (settings.store.scrobblerBackend === "listenbrainz-compatible")
            return <CustomInstanceAboutComponent />;

        return null;
    },

    start() {
        this.updatePresence();
        this.updateInterval = setInterval(() => { this.updatePresence(); }, 16000);
    },

    stop() {
        clearInterval(this.updateInterval);
    },

    async updatePresence() {
        const { username, scrobblerBackend, instanceAPIBaseUrl, instanceBaseURL } = settings.store;

        if (!username) return;
        if (hasInvalidCustomInstance()) return;

        setActivity(await this.getActivity());
    },

    getLargeImage(track: TrackData): string | undefined {
        if (settings.store.showAlbumCover && track.imageURL && !track.imageURL.includes(LASTFM_PLACEHOLDER_IMAGE_HASH))
            return track.imageURL;

        if (settings.store.missingArt === "placeholder")
            return "placeholder";
    },

    async getActivity(): Promise<Activity | null> {

        if (settings.store.hideWithActivity) {
            if (PresenceStore.getActivities(AuthenticationStore.getId()).some(a => a.application_id !== DISCORD_APP_ID && a.type !== ActivityType.CUSTOM_STATUS)) {
                return null;
            }
        }

        if (settings.store.hideWithSpotify) {
            if (PresenceStore.getActivities(AuthenticationStore.getId()).some(a => a.type === ActivityType.LISTENING && a.application_id !== DISCORD_APP_ID)) {
                // there is already music status because of Spotify or richerCider (probably more)
                return null;
            }
        }

        const scrobbler = settings.store.scrobblerBackend === "lastfm" ? LastFMScrobbler : ListenBrainzScrobbler;

        const trackData = await scrobbler.fetchTrackData();
        if (!trackData) return null;

        const largeImage = this.getLargeImage(trackData);
        const assets: ActivityAssets = largeImage ?
            {
                large_image: await getApplicationAsset(largeImage),
                large_text: trackData.album || undefined,
                ...(settings.store.showLogo && {
                    small_image: await getApplicationAsset(`${scrobbler.id}-small`),
                    small_text: scrobbler.id
                }),
            } : {
                large_image: await getApplicationAsset(`${scrobbler.id}-large`),
                large_text: trackData.album || undefined,
            };

        const buttons: ActivityButton[] = [];

        if (settings.store.shareUsername) {
            buttons.push({
                label: `${scrobbler.name} Profile`,
                url: scrobbler.getUserURL(settings.store.username!)
            });
        }

        const statusName = (() => {
            switch (settings.store.nameFormat) {
                case NameFormat.ArtistFirst:
                    return trackData.artist + " - " + trackData.name;
                case NameFormat.SongFirst:
                    return trackData.name + " - " + trackData.artist;
                case NameFormat.ArtistOnly:
                    return trackData.artist;
                case NameFormat.SongOnly:
                    return trackData.name;
                case NameFormat.AlbumName:
                    return trackData.album || settings.store.statusName
                        .replaceAll("{artist}", trackData.artist || "")
                        .replaceAll("{album}", trackData.album || "")
                        .replaceAll("{title}", trackData.name || "");
                case NameFormat.ServiceName:
                    return trackData.serviceName || settings.store.statusName
                        .replaceAll("{artist}", trackData.artist || "")
                        .replaceAll("{album}", trackData.album || "")
                        .replaceAll("{title}", trackData.name || "");
                default:
                    return settings.store.statusName
                        .replaceAll("{artist}", trackData.artist || "")
                        .replaceAll("{album}", trackData.album || "")
                        .replaceAll("{title}", trackData.name || "");
            }
        })();

        const activity: Activity = {
            application_id: DISCORD_APP_ID,
            name: statusName,

            details: trackData.name,
            state: trackData.artist,
            status_display_type: {
                "off": ActivityStatusDisplayType.NAME,
                "artist": ActivityStatusDisplayType.STATE,
                "track": ActivityStatusDisplayType.DETAILS
            }[settings.store.statusDisplayType],

            assets,

            buttons: buttons.length ? buttons.map(v => v.label) : undefined,
            metadata: {
                button_urls: buttons.map(v => v.url),
            },

            type: settings.store.useListeningStatus ? ActivityType.LISTENING : ActivityType.PLAYING,
            flags: ActivityFlags.INSTANCE,
        };

        if (settings.store.clickableLinks) {
            activity.details_url = trackData.trackURL;
            activity.state_url = trackData.artistURL;

            if (trackData.album) {
                activity.assets!.large_url = trackData.albumURL;
            }
        }

        return activity;
    }
});
