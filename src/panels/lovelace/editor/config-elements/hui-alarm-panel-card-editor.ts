import { html, LitElement, PropertyDeclarations } from "@polymer/lit-element";
import { TemplateResult } from "lit-html";
import "@polymer/paper-dropdown-menu/paper-dropdown-menu";
import "@polymer/paper-item/paper-item";
import "@polymer/paper-listbox/paper-listbox";

import { struct } from "../../common/structs/struct";
import { EntitiesEditorEvent, EditorTarget } from "../types";
import { hassLocalizeLitMixin } from "../../../../mixins/lit-localize-mixin";
import { HomeAssistant } from "../../../../types";
import { LovelaceCardEditor } from "../../types";
import { fireEvent } from "../../../../common/dom/fire_event";
import { Config } from "../../cards/hui-alarm-panel-card";
import { configElementStyle } from "./config-elements-style";

import "../../../../components/entity/ha-entity-picker";
import "../../../../components/ha-icon";

const cardConfigStruct = struct({
  type: "string",
  entity: "string?",
  name: "string?",
  states: "array?",
});

export class HuiAlarmPanelCardEditor extends hassLocalizeLitMixin(LitElement)
  implements LovelaceCardEditor {
  public hass?: HomeAssistant;
  private _config?: Config;

  public setConfig(config: Config): void {
    config = cardConfigStruct(config);

    this._config = { type: "alarm-panel", ...config };
  }

  static get properties(): PropertyDeclarations {
    return { hass: {}, _config: {} };
  }

  get _entity(): string {
    return this._config!.entity || "";
  }

  get _name(): string {
    return this._config!.name || "";
  }

  get _states(): string[] {
    return this._config!.states || [];
  }

  protected render(): TemplateResult {
    if (!this.hass) {
      return html``;
    }

    const states = ["arm_home", "arm_away", "arm_night", "arm_custom_bypass"];

    return html`
      ${configElementStyle} ${this.renderStyle()}
      <div class="card-config">
        <div class="side-by-side">
          <paper-input
            label="Name"
            .value="${this._name}"
            .configValue="${"name"}"
            @value-changed="${this._valueChanged}"
          ></paper-input>
          <ha-entity-picker
            .hass="${this.hass}"
            .value="${this._entity}"
            .configValue=${"entity"}
            domain-filter="alarm_control_panel"
            @change="${this._valueChanged}"
            allow-custom-entity
          ></ha-entity-picker>
        </div>
        <span>Used States</span> ${
          this._states.map((state, index) => {
            return html`
              <div class="states">
                <paper-item>${state}</paper-item>
                <ha-icon
                  class="deleteState"
                  .value="${index}"
                  icon="hass:close"
                  @click=${this._stateRemoved}
                ></ha-icon>
              </div>
            `;
          })
        }
        <paper-dropdown-menu
          label="Available States"
          @value-changed="${this._stateAdded}"
        >
          <paper-listbox slot="dropdown-content">
            ${
              states.map((state) => {
                return html`
                  <paper-item>${state}</paper-item>
                `;
              })
            }
          </paper-listbox>
        </paper-dropdown-menu>
      </div>
    `;
  }

  private renderStyle(): TemplateResult {
    return html`
      <style>
        .states {
          display: flex;
          flex-direction: row;
        }
        .deleteState {
          visibility: hidden;
        }
        .states:hover > .deleteState {
          visibility: visible;
        }
        ha-icon {
          padding-top: 12px;
        }
      </style>
    `;
  }

  private _stateRemoved(ev: EntitiesEditorEvent): void {
    if (!this._config || !this._states || !this.hass) {
      return;
    }

    const target = ev.target! as EditorTarget;
    const index = Number(target.value);
    if (index > -1) {
      const newStates = this._states;
      newStates.splice(index, 1);
      this._config = {
        ...this._config,
        states: newStates,
      };
      fireEvent(this, "config-changed", { config: this._config });
    }
  }

  private _stateAdded(ev: EntitiesEditorEvent): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target! as EditorTarget;
    if (!target.value || this._states.indexOf(target.value) >= 0) {
      return;
    }
    const newStates = this._states;
    newStates.push(target.value);
    this._config = {
      ...this._config,
      states: newStates,
    };
    target.value = "";
    fireEvent(this, "config-changed", { config: this._config });
  }

  private _valueChanged(ev: EntitiesEditorEvent): void {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target! as EditorTarget;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      this._config = {
        ...this._config,
        [target.configValue!]: target.value,
      };
    }
    fireEvent(this, "config-changed", { config: this._config });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "hui-alarm-panel-card-editor": HuiAlarmPanelCardEditor;
  }
}

customElements.define("hui-alarm-panel-card-editor", HuiAlarmPanelCardEditor);
