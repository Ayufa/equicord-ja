/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Heading } from "@components/Heading";
import { IS_MAC } from "@utils/constants";
import { Margins } from "@utils/margins";
import { identity } from "@utils/misc";
import { Select } from "@webpack/common";

export function MacOSVibrancySettings() {
    const settings = useSettings(["macosVibrancyStyle"]);

    if (!IS_MAC || IS_WEB) return null;

    return (
        <ErrorBoundary noop>
            <Heading className={Margins.bottom8}>macOS ウィンドウの Vibrancy スタイル (再起動が必要)</Heading>
            <Select
                className={Margins.bottom20}
                placeholder="ウィンドウの Vibrancy スタイル"
                options={[
                    // Sorted from most opaque to most transparent
                    {
                        label: "Vibrancy なし", value: undefined
                    },
                    {
                        label: "Under Page (ウィンドウの色合い)",
                        value: "under-page"
                    },
                    {
                        label: "Content",
                        value: "content"
                    },
                    {
                        label: "Window",
                        value: "window"
                    },
                    {
                        label: "Selection",
                        value: "selection"
                    },
                    {
                        label: "Titlebar",
                        value: "titlebar"
                    },
                    {
                        label: "Header",
                        value: "header"
                    },
                    {
                        label: "Sidebar",
                        value: "sidebar"
                    },
                    {
                        label: "Tooltip",
                        value: "tooltip"
                    },
                    {
                        label: "Menu",
                        value: "menu"
                    },
                    {
                        label: "Popover",
                        value: "popover"
                    },
                    {
                        label: "Fullscreen UI (透明だが少し落ち着いた色味)",
                        value: "fullscreen-ui"
                    },
                    {
                        label: "HUD (最も透明)",
                        value: "hud"
                    },
                ]}
                select={v => settings.macosVibrancyStyle = v}
                isSelected={v => settings.macosVibrancyStyle === v}
                serialize={identity}
            />
        </ErrorBoundary>
    );
}
