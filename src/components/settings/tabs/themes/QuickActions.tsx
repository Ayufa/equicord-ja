/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Settings } from "@api/Settings";
import { FolderIcon, PaintbrushIcon, PencilIcon, PlusIcon, RestartIcon } from "@components/Icons";
import { QuickAction, QuickActionCard } from "@components/settings";
import { openPluginModal } from "@components/settings/tabs/plugins/PluginModal";
import { findLazy } from "@webpack";
import { React } from "@webpack/common";
import type { ComponentType, Ref, SyntheticEvent } from "react";

import Plugins from "~plugins";

type FileInputType = ComponentType<{
    ref: Ref<HTMLInputElement>;
    onChange: (e: SyntheticEvent<HTMLInputElement>) => void;
    multiple?: boolean;
    filters?: { name?: string; extensions: string[]; }[];
}>;

const FileInput: FileInputType = findLazy(m => m.prototype?.activateUploadDialogue && m.prototype.setRef);

export interface QuickActionsSectionProps {
    fileInputRef: any;
    onFileUpload: (e: SyntheticEvent<HTMLInputElement>) => void;
    refreshLocalThemes: () => void;
}

export function QuickActionsSection({ fileInputRef, onFileUpload, refreshLocalThemes }: QuickActionsSectionProps) {
    return (
        <QuickActionCard>
            {IS_WEB ? (
                <QuickAction
                    text={
                        <span style={{ position: "relative" }}>
                            テーマをアップロード
                            <FileInput
                                ref={fileInputRef}
                                onChange={onFileUpload}
                                multiple={true}
                                filters={[{ extensions: ["css"] }]}
                            />
                        </span>
                    }
                    Icon={PlusIcon}
                />
            ) : (
                <QuickAction
                    text="テーマフォルダーを開く"
                    action={() => VencordNative.themes.openFolder()}
                    Icon={FolderIcon}
                />
            )}
            <QuickAction
                text="不足しているテーマを読み込む"
                action={refreshLocalThemes}
                Icon={RestartIcon}
            />
            <QuickAction
                text="QuickCSS を編集"
                action={() => VencordNative.quickCss.openEditor()}
                Icon={PaintbrushIcon}
            />
            {Settings.plugins.ClientTheme.enabled && (
                <QuickAction
                    text="ClientTheme を編集"
                    action={() => openPluginModal(Plugins.ClientTheme)}
                    Icon={PencilIcon}
                />
            )}
        </QuickActionCard>
    );
}
