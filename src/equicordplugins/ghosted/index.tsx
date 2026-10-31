/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { findGroupChildrenByChildId } from "@api/ContextMenu";
import { addServerListElement, removeServerListElement, ServerListRenderPosition } from "@api/ServerList";
import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Devs, EquicordDevs } from "@utils/constants";
import { classNameFactory } from "@utils/css";
import definePlugin, { OptionType } from "@utils/types";
import { Channel } from "@vencord/discord-types";
import { Menu, openModal, Tooltip, useEffect, useState } from "@webpack/common";

import { Boo, clearChannelFromGhost, getBooCount, getGhostedChannels, onBooCountChange } from "./Boo";
import { getChannelDisplayName, GhostedUsersModal } from "./GhostedUsersModal";
import { IconGhost } from "./IconGhost";

export const cl = classNameFactory("vc-boo-");

export const settings = definePluginSettings({
    showIndicator: {
        type: OptionType.BOOLEAN,
        description: "サーバーリストの上部にゴーストカウンターを表示します",
        default: true,
        restartNeeded: false
    },
    showDmIcons: {
        type: OptionType.BOOLEAN,
        description: "個別のDMの横にゴーストアイコンを表示します",
        default: true,
        restartNeeded: false
    },
    ignoreGroupDms: {
        type: OptionType.BOOLEAN,
        description: "すべてのグループDMをゴースト化から除外します",
        default: false
    },
    exemptedChannels: {
        type: OptionType.STRING,
        description: "ゴースト化から除外するチャンネルIDのカンマ区切りリスト（DMチャンネルを右クリックしてIDをコピー）",
        default: "",
        restartNeeded: false
    },
    ignoreBots: {
        type: OptionType.BOOLEAN,
        description: "ボットからのDMを無視します",
        default: true,
        restartNeeded: false
    },
    maxInactiveTimeMs: {
        type: OptionType.SELECT,
        description: "この期間内にアクティブなDMだけをゴースト化します",
        options: [
            { label: "無制限", value: 0, default: true },
            { label: "1時間", value: 60 * 60 * 1000 },
            { label: "1日", value: 24 * 60 * 60 * 1000 },
            { label: "1週間", value: 7 * 24 * 60 * 60 * 1000 },
            { label: "1か月", value: 30 * 24 * 60 * 60 * 1000 },
        ],
        restartNeeded: false
    }
});

function BooIndicator() {
    const [count, setCount] = useState(getBooCount());

    useEffect(() => {
        const unsubscribe = onBooCountChange(newCount => {
            setCount(newCount);
        });

        return () => {
            unsubscribe();
        };
    }, []);

    if (!settings.store.showIndicator) return null;

    const handleClick = () => {
        const ghostedChannels = getGhostedChannels();
        openModal(modalProps => (
            <ErrorBoundary>
                <GhostedUsersModal
                    modalProps={modalProps}
                    ghostedChannels={ghostedChannels}
                    onClearGhost={clearChannelFromGhost}
                />
            </ErrorBoundary>
        ));
    };

    const getTooltipText = () => {
        const ghostedChannels = getGhostedChannels();
        if (ghostedChannels.length === 0) {
            return "No Ghosted Users";
        }
        if (ghostedChannels.length <= 5) {
            return ghostedChannels
                .map(id => getChannelDisplayName(id))
                .join(", ");
        }
        return `${ghostedChannels.length} Ghosted Users`;
    };

    return (
        <>
            {settings.store.showIndicator && getGhostedChannels().length > 0 && (
                <div id={cl("container")}>
                    <Tooltip text={getTooltipText()} position="right">
                        {({ onMouseEnter, onMouseLeave }) => (
                            <div
                                id={cl("container")}
                                className={cl("clickable")}
                                onMouseEnter={onMouseEnter}
                                onMouseLeave={onMouseLeave}
                                onClick={handleClick}
                            >
                                {count} <IconGhost fill="currentColor" />
                            </div>
                        )}
                    </Tooltip>
                </div>
            )}
        </>
    );
}

function makeContextItem(props) {
    return <Menu.MenuItem
        id="ec-ghosted-clear"
        key="ec-ghosted-clear"
        label="ゴースト解除"
        action={() => {
            clearChannelFromGhost(props.channel.id);
        }}
    />;
}

export default definePlugin({
    name: "Ghosted",
    description: "DMに返信しないと、かわいいゴーストが現れます",
    tags: ["Chat", "Utility"],
    authors: [EquicordDevs.vei, Devs.sadan, EquicordDevs.justjxke, EquicordDevs.iamme],
    settings,
    dependencies: ["AudioPlayerAPI", "ServerListAPI"],
    contextMenus: {
        "gdm-context": (menuItems, props) => {
            const group = findGroupChildrenByChildId("leave", menuItems, true);
            group?.unshift(makeContextItem(props));
        },
        "user-context": (menuItems, props) => {
            const group = findGroupChildrenByChildId("close-dm", menuItems);
            group?.push(makeContextItem(props));
        }
    },

    patches: [
        {
            find: "PrivateChannel.renderAvatar",
            replacement: {
                match: /\]:\i\|\|\i.{0,50}children:\[/,
                replace: "$&$self.renderBoo(arguments[0]),"
            }
        },
    ],

    renderBoo(props: { channel: Channel; }) {
        return (
            <ErrorBoundary noop>
                <Boo {...props} />
            </ErrorBoundary>
        );
    },

    renderIndicator() {
        return (
            <ErrorBoundary noop>
                <BooIndicator />
            </ErrorBoundary>
        );
    },

    start() {
        addServerListElement(ServerListRenderPosition.Above, this.renderIndicator);
    },

    stop() {
        removeServerListElement(ServerListRenderPosition.Above, this.renderIndicator);
    },
});
