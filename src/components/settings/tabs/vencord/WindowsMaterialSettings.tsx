/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { useSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { Heading } from "@components/Heading";
import { Margins } from "@components/margins";
import { Paragraph } from "@components/Paragraph";
import { IS_WINDOWS } from "@utils/constants";
import { Select } from "@webpack/common";

export function WindowsMaterialSettings() {
    const settings = useSettings(["windowsMaterial"]);

    if (!IS_WINDOWS || IS_WEB || !VencordNative.native.supportsWindowsMaterial()) return null;

    return (
        <ErrorBoundary noop>
            <Heading className={Margins.bottom8}>背景マテリアル</Heading>
            <Paragraph className={Margins.bottom8}>
                Windows の透明な背景効果です。透明化に対応したテーマが必要です。対応していないテーマでは何も起こりません。この設定を変更した後は再起動が必要です。
            </Paragraph>

            <Select
                placeholder="なし"
                options={[
                    {
                        label: "なし",
                        value: "none",
                        default: true
                    },
                    {
                        label: "Mica (システムテーマとデスクトップの壁紙を取り込んで背景を描画する)",
                        value: "mica"
                    },
                    {
                        label: "Tabbed (Mica の派生で、背景の色合いが強め)",
                        value: "tabbed"
                    },
                    {
                        label: "Acrylic (Vesktop の背後にあるウィンドウをぼかして半透明の背景にする)",
                        value: "acrylic"
                    }
                ]}
                closeOnSelect={true}
                select={v => (settings.windowsMaterial = v)}
                isSelected={v => v === settings.windowsMaterial}
                serialize={s => s}
            />
        </ErrorBoundary>
    );
}
