/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./badgeDirectory.css";

import { DirectoryBadge } from "@api/Badges";
import { useSettings } from "@api/Settings";
import { Flex } from "@components/Flex";
import { Link } from "@components/Link";
import { Paragraph } from "@components/Paragraph";
import { DonateButton, InviteButton, TranslateButton } from "@components/settings/DonateButton";
import { SpecialCard } from "@components/settings/SpecialCard";
import { PluginCard } from "@components/settings/tabs/plugins/PluginCard";
import { EquicordDevsById, VencordDevsById } from "@utils/constants";
import { fetchUserProfile } from "@utils/discord";
import { pluralize } from "@utils/misc";
import { React, showToast, useEffect, useMemo, UserProfileStore, UserStore, useStateFromStores } from "@webpack/common";

import Plugins, { PluginMeta } from "~plugins";

const DONOR_BACKGROUND_IMAGE = "https://media.discordapp.net/stickers/1311070116305436712.png?size=2048";
const VENNIE_DONATOR_IMAGE = "https://cdn.discordapp.com/emojis/1238120638020063377.png";
const TRANSLATOR_IMAGE = "https://badge.equicord.org/translator.png";
const EQUICORD_DONOR_IMAGE = "https://cdn.discordapp.com/emojis/1026533090627174460.png";

interface BadgeDirectoryDetailProps {
    badge?: DirectoryBadge;
    userId?: string;
    isViewingOtherUser?: boolean;
}

interface BadgeDirectoryDetailContentProps extends BadgeDirectoryDetailProps {
    isContributor: boolean;
    isTranslator: boolean;
    donorType?: "equicord" | "vencord";
}

