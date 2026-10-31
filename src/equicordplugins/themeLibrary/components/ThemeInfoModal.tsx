/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Button } from "@components/Button";
import { CodeBlock } from "@components/CodeBlock";
import { Heading } from "@components/Heading";
import { Heart } from "@components/Heart";
import { Paragraph } from "@components/Paragraph";
import { Theme, ThemeInfoModalProps } from "@equicordplugins/themeLibrary/types";
import { ClockIcon, WarningIcon } from "@equicordplugins/themeLibrary/utils/Icons";
import { copyToClipboard } from "@utils/clipboard";
import { openInviteModal } from "@utils/discord";
import { Margins } from "@utils/margins";
import type { PluginNative } from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { Modal, openModal, Parser, React, showToast } from "@webpack/common";

import { logger } from "./ThemeTab";

const Native = VencordNative.pluginHelpers.ThemeLibrary as PluginNative<typeof import("../native")>;
const UserSummaryItem = findComponentByCodeLazy("defaultRenderUser", "showDefaultAvatarsForNullUsers");

async function downloadTheme(theme: Theme) {
    try {
        await Native.downloadTheme(theme);
        showToast({ text: `${theme.name} をダウンロードしました！`, variant: "success" });
    } catch (err: unknown) {
        logger.error(err);
        showToast({ text: `${theme.name} のダウンロードに失敗しました！（コンソールを確認してください）`, variant: "critical" });
    }
}

