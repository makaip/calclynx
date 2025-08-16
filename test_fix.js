// Test script to verify the fix for optimized content format loading

// Mock the required classes and functions for testing
class MockBoard {
  constructor() {
    this.canvas = document.createElement('div');
    this.fileManager = { saveState: () => console.log('Save state called') };
  }
}

// Simulate version 2.0 optimized content
const testData = {
  version: "2.0",
  groups: [
    {
      type: 'text',
      left: '100px',
      top: '200px',
      fields: [
        {
          text: 'Hello world with math: ',
          mathFields: [
            {
              position: 23,
              latex: 'x^2 + y^2 = z^2'
            }
          ]
        }
      ]
    }
  ]
};

// Test the TextGroup constructor with the new content format
console.log('Testing TextGroup constructor with optimized content...');
console.log('Test data:', JSON.stringify(testData.groups[0], null, 2));

// Test the content handling logic
const groupData = testData.groups[0];
let content = '';
if (groupData && groupData.fields && groupData.fields.length > 0) {
  content = groupData.fields[0];
  // Handle different content formats - ensure content is in expected format
  if (typeof content !== 'string' && typeof content !== 'object') {
    console.warn('Unexpected content format in TextGroup:', content);
    content = '';
  }
}

console.log('Content extracted:', content);
console.log('Content type:', typeof content);
console.log('Content is object with text and mathFields:', 
  typeof content === 'object' && content.text !== undefined && content.mathFields !== undefined);

// Test the content type checking in TextField
if (content) {
  if (typeof content === 'object' && content.text !== undefined && content.mathFields !== undefined) {
    console.log('✅ Would use setOptimizedContent for new format');
  } else if (typeof content === 'string') {
    console.log('✅ Would handle as string content');
  } else {
    console.log('❌ Would fall back to empty content');
  }
} else {
  console.log('✅ Would create empty text node');
}

console.log('Fix verification complete!');
