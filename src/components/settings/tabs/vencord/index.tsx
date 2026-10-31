/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./VencordTab.css";

import { openNotificationLogModal } from "@api/Notifications/notificationLog";
import { useSettings } from "@api/Settings";
import { Button } from "@components/Button";
import { Divider } from "@components/Divider";
import { FormSwitch } from "@components/FormSwitch";
import { Heading } from "@components/Heading";
import { FolderIcon, GithubIcon, LogIcon, PaintbrushIcon, RestartIcon } from "@components/Icons";
import { Notice } from "@components/Notice";
import { Paragraph } from "@components/Paragraph";
import { openContributorModal, openPluginModal, SettingsTab, wrapTab } from "@components/settings";
import { QuickAction, QuickActionCard } from "@components/settings/QuickAction";
import { SpecialCard } from "@components/settings/SpecialCard";
import BadgeAPI from "@plugins/_api/badges";
import NoTrack from "@plugins/_core/noTrack";
import SettingsPlugin from "@plugins/_core/settings";
import { gitRemote } from "@shared/vencordUserAgent";
import { DONOR_ROLE_ID, GUILD_ID, IS_WINDOWS, VC_DONOR_ROLE_ID, VC_GUILD_ID } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import { Margins } from "@utils/margins";
import { isAnyPluginDev } from "@utils/misc";
import { relaunch } from "@utils/native";
import { promptToRestart } from "@utils/promptToRestart";
import { GuildMemberStore, React, useMemo, UserStore } from "@webpack/common";

import { DonateButtonComponent } from "./DonateButton";
import { MacOSVibrancySettings } from "./MacVibrancySettings";
import { NotificationSection } from "./NotificationSettings";
import { WindowsMaterialSettings } from "./WindowsMaterialSettings";

const DEFAULT_DONATE_IMAGE = "https://cdn.discordapp.com/emojis/1026533090627174460.png";
const SHIGGY_DONATE_IMAGE = "https://equicord.org/assets/favicon.png";

const VENNIE_DONATOR_IMAGE = "https://cdn.discordapp.com/emojis/1238120638020063377.png";
const COZY_CONTRIB_IMAGE = "https://cdn.discordapp.com/emojis/1026533070955872337.png";

const DONOR_BACKGROUND_IMAGE = "https://media.discordapp.net/stickers/1311070116305436712.png?size=2048";
const CONTRIB_BACKGROUND_IMAGE = "https://media.discordapp.net/stickers/1311070166481895484.png?size=2048";

const cl = classNameFactory("vc-vencord-tab-");

type KeysOfType<Object, Type> = {
    [K in keyof Object]: Object[K] extends Type ? K : never;
}[keyof Object];

