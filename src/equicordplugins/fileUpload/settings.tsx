/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Notice } from "@components/Notice";
import { SettingsSection } from "@components/settings/tabs/plugins/components/Common";
import { Switch } from "@components/Switch";
import { useCspPermission } from "@utils/csp";
import { classNameFactory } from "@utils/css";
import { useForceUpdater } from "@utils/react";
import { OptionType, PluginNative } from "@utils/types";
import { React, Select, showToast, TextArea, TextInput } from "@webpack/common";

import { fallbackServiceOrder, serviceLabels, ServiceType } from "./types";
import { parseShareXConfig } from "./utils/sharex";

const Native = IS_WEB
    ? null
    : VencordNative.pluginHelpers.FileUpload as PluginNative<typeof import("./native")>;

const defaultFallbackOrder = fallbackServiceOrder.join(",");
const cl = classNameFactory("vc-file-upload-settings-");

const serviceOptions = [
    { label: "Zipline", value: ServiceType.ZIPLINE, default: true },
    { label: "E-Z Host", value: ServiceType.EZHOST },
    { label: "Nest", value: ServiceType.NEST },
    { label: "Encrypting.host", value: ServiceType.ENCRYPTINGHOST },
    { label: "S3-Compatible", value: ServiceType.S3 },
    { label: "Catbox.moe", value: ServiceType.CATBOX },
    ...(IS_WEB ? [] : [{ label: "0x0.st", value: ServiceType.ZEROX0 }]),
    { label: "Litterbox", value: ServiceType.LITTERBOX },
    { label: "GoFile", value: ServiceType.GOFILE },
    { label: "tmpfiles.org", value: ServiceType.TMPFILES },
    { label: "buzzheavier.com", value: ServiceType.BUZZHEAVIER },
    { label: "temp.sh", value: ServiceType.TEMPSH },
    { label: "filebin.net", value: ServiceType.FILEBIN },
    { label: "PixelVault", value: ServiceType.PIXELVAULT },
    { label: "PixelDrain", value: ServiceType.PIXELDRAIN },
    { label: "ShareX Custom Uploader", value: ServiceType.SHAREX },
    { label: "WebDAV (Nextcloud/Owncloud)", value: ServiceType.WEBDAV }
];

const litterboxOptions = [
    { label: "1時間", value: "1h" },
    { label: "12時間", value: "12h" },
    { label: "24時間", value: "24h", default: true },
    { label: "72時間", value: "72h" }
];

const embedProxyOptions = [
    { label: "CORSプロキシ", value: "cors" },
    { label: "discord.nfp.is", value: "nfp", default: true }
];

const encryptingHostUrlStyleOptions = [
    { label: "クエリ", value: "query", default: true },
    { label: "パラメータ", value: "param" },
    { label: "偽リンク", value: "fakelink" },
    { label: "埋め込み", value: "embed" }
];

