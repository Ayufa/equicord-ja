/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings, Settings } from "@api/Settings";
import { Button } from "@components/Button";
import ErrorBoundary from "@components/ErrorBoundary";
import { OptionType } from "@utils/types";
import { useState } from "@webpack/common";

import { Native } from ".";
import { ClearLogsButton } from "./components/ClearLogsButton";
import { ImageCacheDir, LogsDir } from "./components/FolderSelectInput";
import { openLogModal } from "./components/LogsModal";
import { blockedExts } from "./list";
import { DEFAULT_IMAGE_CACHE_DIR } from "./utils/constants";
import { exportLogs, importLogs } from "./utils/settingsUtils";

function ImportLogsButton() {
    const [loading, setLoading] = useState(false);

    return (
        <Button
            disabled={loading}
            onClick={async () => {
                setLoading(true);
                try {
                    await importLogs();
                } finally {
                    setLoading(false);
                }
            }}
        >
            {loading ? "インポート中..." : "ログをインポート"}
        </Button>
    );
}

function ExportLogsButton() {
    const [loading, setLoading] = useState(false);

    return (
        <Button
            disabled={loading}
            onClick={async () => {
                setLoading(true);
                try {
                    await exportLogs();
                } finally {
                    setLoading(false);
                }
            }}
        >
            {loading ? "エクスポート中..." : "ログをエクスポート"}
        </Button>
    );
}