function BadgeDirectoryDetailContent({
    badge,
    userId,
    isViewingOtherUser,
    isContributor,
    isTranslator,
    donorType
}: BadgeDirectoryDetailContentProps) {
    useSettings();

    const currentUser = useStateFromStores([UserStore], () => UserStore.getCurrentUser());
    const targetUserId = userId ?? badge?.userId ?? (isViewingOtherUser ? undefined : currentUser?.id);
    const isSelf = currentUser?.id === targetUserId || !isViewingOtherUser;

    const user = useStateFromStores([UserStore], () => targetUserId ? UserStore.getUser(targetUserId) : null);
    const profile = useStateFromStores([UserProfileStore], () => targetUserId ? UserProfileStore.getUserProfile(targetUserId) : null);

    useEffect(() => {
        if (!profile && targetUserId && !user?.bot) {
            fetchUserProfile(targetUserId);
        }
    }, [targetUserId, user?.bot, profile]);

    const plugins = useMemo(() => {
        if (!isContributor || !targetUserId) return [];
        const allPlugins = Object.values(Plugins);
        const authorDev = VencordDevsById[targetUserId] || EquicordDevsById[targetUserId];
        const pluginsByAuthor = authorDev
            ? allPlugins.filter(p => p.authors.includes(authorDev))
            : allPlugins.filter(p =>
                PluginMeta[p.name]?.userPlugin && p.authors.some(a => a.id.toString() === targetUserId)
                || p.authors.some(a => a.name === user?.username)
            );

        return pluginsByAuthor
            .filter(p => !p.name.endsWith("API"))
            .sort((a, b) => Number(a.required ?? false) - Number(b.required ?? false));
    }, [isContributor, targetUserId, user?.username]);

    if (isContributor) {
        const ContributedHyperLink = <Link href="https://github.com/Equicord/Equicord">コントリビュート</Link>;

        return (
            <div className="vc-badge-directory-section">
                <Paragraph>
                    {plugins.length
                        ? (isSelf
                            ? <>あなたは {pluralize(plugins.length, "plugin")} に {ContributedHyperLink} しています！</>
                            : <>このユーザーは {pluralize(plugins.length, "plugin")} に {ContributedHyperLink} しています！</>)
                        : (isSelf
                            ? <>あなたはまだプラグインを作成していません。おそらく他の形で {ContributedHyperLink} しています！</>
                            : <>このユーザーはプラグインを作成していません。おそらく他の形で {ContributedHyperLink} しています！</>)}
                </Paragraph>
                {!!plugins.length && (
                    <div className="vc-badge-directory-plugins">
                        {plugins.map(p => (
                            <PluginCard
                                key={p.name}
                                plugin={p}
                                disabled={p.required ?? false}
                                onRestartNeeded={() => showToast({ text: "変更を適用するには再起動してください！" })}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    if (isTranslator) {
        return (
            <div className="vc-badge-directory-section vc-badge-directory-translator vc-badge-directory-dark">
                <SpecialCard
                    className="vc-special-card-dark"
                    subtitle={isSelf ? "翻訳ありがとうございます！" : "このユーザーは Equicord の翻訳者です！"}
                    description={isSelf
                        ? "Equicord の言語サポート拡大に貢献した証として授与されました。"
                        : "コミュニティ向けにコンテンツを翻訳し、Equicord の言語サポートを拡大したコントリビューターに授与されます。"}
                    cardImage={TRANSLATOR_IMAGE}
                    backgroundImage={DONOR_BACKGROUND_IMAGE}
                    backgroundColor="#232428"
                >
                    <Flex gap="0.5em" style={{ marginTop: "0.75em" }}>
                        <TranslateButton variant="overlayPrimary" />
                    </Flex>
                </SpecialCard>
            </div>
        );
    }

    if (donorType) {
        return (
            <div className={`vc-badge-directory-section ${donorType === "equicord" ? "vc-badge-directory-equicord-donor vc-badge-directory-dark" : ""}`}>
                <SpecialCard
                    className={donorType === "equicord" ? "vc-special-card-dark" : ""}
                    title={donorType === "equicord" ? undefined : "寄付"}
                    subtitle={isSelf
                        ? "寄付ありがとうございます！"
                        : donorType === "equicord" ? "このユーザーは Equicord の寄付者です！" : "このユーザーは Vencord の寄付者です！"}
                    description={isSelf
                        ? (donorType === "equicord"
                            ? "特典は Equicord のサーバーでチケットを作成することで管理できます。"
                            : "特典は @vending.machine にメッセージを送ることで管理できます。")
                        : (donorType === "equicord"
                            ? "Equicord を支援して、自分のバッジと特典を手に入れましょう！"
                            : "Vencord を支援して、自分のバッジと特典を手に入れましょう！")}
                    cardImage={donorType === "equicord" ? EQUICORD_DONOR_IMAGE : VENNIE_DONATOR_IMAGE}
                    backgroundImage={DONOR_BACKGROUND_IMAGE}
                    backgroundColor={donorType === "equicord" ? "#232428" : "#ED87A9"}
                >
                    <Flex gap="0.5em" style={{ marginTop: "0.75em" }}>
                        <DonateButton
                            equicord={donorType === "equicord"}
                            variant="overlayPrimary"
                        />
                        <InviteButton variant="secondary" />
                    </Flex>
                </SpecialCard>
            </div>
        );
    }

    return null;
}

export function BadgeDirectoryDetail({
    badge,
    userId,
    isViewingOtherUser
}: BadgeDirectoryDetailProps) {
    const badgeId = String(badge?.badge_id ?? "");
    const originalBadgeId = badge?.originalBadgeId ?? "";
    const iconUrl = badge?.simple_icon_url ?? "";

    const isTranslator = badge?.name === "Equicord Translator";
    const isContributor = ["vencord_contributor_badge", "equicord_contributor_badge", "user_plugin_contributor_badge"].includes(originalBadgeId);
    const donorType = isTranslator ? undefined
        : iconUrl.startsWith("https://badge.equicord.org/badges/") ? "equicord"
            : iconUrl.startsWith("https://badges.vencord.dev/badges/") ? "vencord"
                : undefined;

    if (!isContributor && !donorType && !isTranslator) return null;

    return (
        <BadgeDirectoryDetailContent
            key={badgeId}
            badge={badge}
            userId={userId}
            isViewingOtherUser={isViewingOtherUser}
            isContributor={isContributor}
            isTranslator={isTranslator}
            donorType={donorType}
        />
    );
}
