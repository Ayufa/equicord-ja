/*
 * Vencord, a modification for Discord's desktop app
 * Copyright (c) 2022 Vendicated and contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

import "./style.css";

import { addMessageAccessory } from "@api/MessageAccessories";
import { definePluginSettings } from "@api/Settings";
import { Devs } from "@utils/constants";
import definePlugin, { OptionType } from "@utils/types";
import { ChannelStore } from "@webpack/common";

import { convert } from "./converter";
import { conversions, ConverterAccessory, ConvertIcon } from "./ConverterAccessory";

export const settings = definePluginSettings({
    myUnits: {
        type: OptionType.SELECT,
        description: "自分が使い、変換先にしたい単位系。デフォルトは帝国単位です",
        options: [
            {
                default: true,
                label: "帝国単位",
                value: "imperial",
            },
            {
                label: "メートル法",
                value: "metric"
            }
        ]
    },
});

export default definePlugin({
    name: "UnitConverter",
    description: "メートル法の単位を帝国単位に、またその逆に変換します",
    dependencies: ["MessagePopoverAPI"],
    tags: ["Utility"],
    authors: [Devs.sadan],
    messagePopoverButton: {
        icon: ConvertIcon,
        render(message) {
            if (!message.content) return null;
            return {
                label: "Convert Units",
                icon: ConvertIcon,
                message,
                channel: ChannelStore.getChannel(message.channel_id),
                onClick: async () => {
                    const setConversion = conversions.get(message.id);
                    if (!setConversion) return;
                    setConversion(convert(message.content));
                }
            };
        }
    },
    start() {
        addMessageAccessory("vc-converter", props => <ConverterAccessory message={props.message} />);
    },
    settings,
});