export const settings = definePluginSettings({
    serviceType: {
        type: OptionType.SELECT,
        description: "選択したアップローダーサービス",
        options: serviceOptions,
        hidden: true
    },
    serviceUrl: {
        type: OptionType.STRING,
        description: "ZiplineサービスURL",
        default: "",
        hidden: true
    },
    ziplineToken: {
        type: OptionType.STRING,
        description: "Zipline認証トークン",
        default: "",
        hidden: true
    },
    folderId: {
        type: OptionType.STRING,
        description: "任意のZiplineフォルダID",
        default: "",
        hidden: true
    },
    ezHostKey: {
        type: OptionType.STRING,
        description: "E-Z Host APIキー",
        default: "",
        hidden: true
    },
    nestToken: {
        type: OptionType.STRING,
        description: "Nest APIトークン",
        default: "",
        hidden: true
    },
    encryptingHostKey: {
        type: OptionType.STRING,
        description: "Encrypting.host APIキー",
        default: "",
        hidden: true
    },
    encryptingHostUrlStyle: {
        type: OptionType.SELECT,
        description: "Encrypting.host URLスタイル",
        options: encryptingHostUrlStyleOptions,
        default: "query",
        hidden: true
    },
    encryptingHostDomains: {
        type: OptionType.STRING,
        description: "Encrypting.host ドメインJSONリスト",
        default: "[\"offensive\"]",
        hidden: true
    },
    encryptingHostTitle: {
        type: OptionType.STRING,
        description: "任意のEncrypting.host埋め込みタイトル",
        default: "",
        hidden: true
    },
    encryptingHostColor: {
        type: OptionType.STRING,
        description: "任意のEncrypting.host埋め込みカラー",
        default: "",
        hidden: true
    },
    encryptingHostFakelink: {
        type: OptionType.STRING,
        description: "任意のEncrypting.host偽リンク",
        default: "",
        hidden: true
    },
    s3Endpoint: {
        type: OptionType.STRING,
        description: "S3互換エンドポイントURL",
        default: "",
        hidden: true
    },
    s3Bucket: {
        type: OptionType.STRING,
        description: "S3バケット名",
        default: "",
        hidden: true
    },
    s3Region: {
        type: OptionType.STRING,
        description: "S3リージョン（R2では auto を使用）",
        default: "auto",
        hidden: true
    },
    s3AccessKeyId: {
        type: OptionType.STRING,
        description: "S3アクセスキーID",
        default: "",
        hidden: true
    },
    s3SecretAccessKey: {
        type: OptionType.STRING,
        description: "S3シークレットアクセスキー",
        default: "",
        hidden: true
    },
    s3SessionToken: {
        type: OptionType.STRING,
        description: "任意のS3セッショントークン",
        default: "",
        hidden: true
    },
    s3PublicUrl: {
        type: OptionType.STRING,
        description: "任意の公開ベースURL",
        default: "",
        hidden: true
    },
    s3Prefix: {
        type: OptionType.STRING,
        description: "任意のS3オブジェクトキープレフィックス",
        default: "",
        hidden: true
    },
    s3ForcePathStyle: {
        type: OptionType.BOOLEAN,
        description: "パス形式のS3 URLを使用します",
        default: true,
        hidden: true
    },
    litterboxExpiry: {
        type: OptionType.SELECT,
        description: "Litterboxの保持期間",
        options: litterboxOptions,
        default: "24h",
        hidden: true
    },
    catboxUserhash: {
        type: OptionType.STRING,
        description: "アカウント連携用のCatbox userhash",
        default: "",
        hidden: true
    },
    sharexConfig: {
        type: OptionType.STRING,
        description: "ShareXカスタムアップローダーJSON",
        default: "",
        hidden: true
    },
    disableFallbacks: {
        type: OptionType.BOOLEAN,
        description: "フォールバックのアップロードサービスを無効化します",
        default: false,
        hidden: true
    },
    autoSend: {
        type: OptionType.BOOLEAN,
        description: "アップロードしたURLをチャット入力に挿入します",
        default: false,
        hidden: true
    },
    autoFormat: {
        type: OptionType.BOOLEAN,
        description: "挿入したURLを山かっこで囲みます",
        default: false,
        hidden: true
    },
    bypassDiscordUpload: {
        type: OptionType.BOOLEAN,
        description: "Discordのアップロードを使わず、代わりにFileUploadを使用します。",
        default: true,
        hidden: true
    },
    bypassDiscordUploadOnlyOverLimit: {
        type: OptionType.BOOLEAN,
        description: "ファイルがサイズ上限を超えた場合だけFileUploadを使用します。",
        default: true,
        hidden: true
    },
    customDiscordFileSizeLimitMB: {
        type: OptionType.NUMBER,
        description: "Discordのファイルサイズ上限を手動指定（MB）。0は自動検出です。",
        default: 0,
        hidden: true
    },
    gofileToken: {
        type: OptionType.STRING,
        description: "任意のGoFile APIトークン",
        default: "",
        hidden: true
    },
    fallbackOrder: {
        type: OptionType.STRING,
        description: "フォールバックアップローダーの順序",
        default: defaultFallbackOrder,
        hidden: true
    },
    pixelVaultKey: {
        type: OptionType.STRING,
        description: "PixelVaultアップロードキー",
        default: "",
        hidden: true
    },
    pixelDrainKey: {
        type: OptionType.STRING,
        description: "任意のPixelDrain APIキー",
        default: "",
        hidden: true
    },
    uploadTimeoutMs: {
        type: OptionType.NUMBER,
        description: "アップロードのタイムアウト（ミリ秒）",
        default: 300000,
        hidden: true
    },
    stripQueryParams: {
        type: OptionType.BOOLEAN,
        description: "アップロードしたURLからクエリパラメータを取り除きます",
        default: false,
        hidden: true
    },
    embedProxyEnabled: {
        type: OptionType.BOOLEAN,
        description: "アップロードした動画リンクを埋め込みヘルパーサービス経由にします。",
        default: false,
        hidden: true
    },
    embedProxyService: {
        type: OptionType.SELECT,
        description: "アップロードした動画リンクをラップする埋め込みヘルパーサービス。",
        options: embedProxyOptions,
        default: "nfp",
        hidden: true
    },
    corsProxyUrl: {
        type: OptionType.STRING,
        description: "ブラウザアップロードに使う任意のCORSプロキシURL",
        default: "",
        hidden: true
    },
    apngToGif: {
        type: OptionType.BOOLEAN,
        description: "APNGのアップロードをGIFに変換します",
        default: false,
        hidden: true
    },
    preserveOriginalFilename: {
        type: OptionType.BOOLEAN,
        description: "アップロード時に元のファイル名を保持します。",
        default: true,
        hidden: true
    },
    autoCopy: {
        type: OptionType.BOOLEAN,
        description: "アップロードURLを自動でコピーします",
        default: true,
        hidden: true
    },
    autoUploadPastedFiles: {
        type: OptionType.BOOLEAN,
        description: "チャット入力に貼り付けたとき、クリップボードのファイルを画像ホストへ自動でアップロードします。",
        default: false
    },
    webdavUrl: {
        type: OptionType.STRING,
        description: "WebDAVサーバーURL",
        default: "",
        hidden: true
    },
    webdavUsername: {
        type: OptionType.STRING,
        description: "WebDAVユーザー名",
        default: "",
        hidden: true
    },
    webdavPassword: {
        type: OptionType.STRING,
        description: "WebDAVパスワードまたはアプリトークン",
        default: "",
        hidden: true
    },
    webdavDirectory: {
        type: OptionType.STRING,
        description: "WebDAVサーバー上の任意のサブディレクトリ",
        default: "",
        hidden: true
    },
    webdavServerType: {
        type: OptionType.SELECT,
        description: "WebDAVサーバーの種類",
        options: [
            { label: "Nextcloud", value: "nextcloud", default: true },
            { label: "ownCloud", value: "owncloud" },
            { label: "汎用 WebDAV", value: "generic" }
        ],
        default: "nextcloud",
        hidden: true
    },
    webdavShareType: {
        type: OptionType.SELECT,
        description: "WebDAV共有リンクの形式",
        options: [
            { label: "共有ページ", value: "share-page", default: true },
            { label: "直接ダウンロード", value: "direct-download" },
            { label: "Markdownリンク", value: "markdown" }
        ],
        default: "share-page",
        hidden: true
    },
    uploadAllowedFileTypes: {
        type: OptionType.STRING,
        description: "許可するファイル拡張子のカンマ区切りリスト（例: png,jpg,gif,mp4）。空欄にするとすべてのファイルを許可します。",
        default: "",
        hidden: true
    },
    settingsComponent: {
        type: OptionType.COMPONENT,
        description: "設定",
        component: SettingsComponent
    }
});

