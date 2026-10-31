/*
 * Vencord, a Discord client mod
 * Copyright (c) 2024 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { BaseText } from "@components/BaseText";
import { Button } from "@components/Button";
import { Flex } from "@components/Flex";
import { InfoIcon } from "@components/Icons";
import { copyWithToast, openUserProfile } from "@utils/discord";
import { LazyComponent } from "@utils/react";
import { Channel, RenderModalProps, type User } from "@vencord/discord-types";
import { find, findByCodeLazy } from "@webpack";
import { Alerts, ChannelStore, closeAllModals, ContextMenuApi, FluxDispatcher, GuildStore, Menu, Modal, NavigationRouter, openModal, React, TabBar, TextInput, Tooltip, useMemo, useRef, useState } from "@webpack/common";

import { DBMessageRecord, deleteMessageIDB, deleteMessagesBulkIDB } from "../db";
import { cl, clearLogs, settings } from "../index";
import { LoggedMessage, LoggedMessageJSON } from "../types";
import { messageJsonToMessageClass } from "../utils";
import { importLogs } from "../utils/settingsUtils";
import { useMessages } from "./hooks";

export interface MessagePreviewProps {
    className: string;
    author: User;
    message: LoggedMessage;
    channel: Channel,
    compact: boolean;
    isGroupStart: boolean;
    hideSimpleEmbedContent: boolean;
}

const PrivateChannelRecord = findByCodeLazy(".is_message_request_timestamp,");
const MessagePreview = LazyComponent<MessagePreviewProps>(() => find(m => m?.type?.toString().includes("previewLinkTarget:") && !m?.type?.toString().includes("HAS_THREAD")));

export enum LogTabs {
    DELETED = "Deleted",
    EDITED = "Edited",
    GHOST_PING = "Ghost Pinged"
}

const LogTabLabels: Record<LogTabs, string> = {
    [LogTabs.DELETED]: "削除済み",
    [LogTabs.EDITED]: "編集済み",
    [LogTabs.GHOST_PING]: "ゴーストピング"
};

interface Props {
    modalProps: RenderModalProps;
    initalQuery?: string;
}

export function LogsModal({ modalProps, initalQuery }: Props) {
    const [currentTab, setCurrentTab] = useState(LogTabs.DELETED);
    const [queryEh, setQuery] = useState(initalQuery ?? "");
    const [sortNewest, setSortNewest] = useState(settings.store.sortNewest);
    const [numDisplayedMessages, setNumDisplayedMessages] = useState(settings.store.messagesToDisplayAtOnceInLogs);
    const contentRef = useRef<HTMLDivElement | null>(null);

    const { messages, total, statusTotal, pending, reset } = useMessages(queryEh, currentTab, sortNewest, numDisplayedMessages);

    return (
        <Modal
            {...modalProps}
            size="lg"
            title={
                <div className={cl("modal")}>
                    <TabBar
                        type="top"
                        look="brand"
                        className={cl("modal-tab-bar")}
                        selectedItem={currentTab}
                        onItemSelect={e => {
                            setCurrentTab(e);
                            setNumDisplayedMessages(settings.store.messagesToDisplayAtOnceInLogs);
                            contentRef.current?.firstElementChild?.scrollTo(0, 0);
                        }}
                    >
                        <TabBar.Item
                            className={cl("modal-tab-bar-item")}
                            id={LogTabs.DELETED}
                        >
                            削除済み
                        </TabBar.Item>
                        <TabBar.Item
                            className={cl("modal-tab-bar-item")}
                            id={LogTabs.EDITED}
                        >
                            編集済み
                        </TabBar.Item>
                        <TabBar.Item
                            className={cl("modal-tab-bar-item")}
                            id={LogTabs.GHOST_PING}
                        >
                            ゴーストピング
                        </TabBar.Item>
                    </TabBar>
                    <div className={cl("modal-filter")}>
                        <TextInput value={queryEh} onChange={e => setQuery(e)} placeholder="メッセージをフィルター" />
                    </div>
                </div>
            }
            actions={[
                {
                    text: `${sortNewest ? "古い順" : "新しい順"}に並び替え`,
                    variant: "secondary",
                    onClick: () => {
                        setSortNewest(e => {
                            const val = !e;
                            settings.store.sortNewest = val;
                            return val;
                        });
                        contentRef.current?.firstElementChild?.scrollTo(0, 0);
                    }
                },
                {
                    text: "表示中のログをクリア",
                    variant: "critical-secondary",
                    disabled: messages?.length === 0,
                    onClick: () => Alerts.show({
                        title: "ログをクリア",
                        body: `${messages.length} 件のログをクリアしてもよろしいですか？`,
                        confirmText: "クリア",
                        confirmVariant: "critical-primary",
                        cancelText: "キャンセル",
                        onConfirm: async () => {
                            await deleteMessagesBulkIDB(messages.map(e => e.message_id));
                            reset();
                        }
                    })
                },
                {
                    text: "すべてのログをクリア",
                    variant: "critical-primary",
                    onClick: () => Alerts.show({
                        title: "ログをクリア",
                        body: "すべてのログをクリアしてもよろしいですか？",
                        confirmText: "クリア",
                        confirmVariant: "critical-primary",
                        cancelText: "キャンセル",
                        onConfirm: async () => {
                            await clearLogs();
                            reset();
                        }
                    })
                }
            ]}
        >
            <div style={{ opacity: modalProps.transitionState === 1 ? "1" : "0" }} className={`${cl("modal-content-container")} ${cl("modal-root")}`} ref={contentRef}>
                {
                    modalProps.transitionState === 1 &&
                    <div>
                        {pending && (
                            <LoadingLogs tab={currentTab} />
                        )}

                        {!pending && messages != null && total === 0 && (
                            <EmptyLogs
                                hasQuery={queryEh.length !== 0}
                                reset={reset}
                            />
                        )}

                        {!pending && messages != null && (
                            <LogsContentMemo
                                visibleMessages={messages}
                                canLoadMore={messages.length < statusTotal && messages.length >= settings.store.messagesToDisplayAtOnceInLogs}
                                tab={currentTab}
                                sortNewest={sortNewest}
                                reset={reset}
                                handleLoadMore={() => setNumDisplayedMessages(e => e + settings.store.messagesToDisplayAtOnceInLogs)}
                            />
                        )}
                    </div>
                }
            </div>
        </Modal>
    );
}

interface LogContentProps {
    sortNewest: boolean;
    tab: LogTabs;
    visibleMessages: DBMessageRecord[];
    canLoadMore: boolean;
    reset: () => void;
    handleLoadMore: () => void;
}

function LogsContent({ visibleMessages, canLoadMore, sortNewest, tab, reset, handleLoadMore }: LogContentProps) {
    if (visibleMessages.length === 0)
        return <NoResults tab={tab} />;

    return (
        <div className={cl("modal-content-inner")}>
            {visibleMessages
                .map(({ message }, i) => (
                    <LMessage
                        key={message.id}
                        log={{ message }}
                        reset={reset}
                        isGroupStart={isGroupStart(message, visibleMessages[i - 1]?.message, sortNewest)}
                    />
                ))}
            {
                canLoadMore &&
                <Button
                    style={{ marginTop: "1rem", width: "100%" }}
                    size="small" onClick={() => handleLoadMore()}
                >
                    さらに読み込む
                </Button>
            }
        </div>
    );
}

const LogsContentMemo = LazyComponent(() => LogsContent);

function NoResults({ tab }: { tab: LogTabs; }) {
    const generateSuggestedTabs = (tab: LogTabs) => {
        switch (tab) {
            case LogTabs.DELETED:
                return { nextTab: LogTabs.EDITED, lastTab: LogTabs.GHOST_PING };
            case LogTabs.EDITED:
                return { nextTab: LogTabs.GHOST_PING, lastTab: LogTabs.DELETED };
            case LogTabs.GHOST_PING:
                return { nextTab: LogTabs.DELETED, lastTab: LogTabs.EDITED };
            default:
                return { nextTab: "", lastTab: "" };
        }
    };

    const { nextTab, lastTab } = generateSuggestedTabs(tab);

    return (
        <div className={cl("modal-empty-logs", "modal-content-inner")} style={{ textAlign: "center" }}>
            <BaseText size="lg">
                <b>{LogTabLabels[tab]}</b> には結果がありません。
            </BaseText>
            <BaseText size="lg" style={{ marginTop: "0.2rem" }}>
                <b>{LogTabLabels[nextTab as LogTabs]}</b> や <b>{LogTabLabels[lastTab as LogTabs]}</b> を試してみてください
            </BaseText>
        </div>
    );
}

function EmptyLogs({ hasQuery, reset: forceUpdate }: { hasQuery: boolean; reset: () => void; }) {
    return (
        <div className={cl("modal-empty-logs", "modal-content-inner")} style={{ textAlign: "center" }}>
            <Flex flexDirection="column" style={{ position: "relative" }}>

                <BaseText size="lg">
                    空っぽです
                </BaseText>

                {!hasQuery && (
                    <>
                        <Tooltip text="ML Enhanced はログを IndexedDB に保存するようになりました。ログフォルダーから古いログをインポートする必要があります。インポートしても既存のログは上書きされません">
                            {({ onMouseEnter, onMouseLeave }) => (
                                <div
                                    className={cl("modal-info-icon")}
                                    onMouseEnter={onMouseEnter}
                                    onMouseLeave={onMouseLeave}
                                >
                                    <InfoIcon />
                                </div>
                            )}
                        </Tooltip>

                        <Button onClick={() => importLogs().then(() => forceUpdate())}>
                            ログをインポート
                        </Button>
                    </>
                )}
            </Flex>
        </div>
    );
}

function LoadingLogs({ tab }: { tab: LogTabs; }) {
    return (
        <div className={cl("modal-empty-logs", "modal-content-inner")} style={{ textAlign: "center" }}>
            <Flex flexDirection="column" style={{ position: "relative" }}>
                <BaseText size="lg">
                    {LogTabLabels[tab]} のログを読み込み中...
                </BaseText>
            </Flex>
        </div>
    );

}

interface LMessageProps {
    log: { message: LoggedMessageJSON; };
    isGroupStart: boolean,
    reset: () => void;
}
function LMessage({ log, isGroupStart, reset, }: LMessageProps) {
    const message = useMemo(() => messageJsonToMessageClass(log), [log]);

    if (!message) return null;

    const channel = ChannelStore.getChannel(message?.channel_id);
    const guild = GuildStore.getGuild(channel?.guild_id);

    return (
        <div
            onContextMenu={e => {
                ContextMenuApi.openContextMenu(e, () =>
                    <Menu.Menu
                        navId="message-logger"
                        onClose={() => FluxDispatcher.dispatch({ type: "CONTEXT_MENU_CLOSE" })}
                        aria-label="Message Logger"
                    >

                        <Menu.MenuItem
                            key="jump-to-message"
                            id="jump-to-message"
                            label="メッセージへ移動"
                            action={() => {
                                NavigationRouter.transitionTo(`/channels/${ChannelStore.getChannel(message.channel_id)?.guild_id ?? "@me"}/${message.channel_id}${message.id ? "/" + message.id : ""}`);
                                closeAllModals();
                            }}
                        />
                        <Menu.MenuItem
                            key="open-user-profile"
                            id="open-user-profile"
                            label="ユーザープロフィールを開く"
                            action={() => {
                                closeAllModals();
                                openUserProfile(message.author.id);
                            }}
                        />

                        <Menu.MenuItem
                            key="copy-content"
                            id="copy-content"
                            label="内容をコピー"
                            action={() => copyWithToast(message.content)}
                        />

                        <Menu.MenuItem
                            key="copy-user-id"
                            id="copy-user-id"
                            label="ユーザー ID をコピー"
                            action={() => copyWithToast(message.author.id)}
                        />

                        <Menu.MenuItem
                            key="copy-message-id"
                            id="copy-message-id"
                            label="メッセージ ID をコピー"
                            action={() => copyWithToast(message.id)}
                        />

                        <Menu.MenuItem
                            key="copy-channel-id"
                            id="copy-channel-id"
                            label="チャンネル ID をコピー"
                            action={() => copyWithToast(message.channel_id)}
                        />

                        {
                            log.message.guildId != null
                            && (
                                <Menu.MenuItem
                                    key="copy-server-id"
                                    id="copy-server-id"
                                    label="サーバー ID をコピー"
                                    action={() => copyWithToast(log.message.guildId!)}
                                />
                            )
                        }

                        <Menu.MenuItem
                            key="delete-log"
                            id="delete-log"
                            label="ログを削除"
                            color="danger"
                            action={() =>
                                deleteMessageIDB(log.message.id).then(() => reset())
                            }
                        />

                    </Menu.Menu>
                );
            }}>
            <MessagePreview
                className={`${cl("modal-msg-preview")} ${message.deleted ? "messagelogger-deleted" : ""}`}
                author={message.author}
                message={message}
                channel={ChannelStore.getChannel(message.channel_id) || new PrivateChannelRecord({ id: "" })}
                compact={false}
                isGroupStart={isGroupStart}
                hideSimpleEmbedContent={false}
            />
            {settings.store.ShowWhereMessageIsFrom && channel?.isDM() && message?.author && (
                <span className={`${cl("modal-from")} ${message.deleted ? cl("modal-from-deleted") : cl("modal-from-edited")}`}>{message.author.username} の DM から</span>
            )}
            {settings.store.ShowWhereMessageIsFrom && channel?.isGroupDM() && channel?.name && (
                <span className={`${cl("modal-from")} ${message.deleted ? cl("modal-from-deleted") : cl("modal-from-edited")}`}>{channel.name} グループ DM から</span>
            )}
            {settings.store.ShowWhereMessageIsFrom && !channel?.isDM() && !channel?.isGroupDM() && channel?.name && guild?.name && (
                <span className={`${cl("modal-from")} ${message.deleted ? cl("modal-from-deleted") : cl("modal-from-edited")}`}>{guild.name} の {channel.name} から</span>
            )}
        </div>
    );
}

export const openLogModal = (initalQuery?: string) => openModal(modalProps => <LogsModal modalProps={modalProps} initalQuery={initalQuery} />);

function isGroupStart(
    currentMessage: LoggedMessageJSON | undefined,
    previousMessage: LoggedMessageJSON | undefined,
    sortNewest: boolean
) {
    if (!currentMessage || !previousMessage) return true;

    if (currentMessage.id === previousMessage.id) return true;

    const [newestMessage, oldestMessage] = sortNewest
        ? [previousMessage, currentMessage]
        : [currentMessage, previousMessage];

    if (newestMessage.author.id !== oldestMessage.author.id) return true;

    const timeDifferenceInMinutes = Math.abs(
        (new Date(newestMessage.timestamp)?.getTime() - new Date(oldestMessage.timestamp)?.getTime()) / (1000 * 60)
    );

    return timeDifferenceInMinutes >= 5;
}
