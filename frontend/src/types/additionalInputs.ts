/** Core Additional Inputs schema; callback names are metadata, not executable Web actions. */
export interface TypicalField {
  id?: string;
  label?: string;
  type?: string;
  choices?: string[];
  read_only?: boolean;
  precision?: number;
  label_html?: boolean;
}
export interface TypicalPanel {
  id: string;
  label?: string;
  disable?: boolean;
  rows?: { fields: TypicalField[] }[];
  primary_fields?: { rows: { fields: TypicalField[] }[] };
  tabs?: TypicalPanel[];
}
export interface AdditionalTab { label: string; schema: TypicalPanel; main_id: string }
