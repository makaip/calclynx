class TextGroup extends ObjectGroup {
  constructor(board, x, y, data = null) {
    // Call parent constructor with groupType
    super(board, x, y, data, 'text');
    
    // Create single text field
    let content = '';
    if (data && data.fields && data.fields.length > 0) {
      content = data.fields[0];
      // Handle different content formats - ensure content is in expected format
      if (typeof content !== 'string' && typeof content !== 'object') {
        console.warn('Unexpected content format in TextGroup:', content);
        content = '';
      }
    }
    this.textField = new TextField(this, !data, content);
  }
}