export const ThemeInfoModal: React.FC<ThemeInfoModalProps> = ({ author, theme, ...props }) => {
    const { name, type, content, likes, guild, tags, last_updated, requiresThemeAttributes } = theme;

    const themeContent = window.atob(content);
    const metadata = themeContent.match(/\/\*\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g)?.[0] || "";
    const donate = metadata.match(/@donate\s+(.+)/)?.[1] || "";
    const version = metadata.match(/@version\s+(.+)/)?.[1] || "";
    const invite = metadata.match(/@invite\s+(.+)/)?.[1] || "";

    const authors = Array.isArray(author) ? author : [author];

    const lastUpdated = Math.floor(new Date(last_updated ?? 0).getTime() / 1000);

    return (
        <Modal
            {...props}
            size="md"
            title={`${name} の詳細`}
            actions={[
                {
                    text: "閉じる",
                    variant: "secondary",
                    onClick: () => props.onClose()
                },
                {
                    text: "ダウンロード",
                    variant: "primary",
                    disabled: !theme.content || theme.id === "preview",
                    onClick: async () => {
                        const fileName = `${theme?.name}.theme.css`;

                        const exists = await Native.themeExists(theme);
                        if (exists) {
                            openModal(modalProps => (
                                <Modal
                                    {...modalProps}
                                    size="sm"
                                    title="競合！"
                                    actions={[
                                        {
                                            text: "上書き",
                                            variant: "dangerPrimary",
                                            onClick: async () => {
                                                await downloadTheme(theme);
                                                modalProps.onClose();
                                            }
                                        },
                                        {
                                            text: "自分のファイルを保持",
                                            variant: "positive",
                                            onClick: () => modalProps.onClose()
                                        }
                                    ]}
                                >
                                    <Paragraph style={{ padding: "8px" }}>
                                        <div style={{ display: "flex", flexDirection: "column" }}>
                                            <p>同じ名前のテーマがテーマフォルダに<b>すでに存在します</b>！上書きしますか？</p>
                                            <div className="vce-overwrite-modal">
                                                <code style={{ wordWrap: "break-word" }}>
                                                    {fileName}
                                                </code>
                                            </div>
                                        </div>
                                    </Paragraph>
                                </Modal>
                            ));
                        } else {
                            await downloadTheme(theme);
                        }
                    }
                }
            ]}
        >
            <Heading style={{ marginTop: "10px" }}>{authors.length > 1 ? "作者" : "作者"}</Heading>
            <div style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        <UserSummaryItem
                            users={authors}
                            count={authors.length}
                            guildId={undefined}
                            renderIcon={false}
                            max={4}
                            size={32}
                            showDefaultAvatarsForNullUsers
                            showUserPopout
                            className={Margins.right8}
                        />
                        <Paragraph style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {authors.map(author => author.username).join(", ")}
                        </Paragraph>
                    </div>
                    {version && (
                        <>
                            <Heading style={{ marginTop: "10px" }}>バージョン</Heading>
                            <Paragraph>
                                {version}
                            </Paragraph>
                        </>
                    )}
                    <Heading style={{ marginTop: "10px" }}>いいね</Heading>
                    <Paragraph>
                        {likes === 0 ? `Nobody liked this ${type} yet.` : `${likes} users liked this ${type}!`}
                    </Paragraph>
                    {donate && (
                        <>
                            <Heading style={{ marginTop: "10px" }}>寄付</Heading>
                            <Paragraph>
                                You can support the author by donating below!
                            </Paragraph>
                            <Paragraph style={{ marginTop: "10px" }}>
                                <Button onClick={() => VencordNative.native.openExternal(donate)}>
                                    <Heart />
                                    Donate
                                </Button>
                            </Paragraph>
                        </>
                    )}
                    {(guild || invite) && (
                        <>
                            <Heading style={{ marginTop: "10px" }}>サポートサーバー</Heading>
                            {guild && (
                                <Paragraph>
                                    {guild.name}
                                </Paragraph>
                            )}
                            <Paragraph>
                                <Button
                                    variant="primary"
                                    className={Margins.top8}
                                    onClick={async e => {
                                        e.preventDefault();
                                        const useInvite = guild ? guild.invite_link?.split("discord.gg/")[1] : invite;
                                        useInvite != null && openInviteModal(useInvite).catch(() => showToast({ text: "招待が無効か期限切れです！", variant: "critical" }));
                                    }}
                                >
                                    Join Discord Server
                                </Button>
                            </Paragraph>
                        </>
                    )}
                    <Heading style={{ marginTop: "10px" }}>ソース</Heading>
                    <Paragraph>
                        <Button
                            disabled={!theme.content || theme.id === "preview"}
                            onClick={() => openModal(modalProps => (
                                <Modal
                                    {...modalProps}
                                    size="lg"
                                    title="テーマのソース"
                                    actions={[
                                        {
                                            text: "閉じる",
                                            variant: "dangerPrimary",
                                            onClick: () => modalProps.onClose()
                                        },
                                        {
                                            text: "クリップボードにコピー",
                                            variant: "primary",
                                            onClick: () => {
                                                copyToClipboard(themeContent);
                                                showToast({ text: "クリップボードにコピーしました", variant: "success" });
                                            }
                                        }
                                    ]}
                                >
                                    <Paragraph style={{ padding: "8px" }}>
                                        <CodeBlock lang="css" content={themeContent} />
                                    </Paragraph>
                                </Modal>
                            ))}
                        >
                            View Theme Source
                        </Button>
                    </Paragraph>
                    {tags && (
                        <>
                            <Heading style={{ marginTop: "10px" }}>タグ</Heading>
                            <Paragraph>
                                {tags.map(tag => (
                                    <span className="vce-theme-info-tag" key={"vce-theme-info-tag"}>
                                        {tag}
                                    </span>
                                ))}
                            </Paragraph>
                        </>
                    )}
                    {requiresThemeAttributes && (
                        <Paragraph style={{ marginTop: "10px" }}>
                            <WarningIcon /> このテーマには <b>ThemeAttributes</b> プラグインが必要です！
                        </Paragraph>
                    )}
                    {last_updated && (
                        <Paragraph style={{ marginTop: "10px" }}>
                            <ClockIcon /> This theme was last updated {Parser.parse("<t:" + lastUpdated + ":F>")} ({Parser.parse("<t:" + lastUpdated + ":R>")})
                        </Paragraph>
                    )}
                </div>
            </div>
        </Modal>
    );
};
