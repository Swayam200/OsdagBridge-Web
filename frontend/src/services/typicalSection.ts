/** Nested Core schema contracts used by the read-only input dialogs. */

export type InputValues = Record<string, unknown>;
export interface TypicalField {
  id?: string;
  label?: string;
  type?: string;
  choices?: string[];
  read_only?: boolean;
  precision?: number;
  label_html?: boolean;
  text?: string;
  default?: unknown;
  controller?: string;
  modes?: Record<string, TypicalField>;
  mode_choices?: string[];
}
export interface AdditionalSection {
  id?: string;
  title?: string;
  type?: string;
  text?: string;
  column?: number;
  col_span?: number;
  rows?: { fields: TypicalField[] }[];
  checkbox_groups?: { title: string; default_checked?: boolean; items: TypicalField[] }[];
}
export interface TypicalPanel {
  id: string;
  label?: string;
  title?: string;
  schema?: TypicalPanel;
  disable?: boolean;
  label_width?: number;
  top_margin?: number;
  rows?: { fields: TypicalField[] }[];
  primary_fields?: { rows: { fields: TypicalField[] }[]; label_width?: number };
  tabs?: TypicalPanel[];
  layout?: { type: string; column_widths?: number[] };
  sections?: AdditionalSection[];
}
export interface AdditionalTab { label: string; schema: TypicalPanel; main_id: string }