function SettingTextInput(props: {
    description: string;
    name: string;
    onChange: (value: string) => void;
    placeholder: string;
    value: string;
}) {
    const { description, name, onChange, placeholder, value } = props;

    return (
        <SettingsSection id={name} name={name} description={description ?? ""}>
            <TextInput
                value={value}
                onChange={onChange}
                placeholder={placeholder}
            />
        </SettingsSection>
    );
}

function SettingGroup(props: {
    children: React.ReactNode;
    description?: string;
    name: string;
}) {
    const { children, description, name } = props;

    return (
        <SettingsSection id={name} name={name} description={description ?? ""}>
            <div className={cl("group")}>
                {children}
            </div>
        </SettingsSection>
    );
}

function SettingSwitch(props: {
    checked: boolean;
    description: string;
    name: string;
    onChange: (value: boolean) => void;
}) {
    const { checked, description, name, onChange } = props;

    return (
        <SettingsSection id={name} tag="label" name={name} description={description} inlineSetting>
            <Switch checked={checked} onChange={onChange} />
        </SettingsSection>
    );
}

function ServicePicker(props: {
    onChange: (service: ServiceType) => void;
    value: ServiceType;
}) {
    const { onChange, value } = props;

    return (
        <div className={cl("service-grid")}>
            {serviceOptions.map(option => (
                <button
                    key={option.value}
                    type="button"
                    className={cl("service-option")}
                    data-selected={option.value === value}
                    onClick={() => onChange(option.value)}
                >
                    <span className={cl("service-option-label")}>{option.label}</span>
                </button>
            ))}
        </div>
    );
}

function FallbackOrderSettings() {
    const update = useForceUpdater();
    const [dragIndex, setDragIndex] = React.useState<number | null>(null);
    const [order, setOrder] = React.useState<ServiceType[]>(() => {
        const configured = (settings.store.fallbackOrder || defaultFallbackOrder)
            .split(/[\n,]/)
            .map(entry => entry.trim())
            .filter((entry): entry is ServiceType => Object.values(ServiceType).includes(entry as ServiceType));

        return configured.length === fallbackServiceOrder.length && new Set(configured).size === fallbackServiceOrder.length
            ? configured
            : fallbackServiceOrder;
    });

    const commitOrder = (nextOrder: ServiceType[]) => {
        setOrder(nextOrder);
        settings.store.fallbackOrder = nextOrder.join(",");
        update();
    };

    return (
        <SettingsSection id="fallback-order" name="フォールバック順序" description="ホストをドラッグしてフォールバックの順序を変更します。選択したホストが最初に試され、次にこの順序が使われます。">
            <div className={cl("fallback-order-list")}>
                {order.map((service, index) => (
                    <div
                        key={service}
                        className={cl("fallback-order-item")}
                        draggable
                        onDragStart={event => {
                            setDragIndex(index);
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/plain", String(index));
                        }}
                        onDragOver={event => event.preventDefault()}
                        onDrop={event => {
                            event.preventDefault();
                            const sourceIndex = dragIndex ?? Number(event.dataTransfer.getData("text/plain"));
                            if (!Number.isInteger(sourceIndex) || sourceIndex === index || sourceIndex < 0 || sourceIndex >= order.length) {
                                setDragIndex(null);
                                return;
                            }

                            const nextOrder = [...order];
                            const [moved] = nextOrder.splice(sourceIndex, 1);
                            nextOrder.splice(index, 0, moved);
                            setDragIndex(null);
                            commitOrder(nextOrder);
                        }}
                        onDragEnd={() => setDragIndex(null)}
                        data-dragging={dragIndex === index}
                    >
                        <span className={cl("fallback-order-label")}>{serviceLabels[service]}</span>
                        <span className={cl("fallback-order-handle")}>ドラッグ</span>
                    </div>
                ))}
            </div>
            <div className={cl("fallback-order-actions")}>
                <Button size="small" onClick={() => commitOrder(fallbackServiceOrder)}>
                    デフォルトに戻す
                </Button>
            </div>
        </SettingsSection>
    );
}

