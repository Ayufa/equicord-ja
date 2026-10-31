/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";

import { DeleteCacheButton } from "./components/DeleteCacheButton";
import { cl } from "./utils/misc";

const MODEL_SIZES: Record<string, { quantized: string; full: string; gpu: string; }> = {
    "onnx-community/whisper-tiny": { quantized: "~40 MB", full: "~150 MB", gpu: "~75 MB" },
    "onnx-community/whisper-base": { quantized: "~77 MB", full: "~290 MB", gpu: "~145 MB" },
    "onnx-community/whisper-small": { quantized: "~250 MB", full: "~970 MB", gpu: "~490 MB" },
    "onnx-community/whisper-large-v3-turbo": { quantized: "~1.1 GB", full: "~3.2 GB", gpu: "~1.6 GB" },
};

const LEGACY_MODELS: Record<string, string> = {
    "Xenova/whisper-tiny": "onnx-community/whisper-tiny",
    "Xenova/whisper-base": "onnx-community/whisper-base",
    "Xenova/whisper-small": "onnx-community/whisper-small",
    "Xenova/whisper-medium": "onnx-community/whisper-large-v3-turbo",
};

export function migrateLegacyModel() {
    const migrated = LEGACY_MODELS[settings.store.selectedModel];
    if (migrated) settings.store.selectedModel = migrated;
}

function renderModelOption(option?: { label: string; value: string; }) {
    if (!option) return null;
    return <ModelOption option={option} />;
}

function ModelOption({ option }: { option: { label: string; value: string; }; }) {
    const { quantized, useGpu } = settings.use(["quantized", "useGpu"]);
    const size = MODEL_SIZES[option.value]?.[useGpu ? "gpu" : quantized ? "quantized" : "full"];

    return (
        <div className={cl("model-option")}>
            <span>{option.label}</span>
            {size && (
                <span className={cl("model-size")}>
                    {size}
                </span>
            )}
        </div>
    );
}

export const settings = definePluginSettings({
    embed: {
        type: OptionType.BOOLEAN,
        description: "文字起こしをモーダルではなくボイスメッセージの添付部分に直接表示します。",
        default: false,
        restartNeeded: false
    },
    maintainHorizontal: {
        type: OptionType.BOOLEAN,
        description: "埋め込み文字起こしボックスの横幅を維持し、縦に広げます。",
        default: false,
        restartNeeded: false
    },
    selectedModel: {
        type: OptionType.SELECT,
        description: "モデルのサイズ。",
        options: [
            {
                label: "Tiny（最速・最低精度）",
                value: "onnx-community/whisper-tiny",
            },
            {
                label: "Base（推奨）",
                value: "onnx-community/whisper-base",
                default: true
            },
            {
                label: "Small",
                value: "onnx-community/whisper-small"
            },
            {
                label: "Large v3 Turbo（最高精度・GPU推奨）",
                value: "onnx-community/whisper-large-v3-turbo"
            }
        ],
        componentProps: {
            renderOptionLabel: (option: { label: string; value: string; }) => renderModelOption(option),
            renderOptionValue: (options: { label: string; value: string; }[]) => renderModelOption(options?.[0]),
        },
        restartNeeded: false
    },
    useGpu: {
        type: OptionType.BOOLEAN,
        description: "対応している場合はGPU（WebGPU）でモデルを実行します。はるかに高速で、大きなモデルも使えるようになります。利用できない場合はCPUにフォールバックします。",
        default: true,
        restartNeeded: false
    },
    quantized: {
        type: OptionType.BOOLEAN,
        description: "CPUで実行するときに量子化モデルを使います（サイズが小さくなり、品質はわずかに低下します）。",
        default: true,
        restartNeeded: false
    },
    deleteModalFiles: {
        type: OptionType.COMPONENT,
        description: "ストレージからキャッシュファイルを削除します。",
        component: DeleteCacheButton
    }
});