function Switches() {
    const settings = useSettings(["useQuickCss", "enableReactDevtools", "mainWindowFrameless", "frameless", "nativeTitleBar", "noRoundCorners", "transparent", "winCtrlQ", "disableMinSize"]);
    const { disableAnalytics } = NoTrack.settings.use(["disableAnalytics"]);

    const Switches = [
        {
            key: "useQuickCss",
            title: "カスタムCSSを有効にする",
            description: "設定した QuickCSS を適用します"
        },
        {
            value: disableAnalytics,
            updateSetting(newValue) {
                NoTrack.settings.store.disableAnalytics = newValue;
            },
            reactKey: "NoTrack::disableAnalytics",
            key: null!,
            title: "Discord のアナリティクスをブロック",
            description: NoTrack.settings.def.disableAnalytics.description,
            restartRequired: NoTrack.settings.def.disableAnalytics.restartNeeded,
        },
        (!IS_WEB && !IS_DISCORD_DESKTOP || !IS_WINDOWS) && {
            key: "mainWindowFrameless",
            title: "メインウィンドウのフレームを無効にする",
            description: "ネイティブのウィンドウフレームを取り除いて、すっきりした見た目にします。タイトルバーの部分をドラッグすればウィンドウは移動できます。",
            restartRequired: true,
        },
        !IS_WEB && (!IS_DISCORD_DESKTOP || !IS_WINDOWS
            ? {
                key: "frameless",
                title: "すべてのウィンドウフレームを無効にする",
                description: "ネイティブのウィンドウフレームを取り除いて、すっきりした見た目にします。タイトルバーの部分をドラッグすればウィンドウは移動できます。",
                restartRequired: true,
            }
            : {
                key: "nativeTitleBar",
                title: "Discord のカスタムタイトルバーの代わりに Windows 標準のタイトルバーを使う",
                description: "Discord のカスタムタイトルバーを Windows 標準のタイトルバーに置き換えます。一部のウィンドウ管理ツールとの相性が良くなる場合があります。",
                restartRequired: true,
            }
        ),
        IS_DISCORD_DESKTOP && {
            key: "noRoundCorners",
            title: "ウィンドウの角丸を無効にする",
            description: "Discord ウィンドウの角を、丸ではなく四角にします。",
            restartRequired: true
        },
        !IS_WEB && {
            key: "transparent",
            title: "ウィンドウの透明化を有効にする",
            description: "Discord ウィンドウを透明にします。透明化に対応したテーマが必要です。対応していないテーマでは何も起こりません。",
            restartRequired: true,
            warning: IS_WINDOWS
                ? "有効にすると、ウィンドウのサイズ変更ができなくなり、画面の端へスナップすることもできなくなります。"
                : "有効にすると、ウィンドウのサイズ変更ができなくなります。",
        },
        IS_DISCORD_DESKTOP && {
            key: "disableMinSize",
            title: "ウィンドウの最小サイズを無効にする",
            description: "Discord の最小サイズより小さいサイズにも、ウィンドウをリサイズできるようにします",
            restartRequired: true
        },
        !IS_WEB && IS_WINDOWS && {
            key: "winCtrlQ",
            title: "Ctrl+Q を Discord を閉じるショートカットとして登録する",
            description: "Discord を閉じるキーボードショートカットとして Ctrl+Q を追加します。Alt+F4 の代わりとして、すばやくアプリを閉じられます。",
            restartRequired: true,
        },
        !IS_WEB && {
            key: "enableReactDevtools",
            title: "React Developer Tools を有効にする",
            description: "主にプラグイン開発者向けの設定です。何のことか分からない場合は気にしなくて大丈夫です",
            restartRequired: true
        },
    ] satisfies Array<false | {
        key: KeysOfType<typeof settings, boolean>;
        reactKey?: string;
        title: string;
        description?: string;
        restartRequired?: boolean;
        warning?: string;
        updateSetting?(newValue: boolean): void;
        value?: boolean;
    }>;

    return Switches.map(setting => {
        if (!setting) {
            return null;
        }

        const { reactKey, key, value, title, description, restartRequired, warning, updateSetting = v => (settings[key] = v) } = setting;

        return (
            <FormSwitch
                key={reactKey ?? key}
                title={title}
                description={
                    warning ? (
                        <>
                            {description}
                            <Notice.Warning className={Margins.top8} style={{ width: "100%" }}>
                                {warning}
                            </Notice.Warning>
                        </>
                    ) : (
                        description
                    )
                }
                value={value ?? settings[key]}
                hideBorder
                onChange={v => {
                    updateSetting(v);

                    if (restartRequired) {
                        promptToRestart("relaunch");
                    }
                }}
            />
        );
    });
}