function getShareXRequestUrl(config: string) {
    try {
        return parseShareXConfig(config).RequestURL;
    } catch {
        return undefined;
    }
}

function AllowHostNotice({ url }: { url?: string; }) {
    const [isAllowed, allow] = useCspPermission(url, ["connect-src"], "FileUpload");
    if (isAllowed || !url) return null;

    return (
        <Notice variant="warning" action={<Button size="small" variant="secondary" onClick={allow}>ホストを許可</Button>}>
            {URL.parse(url)?.host} への接続はブロックされています。信頼できる場合のみこのホストを許可し、Discordを再起動してください。
        </Notice>
    );
}

export function SettingsComponent() {
    const update = useForceUpdater();
    const sharexFileInputRef = React.useRef<HTMLInputElement>(null);
    const { serviceType } = settings.store;
    const { serviceUrl, sharexConfig, corsProxyUrl } = settings.use(["serviceUrl", "sharexConfig", "corsProxyUrl"]);

    const validateShareXConfig = () => {
        try {
            parseShareXConfig(settings.store.sharexConfig || "");
            showToast({ text: "ShareX設定は有効です", variant: "success" });
        } catch (error) {
            const message = error instanceof Error ? error.message : "Invalid ShareX config";
            showToast({ text: message, variant: "critical" });
        }
    };

    const triggerShareXFileUpload = () => {
        sharexFileInputRef.current?.click();
    };

    const handleShareXFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            try {
                const content = String(e.target?.result || "");
                const parsed = parseShareXConfig(content);
                settings.store.sharexConfig = JSON.stringify(parsed, null, 2);
                update();
                showToast({ text: "ShareX設定をインポートしました", variant: "success" });
            } catch (error) {
                const message = error instanceof Error ? error.message : "Failed to import ShareX config";
                showToast({ text: message, variant: "critical" });
            }
        };
        reader.readAsText(file);
        event.target.value = "";
    };

    return (
        <>
            <SettingsSection id="upload-service" name="アップロードサービス" description="FileUploadが新しいファイルを送信する場所を選択します。">
                <ServicePicker
                    value={settings.store.serviceType as ServiceType}
                    onChange={service => {
                        settings.store.serviceType = service;
                        update();
                    }}
                />
            </SettingsSection>

            {serviceType === ServiceType.ZIPLINE && (
                <SettingGroup name="Zipline" description="Ziplineインスタンスの接続情報。">
                    <SettingTextInput
                        name="サービスURL"
                        description="ZiplineインスタンスのURL"
                        value={settings.store.serviceUrl}
                        onChange={v => settings.store.serviceUrl = v}
                        placeholder="https://your-zipline-instance.com"
                    />
                    <AllowHostNotice url={serviceUrl} />
                    <SettingTextInput
                        name="Ziplineトークン"
                        description="あなたのZipline API認証トークン"
                        value={settings.store.ziplineToken}
                        onChange={v => settings.store.ziplineToken = v}
                        placeholder="あなたのZipline APIトークン"
                    />
                    <SettingTextInput
                        name="フォルダーID"
                        description="アップロード先のフォルダーID（フォルダーなしの場合は空欄）"
                        value={settings.store.folderId}
                        onChange={v => settings.store.folderId = v}
                        placeholder="フォルダーなしの場合は空欄"
                    />
                </SettingGroup>
            )}

            {serviceType === ServiceType.EZHOST && (
                <SettingGroup name="E-Z Host" description="E-Z Hostアップロードの接続情報。">
                    <SettingTextInput
                        name="E-Z Host APIキー"
                        description="あなたのE-Z Host APIキー"
                        value={settings.store.ezHostKey}
                        onChange={v => settings.store.ezHostKey = v}
                        placeholder="あなたのE-Z Host APIキー"
                    />
                </SettingGroup>
            )}

            {serviceType === ServiceType.NEST && (
                <SettingGroup name="Nest" description="Nestアップロードの接続情報。">
                    <SettingTextInput
                        name="Nestトークン"
                        description="あなたのNest API認証トークン"
                        value={settings.store.nestToken}
                        onChange={v => settings.store.nestToken = v}
                        placeholder="あなたのNest APIトークン"
                    />
                </SettingGroup>
            )}

            {serviceType === ServiceType.ENCRYPTINGHOST && (
                <SettingGroup name="Encrypting.host" description="Encrypting.hostアップロードの接続情報。">
                    <SettingTextInput
                        name="Encrypting.host APIキー"
                        description="あなたのEncrypting.host APIキー"
                        value={(settings.store as { encryptingHostKey?: string; }).encryptingHostKey || ""}
                        onChange={v => (settings.store as { encryptingHostKey?: string; }).encryptingHostKey = v}
                        placeholder="あなたのEncrypting.host APIキー"
                    />
                    <SettingsSection id="url-style" name="URLスタイル" description="Encrypting.hostが返すリンクの形式。">
                        <Select
                            options={encryptingHostUrlStyleOptions}
                            isSelected={v => v === (settings.store as { encryptingHostUrlStyle?: string; }).encryptingHostUrlStyle}
                            select={v => {
                                (settings.store as { encryptingHostUrlStyle?: string; }).encryptingHostUrlStyle = v;
                                update();
                            }}
                            serialize={v => v}
                            placeholder="URLスタイルを選択"
                        />
                    </SettingsSection>
                    <SettingsSection id="domains-json" name="ドメインJSON" description={"JSON array of domains to use, for example [\"offensive\"]."}>
                        <TextArea
                            value={(settings.store as { encryptingHostDomains?: string; }).encryptingHostDomains || ""}
                            rows={3}
                            placeholder='["offensive"]'
                            onChange={v => (settings.store as { encryptingHostDomains?: string; }).encryptingHostDomains = v}
                        />
                    </SettingsSection>
                    <SettingTextInput
                        name="埋め込みタイトル"
                        description="埋め込みスタイルのレスポンス用の任意のタイトル。"
                        value={(settings.store as { encryptingHostTitle?: string; }).encryptingHostTitle || ""}
                        onChange={v => (settings.store as { encryptingHostTitle?: string; }).encryptingHostTitle = v}
                        placeholder="任意のタイトル"
                    />
                    <SettingTextInput
                        name="埋め込みカラー"
                        description="埋め込みスタイルのレスポンス用の任意の色。"
                        value={(settings.store as { encryptingHostColor?: string; }).encryptingHostColor || ""}
                        onChange={v => (settings.store as { encryptingHostColor?: string; }).encryptingHostColor = v}
                        placeholder="任意の色"
                    />
                    <SettingTextInput
                        name="偽リンク"
                        description="偽リンクスタイルのレスポンス用の任意の偽リンク値。"
                        value={(settings.store as { encryptingHostFakelink?: string; }).encryptingHostFakelink || ""}
                        onChange={v => (settings.store as { encryptingHostFakelink?: string; }).encryptingHostFakelink = v}
                        placeholder="任意の偽リンク"
                    />
                </SettingGroup>
            )}

            {serviceType === ServiceType.S3 && (
                <SettingGroup name="S3互換ストレージ" description="バケットの接続情報とオブジェクト名の設定。">
                    <SettingTextInput
                        name="S3エンドポイントURL"
                        description="S3互換エンドポイント（例: https://<accountid>.r2.cloudflarestorage.com）"
                        value={settings.store.s3Endpoint}
                        onChange={v => settings.store.s3Endpoint = v}
                        placeholder="https://your-endpoint.example.com"
                    />
                    <SettingTextInput
                        name="バケット名"
                        description="アップロード先のバケット"
                        value={settings.store.s3Bucket}
                        onChange={v => settings.store.s3Bucket = v}
                        placeholder="my-bucket"
                    />
                    <SettingTextInput
                        name="リージョン"
                        description="AWSリージョン、またはCloudflare R2の場合は auto"
                        value={settings.store.s3Region}
                        onChange={v => settings.store.s3Region = v}
                        placeholder="auto"
                    />
                    <SettingTextInput
                        name="アクセスキーID"
                        description="S3互換アクセスキー"
                        value={settings.store.s3AccessKeyId}
                        onChange={v => settings.store.s3AccessKeyId = v}
                        placeholder="あなたのアクセスキーID"
                    />
                    <SettingTextInput
                        name="シークレットアクセスキー"
                        description="S3互換シークレットキー"
                        value={settings.store.s3SecretAccessKey}
                        onChange={v => settings.store.s3SecretAccessKey = v}
                        placeholder="あなたのシークレットアクセスキー"
                    />
                    <SettingTextInput
                        name="セッショントークン"
                        description="任意の一時認証トークン"
                        value={settings.store.s3SessionToken}
                        onChange={v => settings.store.s3SessionToken = v}
                        placeholder="任意のセッショントークン"
                    />
                    <SettingTextInput
                        name="公開ベースURL"
                        description="返すリンクに使用する任意の公開URLベース"
                        value={settings.store.s3PublicUrl}
                        onChange={v => settings.store.s3PublicUrl = v}
                        placeholder="https://cdn.example.com"
                    />
                    <SettingTextInput
                        name="オブジェクトキープレフィックス"
                        description="バケット内の任意のフォルダー／プレフィックス"
                        value={settings.store.s3Prefix}
                        onChange={v => settings.store.s3Prefix = v}
                        placeholder="uploads/discord"
                    />
                    <SettingSwitch
                        name="パススタイルのエンドポイントを使用"
                        description="endpoint/bucket/key 形式を使用します（R2で推奨）。"
                        checked={settings.store.s3ForcePathStyle}
                        onChange={v => settings.store.s3ForcePathStyle = v}
                    />
                </SettingGroup>
            )}

            {serviceType === ServiceType.CATBOX && (
                <SettingGroup name="Catbox" description="Catboxアップロード用の任意のアカウント連携。">
                    <SettingTextInput
                        name="Catboxユーザーハッシュ"
                        description="アカウント連携用のCatboxユーザーハッシュ。匿名アップロードの場合は空欄にしてください。"
                        value={settings.store.catboxUserhash}
                        onChange={v => settings.store.catboxUserhash = v}
                        placeholder="あなたのCatboxユーザーハッシュ"
                    />
                </SettingGroup>
            )}

            {serviceType === ServiceType.LITTERBOX && (
                <SettingsSection id="litterbox-expiry" name="Litterboxの有効期限" description="アップロードが保持される期間">
                    <Select
                        options={litterboxOptions}
                        isSelected={v => v === settings.store.litterboxExpiry}
                        select={v => {
                            settings.store.litterboxExpiry = v;
                            update();
                        }}
                        serialize={v => v}
                        placeholder="有効期限を選択"
                    />
                </SettingsSection>
            )}

            {serviceType === ServiceType.GOFILE && (
                <SettingGroup name="GoFile" description="GoFileアップロード用の任意のアカウント連携。">
                    <SettingTextInput
                        name="GoFileトークン"
                        description="アカウントにアップロードするための任意のGoFileトークン。"
                        value={settings.store.gofileToken}
                        onChange={v => settings.store.gofileToken = v}
                        placeholder="任意のGoFileトークン"
                    />
                </SettingGroup>
            )}

            {serviceType === ServiceType.PIXELVAULT && (
                <SettingGroup name="PixelVault" description="PixelVaultアップロードの接続情報。">
                    <SettingTextInput
                        name="PixelVaultアップロードキー"
                        description="あなたのPixelVault認証キー。"
                        value={settings.store.pixelVaultKey}
                        onChange={v => settings.store.pixelVaultKey = v}
                        placeholder="あなたのPixelVaultアップロードキー"
                    />
                </SettingGroup>
            )}

            {serviceType === ServiceType.PIXELDRAIN && (
                <SettingGroup name="PixelDrain" description="PixelDrainアップロード用の任意のアカウント連携。">
                    <SettingTextInput
                        name="PixelDrain APIキー"
                        description="認証付きアップロード用の任意のPixelDrain APIキー。匿名アップロードの場合は空欄にしてください。"
                        value={settings.store.pixelDrainKey}
                        onChange={v => settings.store.pixelDrainKey = v}
                        placeholder="あなたのPixelDrain APIキー"
                    />
                </SettingGroup>
            )}

            {serviceType === ServiceType.SHAREX && (
                <SettingGroup name="ShareX Custom Uploader" description="ShareXカスタムアップローダーの設定を貼り付け、インポート、または検証します。">
                    <SettingsSection
                        id="sharex-custom-uploader-config"
                        name="ShareXカスタムアップローダー設定"
                        description="ShareXカスタムアップローダーのJSON（.sxcu/.json）を貼り付けてください。DestinationType には FileUploader または ImageUploader を含める必要があります。"
                    >
                        <TextArea
                            value={settings.store.sharexConfig}
                            rows={10}
                            placeholder='{"RequestMethod":"POST","RequestURL":"https://example.com/api/upload","Body":"MultipartFormData"}'
                            onChange={v => settings.store.sharexConfig = v}
                        />
                    </SettingsSection>
                    <SettingsSection id="sharex-config-actions" name="ShareX設定アクション" description="ファイルからインポート、または貼り付けた設定を検証">
                        <div className={cl("actions")}>
                            <Button size="small" onClick={triggerShareXFileUpload}>.sxcu/.jsonをインポート</Button>
                            <Button size="small" onClick={validateShareXConfig}>検証</Button>
                        </div>
                        <input
                            ref={sharexFileInputRef}
                            type="file"
                            accept=".sxcu,.json,application/json,text/plain"
                            style={{ display: "none" }}
                            onChange={handleShareXFileUpload}
                        />
                    </SettingsSection>
                    <AllowHostNotice url={getShareXRequestUrl(sharexConfig || "")} />
                </SettingGroup>
            )}

            {serviceType === ServiceType.WEBDAV && (
                <SettingGroup name="WebDAV" description="WebDAVサーバー（Nextcloud、ownCloudなど）の接続情報。">
                    <SettingTextInput
                        name="サーバーURL"
                        description="WebDAVのベースURL（例: https://nextcloud.example.com/remote.php/dav/files/username）"
                        value={settings.store.webdavUrl}
                        onChange={v => settings.store.webdavUrl = v}
                        placeholder="https://nextcloud.example.com/remote.php/dav/files/username"
                    />
                    <SettingTextInput
                        name="ユーザー名"
                        description="WebDAVのユーザー名"
                        value={settings.store.webdavUsername}
                        onChange={v => settings.store.webdavUsername = v}
                        placeholder="username"
                    />
                    <SettingTextInput
                        name="パスワードまたはアプリトークン"
                        description="WebDAVのパスワードまたはアプリトークン"
                        value={settings.store.webdavPassword}
                        onChange={v => settings.store.webdavPassword = v}
                        placeholder="パスワードまたはアプリトークン"
                    />
                    <SettingTextInput
                        name="アップロードディレクトリ"
                        description="サーバー上のアップロード先の任意のサブディレクトリ（例: uploads）"
                        value={settings.store.webdavDirectory}
                        onChange={v => settings.store.webdavDirectory = v}
                        placeholder="ルートディレクトリの場合は空欄"
                    />
                    <SettingsSection id="server-type" name="サーバーの種類" description="WebDAVサーバーの種類を選択します。NextcloudとownCloudでは公開共有リンクが作成されます。汎用では生のファイルURLが返されます。">
                        <Select
                            options={[
                                { label: "Nextcloud", value: "nextcloud", default: true },
                                { label: "ownCloud", value: "owncloud" },
                                { label: "汎用WebDAV", value: "generic" }
                            ]}
                            isSelected={v => v === settings.store.webdavServerType}
                            select={v => {
                                settings.store.webdavServerType = v;
                                update();
                            }}
                            serialize={v => v}
                            placeholder="サーバーの種類を選択"
                        />
                    </SettingsSection>
                    {settings.store.webdavServerType !== "generic" && (
                        <SettingsSection id="share-link-format" name="共有リンクの形式" description="公開共有リンクの返し方。共有ページはWebページへのリンク、直接ダウンロードはファイルへの直接リンク、Markdownリンクは共有ページをクリック可能なファイル名で囲みます。">
                            <Select
                                options={[
                                    { label: "共有ページ", value: "share-page", default: true },
                                    { label: "直接ダウンロード", value: "direct-download" },
                                    { label: "Markdownリンク", value: "markdown" }
                                ]}
                                isSelected={v => v === settings.store.webdavShareType}
                                select={v => {
                                    settings.store.webdavShareType = v;
                                    update();
                                }}
                                serialize={v => v}
                                placeholder="共有リンクの形式を選択"
                            />
                        </SettingsSection>
                    )}
                </SettingGroup>
            )}

            <SettingGroup name="アップロード時の動作" description="ホストがURLを返した後にFileUploadが行う動作を制御します。">
                <SettingSwitch
                    name="クエリパラメータを除去"
                    description="アップロードされたファイルURLからクエリパラメータを除去します。"
                    checked={settings.store.stripQueryParams}
                    onChange={v => settings.store.stripQueryParams = v}
                />

                <SettingSwitch
                    name="埋め込みプロキシを使用"
                    description="Discordでのプレビューを改善するため、アップロードした動画リンクを埋め込みプロキシサービスでラップします。"
                    checked={settings.store.embedProxyEnabled}
                    onChange={v => {
                        settings.store.embedProxyEnabled = v;
                        update();
                    }}
                />

                {settings.store.embedProxyEnabled && (
                    <SettingsSection id="embed-proxy-service" name="埋め込みプロキシサービス" description="アップロードした動画リンクに使用する埋め込みプロキシサービスを選択します">
                        <Select
                            options={embedProxyOptions}
                            isSelected={v => v === settings.store.embedProxyService}
                            select={v => {
                                settings.store.embedProxyService = v;
                                update();
                            }}
                            serialize={v => v}
                            placeholder="埋め込みプロキシサービスを選択"
                        />
                    </SettingsSection>
                )}

                <SettingSwitch
                    name="APNGをGIFに変換"
                    description="APNGファイルをGIF形式に変換します。"
                    checked={settings.store.apngToGif}
                    onChange={v => settings.store.apngToGif = v}
                />

                <SettingSwitch
                    name="元のファイル名を保持"
                    description="アップロード名を upload.ext とせず、元のファイル名を使用します。"
                    checked={Boolean((settings.store as { preserveOriginalFilename?: boolean; }).preserveOriginalFilename)}
                    onChange={v => (settings.store as { preserveOriginalFilename?: boolean; }).preserveOriginalFilename = v}
                />

                <SettingSwitch
                    name="URLを自動コピー"
                    description="アップロードしたファイルのURLをクリップボードに自動でコピーします。"
                    checked={settings.store.autoCopy}
                    onChange={v => settings.store.autoCopy = v}
                />

                <SettingSwitch
                    name="フォールバックアップローダーを無効化"
                    description="フォールバックホストを試さず、選択したアップローダーのみを使用します。"
                    checked={settings.store.disableFallbacks}
                    onChange={v => settings.store.disableFallbacks = v}
                />

                <SettingSwitch
                    name="URLをチャット入力に挿入"
                    description="アップロード後、生成されたURLを現在のチャット入力に挿入します。"
                    checked={settings.store.autoSend}
                    onChange={v => settings.store.autoSend = v}
                />

                <SettingSwitch
                    name="挿入するURLを整形"
                    description="Discordのプレビュー埋め込みを避けるため、挿入するURLを山括弧で囲みます。"
                    checked={settings.store.autoFormat}
                    onChange={v => settings.store.autoFormat = v}
                />
            </SettingGroup>

            <SettingGroup name="Discord連携" description="FileUploadがDiscordのファイル処理を引き継ぐタイミングを選択します。">
                <SettingSwitch
                    name="Discordのアップロードボタンをバイパス"
                    description="Discordのファイルピッカーからアップロードする際にFileUploadを使用します。"
                    checked={Boolean((settings.store as { bypassDiscordUpload?: boolean; }).bypassDiscordUpload)}
                    onChange={v => (settings.store as { bypassDiscordUpload?: boolean; }).bypassDiscordUpload = v}
                />

                <SettingSwitch
                    name="貼り付けたファイルを自動アップロード"
                    description="チャット入力に貼り付けたとき、クリップボードのファイルを画像ホストに自動でアップロードします。"
                    checked={settings.store.autoUploadPastedFiles}
                    onChange={v => settings.store.autoUploadPastedFiles = v}
                />

                <SettingSwitch
                    name="Discordのファイルサイズ制限を尊重"
                    description="現在のDiscordアップロード上限より大きいファイルにのみFileUploadを使用します。"
                    checked={settings.store.bypassDiscordUploadOnlyOverLimit}
                    onChange={v => settings.store.bypassDiscordUploadOnlyOverLimit = v}
                />

                <SettingTextInput
                    name="Discord上限の上書き（MB）"
                    description="MB単位の手動のDiscordファイルサイズ上限。自動検出が正しくない場合に使用します。自動の場合は空欄にしてください。"
                    value={settings.store.customDiscordFileSizeLimitMB > 0 ? String(settings.store.customDiscordFileSizeLimitMB) : ""}
                    onChange={v => settings.store.customDiscordFileSizeLimitMB = v.trim() === "" ? 0 : Number(v)}
                    placeholder="自動"
                />

                <SettingTextInput
                    name="許可するファイル形式"
                    description="拡張子のカンマ区切りリスト（例: png,jpg,gif）。すべて許可する場合は空欄にしてください。"
                    value={settings.store.uploadAllowedFileTypes}
                    onChange={v => settings.store.uploadAllowedFileTypes = v}
                    placeholder="png,jpg,gif,mp4,webp"
                />
            </SettingGroup>

            <SettingGroup name="ネットワーク" description="ブラウザアップロードのプロキシとタイムアウトを設定します。">
                <SettingTextInput
                    name="CORSプロキシURL"
                    description="デスクトップアプリを経由できないアップロード用の任意のCORSプロキシ。プロキシは経由するすべてのファイルとトークンを見ることができるため、信頼できるものだけを使用してください。直接アップロードする場合は空欄にしてください。"
                    value={settings.store.corsProxyUrl || ""}
                    onChange={v => settings.store.corsProxyUrl = v}
                    placeholder="https://your-cors-proxy.example.com"
                />
                <AllowHostNotice url={corsProxyUrl} />

                <SettingsSection id="upload-timeout" name="アップロードタイムアウト" description="フォールバックに切り替える前に1回のアップロード試行で待つ最大時間">
                    <Select
                        options={[
                            { label: "30秒", value: 30000 },
                            { label: "1分", value: 60000 },
                            { label: "2分", value: 120000 },
                            { label: "5分", value: 300000, default: true },
                            { label: "10分", value: 600000 }
                        ]}
                        isSelected={v => v === (settings.store.uploadTimeoutMs || 300000)}
                        select={v => {
                            settings.store.uploadTimeoutMs = v;
                            update();
                        }}
                        serialize={v => v}
                        placeholder="タイムアウトを選択"
                    />
                </SettingsSection>

                {Native && (
                    <SettingsSection id="approved-servers" name="承認済みサーバー" description="FileUploadのアップロードを許可したS3およびWebDAVサーバー。リセットすると次回のアップロードで再度確認されます。">
                        <Button
                            size="small"
                            onClick={async () => {
                                await Native.clearApprovedOrigins();
                                showToast({ text: "承認済みサーバーをリセットしました" });
                            }}
                        >
                            承認済みサーバーをリセット
                        </Button>
                    </SettingsSection>
                )}
            </SettingGroup>

            <FallbackOrderSettings />
        </>
    );
}
