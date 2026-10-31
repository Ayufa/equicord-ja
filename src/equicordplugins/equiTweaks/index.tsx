/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ApplicationCommandInputType, sendBotMessage } from "@api/Commands";
import { findGroupChildrenByChildId, NavContextMenuPatchCallback } from "@api/ContextMenu";
import { HeaderBarButton } from "@api/HeaderBar";
import { addMessagePreSendListener, removeMessagePreSendListener } from "@api/MessageEvents";
import { isPluginEnabled } from "@api/PluginManager";
import { definePluginSettings, migratePluginSettings, migratePluginToSettings } from "@api/Settings";
import { ShieldIcon, WarningIcon } from "@components/Icons";
import customRPC from "@plugins/customRPC";
import { Devs, EquicordDevs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { StandingState } from "@vencord/discord-types/enums";
import { findByCodeLazy } from "@webpack";
import { ApplicationCommandIndexStore, Menu, React, SafetyHubStore, SettingsRouter, UserGuildSettingsStore, UserStore, useStateFromStores, VoiceStateStore } from "@webpack/common";
import { ComponentType } from "react";

migratePluginSettings("EquiTweaks", "EquicordHelper");
migratePluginToSettings(true, "EquiTweaks", "NoBulletPoints", "noBulletPoints");
migratePluginToSettings(true, "EquiTweaks", "NoModalAnimation", "noModalAnimation");
migratePluginToSettings(true, "EquiTweaks", "GuildTagSettings", "disableAdoptTagPrompt");
migratePluginToSettings(true, "EquiTweaks", "ShowAllBadges", "showAllBadges");

const fetchSafetyHub: () => Promise<void> = findByCodeLazy("SAFETY_HUB_FETCH_START");

const StandingConfig: Record<number, { label: string; hoverColor: string; Icon: ComponentType<any>; }> = {
    [StandingState.ALL_GOOD]: { label: "問題なし！", hoverColor: "var(--status-positive)", Icon: ShieldIcon },
    [StandingState.LIMITED]: { label: "制限あり", hoverColor: "var(--status-warning)", Icon: WarningIcon },
    [StandingState.VERY_LIMITED]: { label: "大幅な制限あり", hoverColor: "var(--orange-345)", Icon: WarningIcon },
    [StandingState.AT_RISK]: { label: "停止の危険あり", hoverColor: "var(--status-danger)", Icon: WarningIcon },
    [StandingState.SUSPENDED]: { label: "停止中", hoverColor: "var(--interactive-muted)", Icon: WarningIcon },
};

function StandingButton() {
    const standing = useStateFromStores([SafetyHubStore], () => SafetyHubStore.getAccountStanding());
    const isInitialized = useStateFromStores([SafetyHubStore], () => SafetyHubStore.isInitialized());
    const [hovered, setHovered] = React.useState(false);

    React.useEffect(() => {
        if (!isInitialized) fetchSafetyHub().catch(() => { });
    }, [isInitialized]);

    const config = StandingConfig[standing?.state] ?? StandingConfig[StandingState.ALL_GOOD];

    return (
        <div style={{ display: "contents" }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
            <HeaderBarButton
                tooltip={config.label}
                position="bottom"
                icon={props => <config.Icon {...props} color={hovered ? config.hoverColor : "currentColor"} />}
                onClick={() => SettingsRouter.openUserSettings("account_standing_panel")}
            />
        </div>
    );
}

const addAutoCorrectMenuItem: NavContextMenuPatchCallback = children => {
    const { enableAutoCorrect, autoCorrect } = settings.use(["enableAutoCorrect", "autoCorrect"]);
    if (!enableAutoCorrect) return;

    const group = findGroupChildrenByChildId("spellcheck-enabled", children, true);
    if (!group) return;

    const idx = group.findIndex(c => c?.props?.id?.includes("spellcheck-enabled"));
    group.splice(idx + 1, 0,
        <Menu.MenuCheckboxItem
            id="vc-enable-autocorrect"
            label="自動修正を有効化"
            checked={autoCorrect}
            action={() => settings.store.autoCorrect = !settings.store.autoCorrect}
        />
    );
};

const listener = async (channelId, msg) => {
    if (!settings.store.noBulletPoints) return;
    msg.content = textProcessing(msg.content);
};

const settings = definePluginSettings({
    noMirroredCamera: {
        type: OptionType.BOOLEAN,
        description: "自分の画面でカメラが鏡像表示されるのを防ぎます",
        restartNeeded: true,
        default: false,
    },
    removeActivitySection: {
        type: OptionType.BOOLEAN,
        description: "メンバーリスト上のアクティビティセクションを削除します",
        restartNeeded: true,
        default: false,
    },
    showYourOwnActivityButtons: {
        type: OptionType.BOOLEAN,
        description: "Discordはなぜか自分のアクティビティボタンを隠します",
        restartNeeded: true,
        default: false,
    },
    refreshSlashCommands: {
        type: OptionType.BOOLEAN,
        description: "クライアントを再起動せずに、新しく追加されたコマンドを表示するようスラッシュコマンドを更新します。",
        default: false,
    },
    forceRoleIcon: {
        type: OptionType.BOOLEAN,
        description: "コンパクトモードでメッセージの横にロールアイコンを強制表示します",
        restartNeeded: true,
        default: false
    },
    accountStandingButton: {
        type: OptionType.BOOLEAN,
        description: "ヘッダーバーにアカウント状態ボタンを表示します",
        restartNeeded: true,
        default: false,
    },
    restoreFileDownloadButton: {
        type: OptionType.BOOLEAN,
        description: "ファイルの右上にダウンロードボタンを復活させます",
        restartNeeded: true,
        default: false
    },
    noBulletPoints: {
        type: OptionType.BOOLEAN,
        description: "Markdownの箇条書きを入力するのを止めます（臭い）",
        restartNeeded: true,
        default: false
    },
    noModalAnimation: {
        type: OptionType.BOOLEAN,
        description: "モーダルを開閉するときの300msのアニメーションを削除します",
        restartNeeded: true,
        default: false
    },
    disableAdoptTagPrompt: {
        type: OptionType.BOOLEAN,
        description: "タグを引き継ぐ確認プロンプトを無効化します",
        restartNeeded: true,
        default: false,
    },
    disableHolidayNotifications: {
        type: OptionType.BOOLEAN,
        description: "常にDiscordのデフォルト通知音を使用します",
        restartNeeded: true,
        default: false,
    },
    jsonGateway: {
        type: OptionType.BOOLEAN,
        description: "ゲートウェイ再接続時にJSONを強制します",
        restartNeeded: true,
        default: false,
    },
    hideVoiceIndicatorForMutedChannels: {
        type: OptionType.BOOLEAN,
        description: "アクティブなチャンネルだけがミュートされているとき、サーバーリストのボイスインジケーターを隠します",
        restartNeeded: true,
        default: false,
    },
    noOnboarding: {
        type: OptionType.BOOLEAN,
        description: "サーバーを言いくるめてオンボーディングをスキップします",
        restartNeeded: true,
        default: false,
    },
    showAllBadges: {
        type: OptionType.BOOLEAN,
        description: "残りを +n に折りたたまず、すべてのプロフィールバッジを表示します",
        restartNeeded: true,
        default: false,
    },
    enableAutoCorrect: {
        type: OptionType.BOOLEAN,
        description: "チャットボックスのコンテキストメニューに、ネイティブの自動修正とテキスト置換の切り替えを追加します",
        restartNeeded: true,
        default: false
    },
    autoCorrect: {
        type: OptionType.BOOLEAN,
        description: "メッセージエディターでネイティブの自動修正とテキスト置換を使用します",
        hidden: true,
        default: false
    }
});

export default definePlugin({
    name: "EquiTweaks",
    description: "Discord向けの小さな調整と修正を集めたプラグインです。",
    tags: ["Appearance", "Commands", "Utility"],
    dependencies: ["CommandsAPI", "HeaderBarAPI"],
    authors: [
        Devs.thororen,
        EquicordDevs.nyx,
        EquicordDevs.Naibuu,
        EquicordDevs.keircn,
        EquicordDevs.SerStars,
        EquicordDevs.mart,
        EquicordDevs.omaw,
        Devs.Samwich,
        Devs.AutumnVN,
        EquicordDevs.auggeeo,
        EquicordDevs.secp192k1,
        EquicordDevs.tie,
        EquicordDevs.itzmeshadow999
    ],
    settings,
    contextMenus: {
        "textarea-context": addAutoCorrectMenuItem
    },
    headerBarButton: {
        icon: ShieldIcon,
        render: () => (settings.store.accountStandingButton ? <StandingButton /> : null),
    },
    patches: [
        // When focused on voice channel or group chat voice call
        {
            find: ".STATUS_WARNING_BACKGROUND})})",
            predicate: () => settings.store.noMirroredCamera,
            replacement: {
                match: /mirror:\i/,
                replace: "mirror:!1"
            },
        },
        // Popout camera when not focused on voice channel
        {
            find: "this.handleReady})",
            all: true,
            predicate: () => settings.store.noMirroredCamera,
            replacement: {
                match: /(\[\i\.\i\]:)\i/,
                replace: "$1!1"
            },
        },
        // Overriding css on Preview Camera/Change Video Background popup
        {
            find: ".PREVIEW_CAMERA_MODAL,",
            replacement: {
                match: /className:\i.\i,(?=children:\()/,
                replace: "$&style:{transform: \"scalex(1)\"},"
            },
            predicate: () => settings.store.noMirroredCamera
        },
        // Remove Activity Section above Member List
        {
            find: ".GLOBAL_FEED});",
            predicate: () => settings.store.removeActivitySection,
            replacement: {
                match: /null==\i\|\|0.{0,100}VIEW_CHANNEL\)&&/,
                replace: "true||$&"
            },
        },
        // Show your own activity buttons because discord removes them for who knows why
        {
            find: ".USER_PROFILE_ACTIVITY_BUTTONS),",
            predicate: () => settings.store.showYourOwnActivityButtons && !isPluginEnabled(customRPC.name),
            replacement: {
                match: /.getId\(\)===\i.id/,
                replace: "$& && false"
            }
        },
        // Force Role Icon
        {
            find: "#{intl::GUILD_COMMUNICATION_DISABLED_ICON_TOOLTIP_BODY}",
            predicate: () => settings.store.forceRoleIcon,
            replacement: {
                match: /(?<=\}\):null\].{0,150}\?2:)0(?=\})/,
                replace: "1"
            }
        },
        // Restore File Download Button
        {
            find: '"VISUAL_PLACEHOLDER":',
            predicate: () => settings.store.restoreFileDownloadButton,
            replacement: {
                match: /(\.downloadUrl,showDownload:)\i/,
                replace: "$1!0"
            }
        },
        // Removes Modal Animation
        {
            find: "DURATION_IN:",
            predicate: () => settings.store.noModalAnimation,
            replacement: {
                match: /300,/,
                replace: "0,",
            }
        },
        // Removes Modal Animation
        {
            find: '="ABOVE"',
            predicate: () => settings.store.noModalAnimation,
            replacement: {
                match: /\?\?300/,
                replace: "??0",
            }
        },
        // Removes Modal Animation
        {
            find: ".SWITCH_THUMB_BACKGROUND_SELECTED_DEFAULT)",
            predicate: () => settings.store.noModalAnimation,
            replacement: {
                match: /200:300/g,
                replace: "0:0",
            },
        },
        {
            find: "GuildTagAvailableCoachmark",
            replacement: {
                match: /return.{0,200}GUILD_TAG_COACHMARK_ASSET/g,
                replace: "return null;$&"
            },
            predicate: () => settings.store.disableAdoptTagPrompt
        },
        {
            find: 'persistKey="SoundpackStore"',
            predicate: () => settings.store.disableHolidayNotifications,
            replacement: {
                match: /(?<=getSoundpack\(\)\{return )\i\.soundpack/,
                replace: '"classic"'
            }
        },
        {
            find: "JSONEncoding",
            replacement: {
                match: /void 0!==\i\?\i:/,
                replace: ""
            },
            predicate: () => settings.store.jsonGateway
        },
        {
            find: "getRecipientId()):null;",
            replacement: [
                {
                    match: /("data-drop-hovering".{0,100}selected:(?:\i|!0),upperBadge:)(\i)(?=,lowerBadge:\i)/g,
                    replace: "$1$self.hasUnmutedVoiceChannel(arguments[0]?.guild?.id)?$2:null"
                },
                {
                    match: /return (\i)\.type===\i\.\i\.GUILD_VOICE/,
                    replace: "$&&&!$self.isChannelMuted($1?.guildId,$1?.id)"
                },
                {
                    match: /\.afkChannelId\).{0,80}.filter\((\i)=>\i\.type===\i\.\i\.VOICE/,
                    replace: "$&&&!$self.isChannelMuted($1?.guildId,$1?.channelId)"
                },
                {
                    match: /\.getAllApplicationStreams\(\).filter\((\i)=>\i\.guildId===\i/,
                    replace: "$&&&!$self.isChannelMuted($1?.guildId,$1?.channelId)"
                },
                {
                    match: /\.getEmbeddedActivitiesForGuild\((\i)\)(?=.{0,100}\.flatMap\(\i=>)/,
                    replace: "$&.filter(e=>!$self.isChannelMuted($1?.guildId,e?.channelId))"
                }
            ],
            predicate: () => settings.store.hideVoiceIndicatorForMutedChannels,
        },
        {
            find: 'type:"GUILD_ONBOARDING_PROMPTS_FETCH_START"',
            replacement: {
                match: /(?<="GUILD_ONBOARDING_PROMPTS_FETCH_SUCCESS",guildId:\i,\.\.\.\i)(?=\})/,
                replace: ",enabled:!1"
            },
            predicate: () => settings.store.noOnboarding
        },
        {
            find: "UserProfileBadgeListRows",
            replacement: {
                match: /let (\i)=\i&&!\i(?=,\i=\1\?Math\.max\()/,
                replace: "let $1=!1"
            },
            predicate: () => settings.store.showAllBadges
        },
        // Add opening profile functionality to some connections
        {
            find: "getPlatformUserUrl:",
            replacement: [
                {
                    match: /name:("(?:Xbox|Epic Games)").{0,180}enabled:!0/g,
                    replace: "$&,getPlatformUserUrl:e=>$self.getPlatformUrl($1, e)"
                }
            ]
        },
        {
            find: "getSlateEditor:()=>",
            replacement: {
                match: /spellCheck:\i(?=,autoFocus:)/,
                replace: "$&,autoCorrect:$self.useAutoCorrect()"
            },
            predicate: () => settings.store.enableAutoCorrect
        },
        {
            find: "onPasteCapture:this.handlePasteCapture",
            replacement: {
                match: /autoCorrect:"off"(?=,"data-can-focus":)/,
                replace: 'autoCorrect:this.props.autoCorrect??"off"'
            },
            predicate: () => settings.store.enableAutoCorrect
        }
    ],
    commands: [
        {
            name: "refresh-commands",
            description: "スラッシュコマンドを更新",
            inputType: ApplicationCommandInputType.BUILT_IN,
            predicate: () => settings.store.refreshSlashCommands,
            execute: async (opts, ctx) => {
                try {
                    ApplicationCommandIndexStore.indices = {};
                    sendBotMessage(ctx.channel.id, { content: "スラッシュコマンドを更新しました。" });
                }
                catch (e) {
                    console.error("[refreshSlashCommands] Failed to refresh commands:", e);
                    sendBotMessage(ctx.channel.id, { content: "コマンドの更新に失敗しました。詳細はコンソールを確認してください。" });
                }
            }
        }
    ],
    start() {
        if (settings.store.noBulletPoints) {
            addMessagePreSendListener(listener);
        }
    },
    stop() {
        if (settings.store.noBulletPoints) {
            removeMessagePreSendListener(listener);
        }
    },
    isChannelMuted(guildId: string, channelId: string) {
        const currentUserVoiceState = VoiceStateStore.getVoiceStateForUser(UserStore.getCurrentUser()?.id);
        if (currentUserVoiceState?.channelId === channelId) return false;
        return UserGuildSettingsStore.isChannelMuted(guildId, channelId);
    },
    hasUnmutedVoiceChannel(guildId: string) {
        const voiceStates = VoiceStateStore.getVoiceStates(guildId);
        const currentUserVoiceState = VoiceStateStore.getVoiceStateForUser(UserStore.getCurrentUser()?.id);

        return Object.values(voiceStates ?? {}).some(voiceState =>
            voiceState?.channelId === currentUserVoiceState?.channelId ||
            !UserGuildSettingsStore.isChannelMuted(guildId, voiceState?.channelId!)
        );
    },
    useAutoCorrect() {
        const { autoCorrect } = settings.use(["autoCorrect"]);
        return autoCorrect ? "on" : "off";
    },
    getPlatformUrl(platform, args) {
        switch (platform) {
            case "Xbox":
                return `https://www.xbox.com/play/user/${encodeURIComponent(args.name)}`;
            case "Epic Games":
                return `https://store.epicgames.com/u/${encodeURIComponent(args.id)}`;
            default:
                return null;
        }
    }
});

function textProcessing(text: string): string {
    return text.replace(/(^|\n)(\s*)([*+-])\s+/g, "$1$2\\$3 ");
}