function EquicordSettings() {
    const donateImage = useMemo(() =>
        Math.random() > 0.5 ? DEFAULT_DONATE_IMAGE : SHIGGY_DONATE_IMAGE,
        []
    );

    const user = UserStore?.getCurrentUser();

    return (
        <SettingsTab>
            {(isEquicordDonor(user?.id) || isVencordDonor(user?.id)) ? (
                <SpecialCard
                    title="寄付"
                    subtitle="寄付ありがとうございます！"
                    description={
                        isEquicordDonor(user?.id) && isVencordDonor(user?.id)
                            ? "すべての Vencord ユーザーにはあなたの Vencord 寄付者バッジが、Equicord ユーザーにはあなたの Equicord 寄付者バッジが見えます。Vencord 寄付者バッジを変更したい場合は @vending.machine に連絡してください。Equicord 寄付者バッジについては、Equicord のサーバーでチケットを作成してください。"
                            : isVencordDonor(user?.id)
                                ? "すべての Vencord ユーザーにあなたのバッジが見えます。特典は @vending.machine にメッセージを送ることで管理できます。"
                                : "すべての Equicord ユーザーにあなたのバッジが見えます。特典は Equicord のサーバーでチケットを作成することで管理できます。"
                    }
                    cardImage={VENNIE_DONATOR_IMAGE}
                    backgroundImage={DONOR_BACKGROUND_IMAGE}
                    backgroundColor="#ED87A9"
                >
                    <DonateButtonComponent donated={true} />
                </SpecialCard>
            ) : (
                <SpecialCard
                    title="プロジェクトを支援する"
                    description="Equicord の開発を支援するため、寄付をご検討ください！"
                    cardImage={donateImage}
                    backgroundImage={DONOR_BACKGROUND_IMAGE}
                    backgroundColor="#c3a3ce"
                >
                    <DonateButtonComponent />
                </SpecialCard>
            )}
            {isAnyPluginDev(user?.id) && (
                <SpecialCard
                    title="コントリビューション"
                    subtitle="コントリビュートありがとうございます！"
                    description="Equicord にコントリビュートしたので、新しいバッジが付きました！"
                    cardImage={COZY_CONTRIB_IMAGE}
                    backgroundImage={CONTRIB_BACKGROUND_IMAGE}
                    backgroundColor="#EDCC87"
                >
                    <Button
                        variant="none"
                        size="medium"
                        type="button"
                        onClick={() => openContributorModal(user)}
                        className="vc-contrib-button"
                    >
                        <GithubIcon aria-hidden fill={"#000000"} className={"vc-contrib-github"} />
                        自分のコントリビューションを見る
                    </Button>
                </SpecialCard>
            )}

            <Heading className={Margins.top16}>クイックアクション</Heading>
            <Paragraph className={Margins.bottom16}>
                よく使う操作へのショートカットです。メニューをたどらなくても、よく使う機能にすぐアクセスできます。
            </Paragraph>

            <QuickActionCard>
                <QuickAction
                    Icon={LogIcon}
                    text="通知ログ"
                    action={openNotificationLogModal}
                />
                <QuickAction
                    Icon={PaintbrushIcon}
                    text="QuickCSS を編集"
                    action={() => VencordNative.quickCss.openEditor()}
                />
                {!IS_WEB && (
                    <QuickAction
                        Icon={RestartIcon}
                        text="Discord を再起動"
                        action={relaunch}
                    />
                )}
                {!IS_WEB && (
                    <QuickAction
                        Icon={FolderIcon}
                        text="設定フォルダーを開く"
                        action={() => VencordNative.settings.openFolder()}
                    />
                )}
                <QuickAction
                    Icon={GithubIcon}
                    text="ソースコードを見る"
                    action={() =>
                        VencordNative.native.openExternal(
                            "https://github.com/" + gitRemote,
                        )
                    }
                />
            </QuickActionCard>

            <Divider className={Margins.top20} />

            <Heading className={Margins.top20}>クライアント設定</Heading>
            <Paragraph className={Margins.bottom16}>
                Equicord の動作や Discord との連携の仕方を設定します。これらの設定は Discord クライアントの見た目と動作に影響します。
            </Paragraph>
            <Notice.Info className={Margins.bottom20} style={{ width: "100%" }}>
                この設定セクションが Discord の設定メニューに表示される位置は、{" "}
                <a
                    role="button"
                    onClick={() => openPluginModal(SettingsPlugin)}
                    style={{ cursor: "pointer", color: "var(--text-link)" }}
                >
                    Settings プラグイン
                </a>で変更できます。
            </Notice.Info>

            <Switches />

            <MacOSVibrancySettings />
            <WindowsMaterialSettings />

            <NotificationSection />
        </SettingsTab >
    );
}

export default wrapTab(EquicordSettings, "Equicord Settings");

export function isEquicordDonor(userId: string): boolean {
    const donorBadges = BadgeAPI.getEquicordDonorBadges(userId);
    return GuildMemberStore.getMember(GUILD_ID, userId)?.roles.includes(DONOR_ROLE_ID) || !!donorBadges;
}

export function isVencordDonor(userId: string): boolean {
    const donorBadges = BadgeAPI.getDonorBadges(userId);
    return GuildMemberStore.getMember(VC_GUILD_ID, userId)?.roles.includes(VC_DONOR_ROLE_ID) || !!donorBadges;
}
