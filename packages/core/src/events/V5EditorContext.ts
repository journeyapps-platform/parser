export interface V5EditorHelpers<FieldDefinition> {
  /**
   * Return functions from the javascript context in the editor for a view
   */
  viewFunctionsSelection(signature?: string): FieldDefinition;

  /**
   * Return functions from the javascript context in the editor for a navigation view
   */
  navigateFunctionsSelection(signature?: string): FieldDefinition;

  typedBinding(
    options: { types: string[] | null; writable: boolean; constants: boolean },
    defaultValue?: string
  ): FieldDefinition;

  typedBindingOrFunction(
    options: { types: string[] | null; writable: boolean; constants: boolean },
    defaultValue?: string
  ): FieldDefinition;

  // compound(...defs: FieldDefinition[]): FieldDefinition;

  /**
   * One of a set list of values, or a $: function.
   */
  dynamicSet(values: string[], defaultValue?: string): FieldDefinition;

  /**
   * A list of values, or a $: function.
   */
  dynamicList(values: string[], defaultValue?: string[]): FieldDefinition;

  // staticSet(values: string[], defaultValue?: string): FieldDefinition;

  formatString(queryScopeTag?: string): FieldDefinition;

  /**
   * Color selection (constant or function).
   *
   * @param params.text: true if the color is for foreground text
   */
  color(options: { text: boolean }): FieldDefinition;

  /**
   * Name of a built-in icon, or path to an icon.
   */
  icon(options: { includeUploads?: boolean }): FieldDefinition;
}
