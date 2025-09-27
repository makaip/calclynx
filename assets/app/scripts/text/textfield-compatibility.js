class TextFieldCompatibility {
  static convertV3ToV2(groupData) {
    if (!groupData.fields || !groupData.fields[0]) {
      return groupData;
    }

    const proseMirrorDoc = groupData.fields[0];
    if (typeof proseMirrorDoc !== 'object' || !proseMirrorDoc.type) {
      return groupData;
    }

    try {
      const legacyContent = { text: '', mathFields: [] };
      
      const convertNode = (node) => {
        if (node.type === 'text') {
          legacyContent.text += node.text || '';
        } else if (node.type === 'math') {
          legacyContent.mathFields.push({
            position: legacyContent.text.length,
            latex: (node.attrs && node.attrs.latex) || ''
          });
          legacyContent.text += '\uE000';
        } else if (node.type === 'paragraph') {
          if (node.content) {
            node.content.forEach(convertNode);
          }
          legacyContent.text += '\n';
        }
      };

      if (proseMirrorDoc.content) {
        proseMirrorDoc.content.forEach(convertNode);
      }

      if (legacyContent.text.endsWith('\n')) {
        legacyContent.text = legacyContent.text.slice(0, -1);
      }

      return {
        ...groupData,
        fields: [legacyContent]
      };
    } catch (error) {
      console.error('Error converting v3.0 content to legacy format:', error);
      return groupData; 
    }
  }

  static convertV2ToV3(content, schema) {
    if (!schema || !content) return null;

    const { text, mathFields } = content;
    
    const mathFieldMap = new Map();
    mathFields.forEach(field => {
      mathFieldMap.set(field.position, field.latex);
    });

    const paragraphs = text.split('\n');
    const docContent = [];

    paragraphs.forEach((paragraphText, paragraphIndex) => {
      const paragraphContent = [];
      let textBuffer = '';

      for (let i = 0; i < paragraphText.length; i++) {
        const char = paragraphText[i];
        const globalPos = this.getGlobalPosition(paragraphs, paragraphIndex, i);

        if (char === '\uE000') {
          if (textBuffer) {
            paragraphContent.push(schema.text(textBuffer));
            textBuffer = '';
          }
          
          const mathLatex = mathFieldMap.get(globalPos) || '';
          paragraphContent.push(schema.nodes.math.create({ latex: mathLatex }));
        } else {
          textBuffer += char;
        }
      }

      if (textBuffer) {
        paragraphContent.push(schema.text(textBuffer));
      }

      docContent.push(schema.nodes.paragraph.create(null, paragraphContent));
    });

    if (docContent.length === 0) {
      docContent.push(schema.nodes.paragraph.create());
    }

    return schema.nodes.doc.create(null, docContent);
  }

  static getGlobalPosition(paragraphs, paragraphIndex, offset) {
    let globalPos = 0;
    for (let i = 0; i < paragraphIndex; i++) {
      globalPos += paragraphs[i].length + 1; // +1 for newline
    }
    return globalPos + offset;
  }

  static detectContentFormat(content) {
    if (!content) return 'empty';
    
    if (typeof content === 'string') {
      return 'legacy-string';
    }
    
    if (typeof content === 'object') {
      if (content.type && content.content) {
        return 'prosemirror-v3';
      } else if (content.text !== undefined && content.mathFields !== undefined) {
        return 'optimized-v2';
      }
    }
    
    return 'unknown';
  }

  static convertStringToV2(stringContent) {
    return {
      text: stringContent || '',
      mathFields: []
    };
  }

  static shouldUseProseMirror() {
    const proseMirrorModulesReady = window.proseMirrorReady && window.ProseMirror;
    const textFieldClassReady = typeof TextFieldProseMirror !== 'undefined';
    
    return proseMirrorModulesReady && textFieldClassReady;
  }

  static getTextFieldClass() {
    if (this.shouldUseProseMirror()) {
      return {
        class: TextFieldProseMirror,
        version: '3.0',
        useProseMirror: true
      };
    } else {
      throw new Error('No TextField implementation available');
    }
  }

  static normalizeContent(content, targetVersion, schema = null) {
    const format = this.detectContentFormat(content);
    
    if (targetVersion === '3.0') {
      switch (format) {
        case 'prosemirror-v3':
          return content;
        case 'optimized-v2':
          return content; // to be converted by PM content manager
        case 'legacy-string':
          return this.convertStringToV2(content);
        case 'empty':
        default:
          return null;
      }
    } else if (targetVersion === '2.0') {
      switch (format) {
        case 'prosemirror-v3':
          return content;
        case 'optimized-v2':
          return content;
        case 'legacy-string':
          return this.convertStringToV2(content);
        case 'empty':
        default:
          return { text: '', mathFields: [] };
      }
    }
    
    return content;
  }
}