export const settings = definePluginSettings({
    saveMessages: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "削除・編集されたメッセージを保存するかどうか。",
    },

    saveImages: {
        type: OptionType.BOOLEAN,
        description: "削除された添付ファイルを保存します。",
        default: false
    },

    sortNewest: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "ログを新しい順に並べ替えます。",
    },

    cacheMessagesFromServers: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "通常、メッセージロガーはホワイトリストに登録された ID と DM のみを記録します。これを有効にすると、すべてのサーバーのメッセージも記録するようになります。キャッシュの上限を超えて一部のメッセージを取りこぼす可能性があることに注意してください。多くのサーバーに参加している場合、メッセージが記録される可能性が大幅に上がり、記録が大きくなったり無関係なメッセージが含まれたりすることがあります。",
    },

    ignoreBots: {
        type: OptionType.BOOLEAN,
        description: "ボットのメッセージを無視するかどうか",
        default: false,
        onChange() {
            // we will be handling the ignoreBots now (enabled or not) so the original messageLogger shouldnt
            Settings.plugins.MessageLogger.ignoreBots = false;
        }
    },

    ignoreWebhooks: {
        type: OptionType.BOOLEAN,
        description: "ウェブフックのメッセージを無視するかどうか",
        default: false,
    },

    ignoreSelf: {
        type: OptionType.BOOLEAN,
        description: "自分のメッセージを無視するかどうか",
        default: false,
        onChange() {
            Settings.plugins.MessageLogger.ignoreSelf = false;
        }
    },

    ignoreMutedGuilds: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "ミュートしたサーバーのメッセージは記録されません。ミュートしたサーバー内でも、ホワイトリストに登録されたユーザー/チャンネルは記録されます。"
    },

    ignoreMutedCategories: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "ミュートしたカテゴリに属するチャンネルのメッセージは記録されません。ミュートしたサーバー内でも、ホワイトリストに登録されたユーザー/チャンネルは記録されます。"
    },

    ignoreMutedChannels: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "ミュートしたチャンネルのメッセージは記録されません。ミュートしたサーバー内でも、ホワイトリストに登録されたユーザー/チャンネルは記録されます。"
    },

    alwaysLogDirectMessages: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "常に DM を記録",
    },

    alwaysLogCurrentChannel: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "現在選択中のチャンネルを常に記録します。ブラックリストに登録されたチャンネル/ユーザーは引き続き無視されます。",
    },

    permanentlyRemoveLogByDefault: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "Vencord 標準の MessageLogger のログ削除ボタンはログを完全に削除します",
    },

    hideMessageFromMessageLoggers: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "有効にすると、メッセージにコンテキストメニューボタンが追加され、他のロガーに記録されずにメッセージを削除できるようになります。安全でない可能性があるため、自己責任で使用してください。"
    },

    ShowLogsButton: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "ツールボックスを表示するかどうか",
        restartNeeded: true,
    },

    ShowWhereMessageIsFrom: {
        default: false,
        type: OptionType.BOOLEAN,
        description: "メッセージのチャンネル/投稿者名とサーバー名を表示",
    },

    messagesToDisplayAtOnceInLogs: {
        default: 100,
        type: OptionType.NUMBER,
        description: "ログに一度に表示するメッセージ数と、ログでさらに読み込むときに読み込むメッセージ数。",
    },

    hideMessageFromMessageLoggersDeletedMessage: {
        default: "redacted eh",
        type: OptionType.STRING,
        description: "メッセージロガーからメッセージを隠す機能を使うときに、メッセージを置き換える内容。",
    },

    messageLimit: {
        default: 200,
        type: OptionType.NUMBER,
        description: "保存するメッセージの最大数。上限に達すると古いメッセージが削除されます。0 は無制限を意味します"
    },

    attachmentSizeLimitInMegabytes: {
        default: 12,
        type: OptionType.NUMBER,
        description: "保存する添付ファイルの最大サイズ（MB）。このサイズより大きい添付ファイルは保存されません。"
    },

    attachmentFileExtensions: {
        default: "png,jpg,jpeg,gif,webp,mp4,webm,mp3,ogg,wav",
        type: OptionType.STRING,
        description: "保存するファイル拡張子のカンマ区切りリスト。このリストにない拡張子の添付ファイルは保存されません。",
        onChange: (value: string) => {
            let processedValue = "";

            if (value) {
                const exts = value.split(",").map(ext => ext.trim().toLowerCase());
                const invalid = exts.filter(ext => blockedExts.includes(ext));

                if (invalid.length > 0) {
                    console.warn("Rejected invalid file extensions:", invalid);
                    processedValue = exts.filter(ext => !blockedExts.includes(ext)).join(",");
                } else {
                    processedValue = exts.join(",");
                }
            }

            Native.updateAllowedExtensions(processedValue).catch((err: any) => {
                console.error("Failed to sync attachment extensions natively:", err);
            });

            return processedValue;
        }
    },
    cacheLimit: {
        default: 1000,
        type: OptionType.NUMBER,
        description: "キャッシュに保存するメッセージの最大数。上限に達すると古いメッセージが削除されます。メモリ使用量の削減とパフォーマンスの向上に役立ちます。0 は無制限を意味します",
    },

    timeBasedCleanupMinutes: {
        default: 0,
        type: OptionType.NUMBER,
        description: "この分数より古いサーバーのメッセージを自動的に削除します。0 に設定すると時間ベースのクリーンアップが無効になります。",
    },

    preserveCurrentChannel: {
        default: true,
        type: OptionType.BOOLEAN,
        description: "有効にすると、現在選択中のチャンネルのメッセージは時間ベースのクリーンアップの影響を受けません。",
    },

    whitelistedIds: {
        default: "",
        type: OptionType.STRING,
        description: "メッセージログに常に表示するサーバー、チャンネル、またはユーザー ID。"
    },

    blacklistedIds: {
        default: "",
        type: OptionType.STRING,
        description: "メッセージログに決して表示しないサーバー、チャンネル、またはユーザー ID。"
    },

    imageCacheDir: {
        type: OptionType.COMPONENT,
        description: "保存した画像のディレクトリを選択",
        component: ErrorBoundary.wrap(ImageCacheDir) as any
    },

    logsDir: {
        type: OptionType.COMPONENT,
        description: "ログのディレクトリを選択",
        component: ErrorBoundary.wrap(LogsDir) as any
    },

    importLogs: {
        type: OptionType.COMPONENT,
        description: "ファイルからログをインポート",
        component: ImportLogsButton
    },

    exportLogs: {
        type: OptionType.COMPONENT,
        description: "IndexedDB からログをエクスポート",
        component: ExportLogsButton
    },

    clearLogsOnRestart: {
        type: OptionType.BOOLEAN,
        description: "Discord の再起動時にログをクリアします。",
        default: false,
        restartNeeded: true,
    },

    openLogs: {
        type: OptionType.COMPONENT,
        description: "ログを開く",
        component: () =>
            <Button onClick={() => openLogModal()}>
                ログを開く
            </Button>
    },
    openImageCacheFolder: {
        type: OptionType.COMPONENT,
        description: "画像キャッシュのディレクトリを開きます",
        component: () =>
            <Button
                disabled={
                    IS_WEB
                    || settings.store.imageCacheDir == null
                    || settings.store.imageCacheDir === DEFAULT_IMAGE_CACHE_DIR
                }
                onClick={() => Native.showItemInFolder()}
            >
                画像キャッシュフォルダーを開く
            </Button>
    },

    clearLogs: {
        type: OptionType.COMPONENT,
        description: "ログをクリア",
        component: () => <ClearLogsButton />
    },

});
